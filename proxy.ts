import { NextResponse, type NextRequest } from "next/server";
import { PIN_COOKIE, verifyPin } from "@/lib/pin";

export function proxy(request: NextRequest) {
  const cookiePin = request.cookies.get(PIN_COOKIE)?.value ?? "";
  if (verifyPin(cookiePin)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!login|api/login|api/digest|_next/static|_next/image|favicon.ico).*)",
  ],
};
