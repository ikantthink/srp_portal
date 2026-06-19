import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Clone the incoming request headers so we can inject `x-pathname` for
  // server components to read via `headers()`. Setting headers on the
  // response (`supabaseResponse.headers.set(...)`) only exposes them to the
  // client; injecting via `NextResponse.next({ request: { headers } })` is
  // how Next.js makes them visible to upstream RSC rendering.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/portal")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role || "user";

    const adminOnlyPaths = ["/portal/website", "/portal/newsletters"];
    const superAdminPaths = ["/portal/super-admin"];

    if (
      superAdminPaths.some((p) => pathname.startsWith(p)) &&
      role !== "super_admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }

    if (
      adminOnlyPaths.some((p) => pathname.startsWith(p)) &&
      role === "user"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    return NextResponse.redirect(url);
  }

  // Mirror the pathname onto the response headers as well so client-side
  // debugging tools (and tests) can inspect it without re-reading the URL.
  supabaseResponse.headers.set("x-pathname", request.nextUrl.pathname);

  return supabaseResponse;
}
