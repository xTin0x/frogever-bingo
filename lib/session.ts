import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/env";

export const SESSION_COOKIE = "frog_session";
export const OAUTH_STATE_COOKIE = "frog_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Session = {
  discordUserId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  exp: number;
};

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function encodeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Session;
    if (
      typeof session.discordUserId !== "string" ||
      typeof session.username !== "string" ||
      typeof session.displayName !== "string" ||
      typeof session.exp !== "number" ||
      session.exp < Date.now()
    ) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
