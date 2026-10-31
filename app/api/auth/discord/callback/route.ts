import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeDiscordCode,
  fetchDiscordGuildMember,
  fetchDiscordUser,
} from "@/lib/discord";
import {
  encodeSession,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
} from "@/lib/session";

function redirectHome(request: Request, authError?: string) {
  const url = new URL("/", request.url);
  if (authError) url.searchParams.set("authError", authError);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);

  if (oauthError) {
    return redirectHome(request, "denied");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectHome(request, "invalid");
  }

  try {
    const accessToken = await exchangeDiscordCode(request, code);
    const member = await fetchDiscordGuildMember(accessToken);
    if (!member) {
      return redirectHome(request, "not_member");
    }

    const user = await fetchDiscordUser(accessToken);
    const session = encodeSession({
      discordUserId: user.id,
      username: user.username,
      displayName: member.nick ?? user.global_name ?? user.username,
      avatar: user.avatar,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    });

    store.set(SESSION_COOKIE, session, sessionCookieOptions());
    return redirectHome(request);
  } catch (error) {
    console.error("Discord OAuth callback failed:", error);
    return redirectHome(request, "failed");
  }
}
