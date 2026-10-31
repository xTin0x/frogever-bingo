import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { discordAuthorizeUrl } from "@/lib/discord";
import { OAUTH_STATE_COOKIE, sessionCookieOptions } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const state = randomBytes(16).toString("hex");
    const store = await cookies();
    store.set(OAUTH_STATE_COOKIE, state, {
      ...sessionCookieOptions(),
      maxAge: 60 * 10,
    });
    return NextResponse.redirect(discordAuthorizeUrl(request, state));
  } catch (error) {
    console.error("Discord OAuth start failed:", error);
    const url = new URL("/", request.url);
    url.searchParams.set("authError", "config");
    return NextResponse.redirect(url);
  }
}
