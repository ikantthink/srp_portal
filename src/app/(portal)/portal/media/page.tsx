import { listFiles, listFolders, listTags } from "@/actions/media";
import { MediaLibrary } from "@/components/portal/media/media-library";

export default async function MediaPage() {
  const [folders, files, tags] = await Promise.all([
    listFolders(),
    listFiles(),
    listTags(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media</h1>
        <p className="text-muted-foreground">
          Upload, organize, and tag media used across your website and link cards.
        </p>
      </div>

      <MediaLibrary
        initialFolders={folders}
        initialFiles={files}
        initialTags={tags}
      />
    </div>
  );
}
