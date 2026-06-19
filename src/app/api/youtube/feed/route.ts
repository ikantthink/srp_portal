import { NextResponse } from "next/server";
import { isIntegrationEnabled } from "@/lib/integrations/status";

// 15-minute cache on both the underlying fetches and this route's response.
export const revalidate = 900;

interface VideoItem {
  id: string;
  title: string;
  publishedAt?: string;
  viewCount?: number;
  thumbnail: string;
}

type FeedSource = "api" | "rss" | "oembed";

interface FeedResponse {
  videos: VideoItem[];
  source: FeedSource;
  error?: string;
}

function ok(body: FeedResponse) {
  // Always 200 so the block can render a friendly empty state on errors.
  return NextResponse.json(body, { status: 200 });
}

function clampCount(raw: string | null, fallback = 12): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(50, Math.floor(n)));
}

function pickOrder(raw: string | null): "date" | "viewCount" | "relevance" {
  if (raw === "viewCount" || raw === "relevance") return raw;
  return "date";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const mode = params.get("mode") === "manual" ? "manual" : "channel";
  const channelId = params.get("channelId")?.trim() ?? "";
  const idsParam = params.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const count = clampCount(params.get("count"));
  const order = pickOrder(params.get("order"));

  const apiKey = process.env.YOUTUBE_API_KEY;
  const integrationLive = await isIntegrationEnabled("youtube");
  const useApi = !!apiKey && integrationLive;

  try {
    if (mode === "manual") {
      if (ids.length === 0) {
        return ok({ videos: [], source: useApi ? "api" : "oembed" });
      }
      if (useApi) {
        const videos = await fetchVideosListApi(ids, apiKey!);
        return ok({ videos, source: "api" });
      }
      const videos = await fetchManualOembed(ids);
      return ok({ videos, source: "oembed" });
    }

    // channel mode
    if (!channelId) {
      return ok({ videos: [], source: useApi ? "api" : "rss" });
    }

    if (useApi) {
      const videos = await fetchChannelApi(channelId, count, order, apiKey!);
      return ok({ videos, source: "api" });
    }
    const videos = await fetchChannelRss(channelId, count);
    return ok({ videos, source: "rss" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return ok({ videos: [], source: useApi ? "api" : mode === "manual" ? "oembed" : "rss", error: message });
  }
}

// ---------- YouTube Data API v3 paths ----------

async function fetchChannelApi(
  channelId: string,
  count: number,
  order: "date" | "viewCount" | "relevance",
  apiKey: string
): Promise<VideoItem[]> {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(
    channelId
  )}&type=video&order=${order}&maxResults=${count}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl, { next: { revalidate: 900 } });
  if (!searchRes.ok) throw new Error(`YouTube search failed: ${searchRes.status}`);
  const searchJson = (await searchRes.json()) as {
    items?: Array<{ id?: { videoId?: string } }>;
  };
  const videoIds = (searchJson.items ?? [])
    .map((it) => it.id?.videoId)
    .filter((v): v is string => !!v);
  if (videoIds.length === 0) return [];

  return fetchVideosListApi(videoIds, apiKey);
}

async function fetchVideosListApi(ids: string[], apiKey: string): Promise<VideoItem[]> {
  const listUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(
    ids.join(",")
  )}&key=${apiKey}`;
  const listRes = await fetch(listUrl, { next: { revalidate: 900 } });
  if (!listRes.ok) throw new Error(`YouTube videos failed: ${listRes.status}`);
  const listJson = (await listRes.json()) as {
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        publishedAt?: string;
        thumbnails?: {
          high?: { url?: string };
          medium?: { url?: string };
          default?: { url?: string };
        };
      };
      statistics?: { viewCount?: string };
    }>;
  };
  const items = listJson.items ?? [];
  // Preserve incoming id order so manual mode lists feel deterministic.
  const byId = new Map(items.map((it) => [it.id, it]));
  return ids
    .map((id) => byId.get(id))
    .filter((it): it is NonNullable<typeof it> => !!it)
    .map((it) => ({
      id: it.id,
      title: it.snippet?.title ?? "",
      publishedAt: it.snippet?.publishedAt,
      viewCount: it.statistics?.viewCount ? Number(it.statistics.viewCount) : undefined,
      thumbnail:
        it.snippet?.thumbnails?.high?.url ||
        it.snippet?.thumbnails?.medium?.url ||
        it.snippet?.thumbnails?.default?.url ||
        defaultThumb(it.id),
    }));
}

// ---------- Public/fallback paths ----------

function defaultThumb(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Channel RSS. The feed always exposes the latest ~15 videos and lacks view
 * counts, so we slice to `count` and leave `viewCount` undefined.
 */
async function fetchChannelRss(channelId: string, count: number): Promise<VideoItem[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const res = await fetch(feedUrl, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`YouTube RSS failed: ${res.status}`);
  const xml = await res.text();

  // Regex over <entry>…</entry> blocks; cheap and dependency-free. We only
  // need a handful of fields and the feed schema is stable.
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const videos: VideoItem[] = [];
  for (const entry of entries) {
    const id = pickTag(entry, "yt:videoId");
    if (!id) continue;
    const title = pickTag(entry, "title") ?? "";
    const published = pickTag(entry, "published");
    const thumbMatch = entry.match(/<media:thumbnail\s+[^>]*url="([^"]+)"/);
    videos.push({
      id,
      title,
      publishedAt: published,
      thumbnail: thumbMatch?.[1] || defaultThumb(id),
    });
    if (videos.length >= count) break;
  }
  return videos;
}

function pickTag(haystack: string, tag: string): string | undefined {
  const escaped = tag.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(`<${escaped}>([\\s\\S]*?)<\\/${escaped}>`);
  const m = haystack.match(re);
  return m?.[1]?.trim();
}

/**
 * Manual oEmbed. We fan out one request per id in parallel and tolerate
 * per-id failures so a single bad id doesn't poison the whole response.
 */
async function fetchManualOembed(ids: string[]): Promise<VideoItem[]> {
  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${id}`
        )}&format=json`;
        const res = await fetch(oembedUrl, { next: { revalidate: 900 } });
        if (!res.ok) return null;
        const json = (await res.json()) as { title?: string };
        return {
          id,
          title: json.title ?? "",
          thumbnail: defaultThumb(id),
        } satisfies VideoItem;
      } catch {
        return null;
      }
    })
  );
  return results.filter((v): v is VideoItem => v !== null);
}
