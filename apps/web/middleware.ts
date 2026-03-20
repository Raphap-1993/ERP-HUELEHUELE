import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_COOKIE = "huelegood_maintenance_bypass";
const MAINTENANCE_QUERY_PARAM = "maintenance_bypass";
const MAINTENANCE_PATH = "/maintenance.html";

function isMaintenanceEnabled() {
  return process.env.WEB_MAINTENANCE_MODE === "true";
}

function getBypassToken() {
  return process.env.WEB_MAINTENANCE_BYPASS_TOKEN?.trim() || "";
}

function isExcludedPath(pathname: string) {
  return (
    pathname === "/health" ||
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/brand") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

export function middleware(request: NextRequest) {
  if (!isMaintenanceEnabled()) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const bypassToken = getBypassToken();
  const bypassCookie = request.cookies.get(MAINTENANCE_COOKIE)?.value;
  const bypassQuery = searchParams.get(MAINTENANCE_QUERY_PARAM);

  if (bypassToken && bypassQuery === bypassToken) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.searchParams.delete(MAINTENANCE_QUERY_PARAM);

    const response = NextResponse.redirect(nextUrl);
    response.cookies.set({
      name: MAINTENANCE_COOKIE,
      value: bypassToken,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/"
    });
    return response;
  }

  if (bypassToken && bypassCookie === bypassToken) {
    return NextResponse.next();
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = MAINTENANCE_PATH;
  maintenanceUrl.search = "";
  return NextResponse.rewrite(maintenanceUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
