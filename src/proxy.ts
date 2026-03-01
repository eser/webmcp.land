import { NextRequest, NextResponse } from "next/server";

const permanentRedirects: Record<string, string> = {
  "/vibe": "/categories/vibe",
  "/sponsors": "/categories/sponsors",
  "/embed-preview": "/embed",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permanent redirects (migrated from next.config.ts)
  const redirectTarget = permanentRedirects[pathname];
  if (redirectTarget) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTarget;
    return NextResponse.redirect(url.toString(), 308);
  }

  // Rewrite .resource.md and .resource.yml requests to the raw API route
  if (pathname.startsWith("/registry/") && (pathname.endsWith(".resource.md") || pathname.endsWith(".resource.yml"))) {
    const id = pathname.slice("/registry/".length);
    const url = request.nextUrl.clone();
    url.pathname = `/api/resources/${id}/raw`;
    return NextResponse.rewrite(url.toString());
  }

  // Add pathname header for layout detection
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
