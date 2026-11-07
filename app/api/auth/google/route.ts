import { NextRequest, NextResponse } from "next/server";

const tenMinutes = 60 * 10;

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || request.nextUrl.origin;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/signin?error=google-not-configured", appUrl));
  }

  const state = crypto.randomUUID();
  const mode = request.nextUrl.searchParams.get("mode") === "signup" ? "signup" : "signin";
  const redirectUri = new URL("/api/auth/google/callback", appUrl).toString();
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("zyntra_google_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tenMinutes,
    path: "/",
  });
  response.cookies.set("zyntra_google_mode", mode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tenMinutes,
    path: "/",
  });
  return response;
}
