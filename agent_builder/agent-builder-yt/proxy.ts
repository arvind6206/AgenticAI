import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// A quick cookie check so signed-out users go straight to /login.
// The real session check still happens on the server in requireAuth().
function isProtected(path: string) {
  return path === "/" || path.startsWith("/agents");
}

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = getSessionCookie(request);

  if (isProtected(path) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
