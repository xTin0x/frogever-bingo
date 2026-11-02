import { formatWeekLabel } from "@/lib/bingo";
import {
  getDiscordBotToken,
  getDiscordOAuthConfig,
  getDiscordWebhookUrl,
  getRedirectUri,
} from "@/lib/env";

const DISCORD_API = "https://discord.com/api/v10";
const OAUTH_SCOPES = "identify guilds.members.read";

export type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

export type DiscordGuildMember = {
  nick: string | null;
  user?: {
    username: string;
    global_name: string | null;
  };
};

export function discordAuthorizeUrl(request: Request, state: string): string {
  const { clientId } = getDiscordOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(request),
    response_type: "code",
    scope: OAUTH_SCOPES,
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(request: Request, code: string) {
  const { clientId, clientSecret } = getDiscordOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(request),
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Discord authorization code");
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Discord token response was missing access_token");
  }
  return data.access_token;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Discord user");
  }
  return (await response.json()) as DiscordUser;
}

export async function fetchDiscordGuildMember(
  accessToken: string
): Promise<DiscordGuildMember | null> {
  const { guildId } = getDiscordOAuthConfig();
  const response = await fetch(
    `${DISCORD_API}/users/@me/guilds/${guildId}/member`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Failed to fetch Discord server membership");
  }
  return (await response.json()) as DiscordGuildMember;
}

export async function fetchDiscordGuildMemberByUserId(
  userId: string
): Promise<DiscordGuildMember | null> {
  const { guildId } = getDiscordOAuthConfig();
  const response = await fetch(
    `${DISCORD_API}/guilds/${guildId}/members/${encodeURIComponent(userId)}`,
    {
      headers: { Authorization: `Bot ${getDiscordBotToken()}` },
      cache: "no-store",
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Failed to fetch Discord server member");
  }
  return (await response.json()) as DiscordGuildMember;
}

export async function postSubmissionWebhook(input: {
  displayName: string;
  username: string;
  weekId: string;
  board1Score: number;
  board2Score: number;
  totalScore: number;
  lifetimeTotal: number;
  updated: boolean;
}): Promise<boolean> {
  const webhookUrl = getDiscordWebhookUrl();
  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "frog Weekly Bingo",
      embeds: [
        {
          title: input.updated
            ? "Scores Updated"
            : "Scores Submitted",
          description: `**${input.displayName}** (\`${input.username}\`) reported scores for the week of ${formatWeekLabel(input.weekId)}.`,
          color: 0x5865f2,
          fields: [
            {
              name: "Guild Contribution",
              value: `${input.board1Score} / 10`,
              inline: true,
            },
            {
              name: "Personal Progression",
              value: `${input.board2Score} / 10`,
              inline: true,
            },
            {
              name: "Weekly Points",
              value: `**${input.totalScore} / 20**`,
              inline: true,
            },
            {
              name: "Total Points",
              value: `**${input.lifetimeTotal}**`,
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  return response.ok;
}
