import { NextRequest, NextResponse } from "next/server";
import { readProfileSession } from "@/app/lib/auth-session";

export async function GET(request: NextRequest) {
  const profile = readProfileSession(request.cookies.get("zyntra_profile")?.value);
  if (!profile) return NextResponse.json({ profile: null }, { status: 401 });
  return NextResponse.json({ profile: { email: profile.email, name: profile.name, picture: profile.picture } });
}
