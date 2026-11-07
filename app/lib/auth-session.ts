import { createHmac, timingSafeEqual } from "crypto";

export type SessionProfile = { sub: string; email: string; name?: string; picture?: string; exp: number };

export function readProfileSession(value: string | undefined): SessionProfile | null {
  const secret = process.env.AUTH_SECRET;
  if (!value || !secret) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const supplied = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) return null;
  try {
    const profile = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionProfile;
    return profile.sub && profile.email && profile.exp > Date.now() ? profile : null;
  } catch { return null; }
}

export function createRegistrationMarker(subject: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return `${subject}.${createHmac("sha256", secret).update(subject).digest("base64url")}`;
}

export function hasRegistrationMarker(value: string | undefined, subject: string) {
  const secret = process.env.AUTH_SECRET;
  if (!value || !secret) return false;
  const [storedSubject, signature, extra] = value.split(".");
  if (storedSubject !== subject || !signature || extra) return false;
  const expected = createHmac("sha256", secret).update(subject).digest("base64url");
  const supplied = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return supplied.length === expectedBuffer.length && timingSafeEqual(supplied, expectedBuffer);
}
