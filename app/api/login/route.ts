import { NextResponse, type NextRequest } from "next/server";
import { PIN_COOKIE, PIN_COOKIE_MAX_AGE, isRateLimited, recordFailedAttempt, requestIp, verifyPin } from "@/lib/pin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip = requestIp(request.headers);

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!verifyPin(pin)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "That PIN isn't right. Try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PIN_COOKIE, pin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PIN_COOKIE_MAX_AGE,
  });
  return response;
}
