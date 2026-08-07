import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const isPublicAuthPage =
    request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup";

  if (!user && !isPublicAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|nexxabyte-logo.svg|icon.svg).*)"],
};
