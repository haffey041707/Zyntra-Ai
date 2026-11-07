import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createRegistrationMarker, hasRegistrationMarker } from "@/app/lib/auth-session";

type TokenResponse = { access_token?: string; error?: string };
type GoogleUser = { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL || request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("zyntra_google_state")?.value;
  const mode = request.cookies.get("zyntra_google_mode")?.value === "signup" ? "signup" : "signin";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const authSecret = process.env.AUTH_SECRET;

  if (!code || !state || state !== expectedState || !clientId || !clientSecret || !authSecret) {
    return NextResponse.redirect(new URL("/signin?error=google-auth-failed", appUrl));
  }

  const redirectUri = new URL("/api/auth/google/callback", appUrl).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    cache: "no-store",
  });
  const token = (await tokenResponse.json()) as TokenResponse;
  if (!tokenResponse.ok || !token.access_token) return NextResponse.redirect(new URL("/signin?error=google-token-failed", appUrl));

  const userResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store",
  });
  const user = (await userResponse.json()) as GoogleUser;
  if (!userResponse.ok || !user.sub || !user.email || !user.email_verified) return NextResponse.redirect(new URL("/signin?error=google-profile-failed", appUrl));

  if (mode === "signin" && !hasRegistrationMarker(request.cookies.get("zyntra_google_account")?.value, user.sub)) {
    const response = NextResponse.redirect(new URL("/signup?notice=create-account-first", appUrl));
    response.cookies.set("zyntra_google_state", "", { maxAge: 0, path: "/" });
    response.cookies.set("zyntra_google_mode", "", { maxAge: 0, path: "/" });
    return response;
  }

  const payload = Buffer.from(JSON.stringify({ sub: user.sub, email: user.email, name: user.name, picture: user.picture, exp: Date.now() + 1000 * 60 * 60 * 8 })).toString("base64url");
  const signature = createHmac("sha256", authSecret).update(payload).digest("base64url");
  const response = NextResponse.redirect(new URL("/?signedIn=google", appUrl));
  response.cookies.set("zyntra_google_state", "", { maxAge: 0, path: "/" });
  response.cookies.set("zyntra_google_mode", "", { maxAge: 0, path: "/" });
  if (mode === "signup") {
    response.cookies.set("zyntra_google_account", createRegistrationMarker(user.sub), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/",
    });
  }
  response.cookies.set("zyntra_profile", `${payload}.${signature}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/",
  });
  return response;
}
