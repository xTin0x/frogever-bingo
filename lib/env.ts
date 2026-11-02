function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl(request: Request): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const origin = request.headers.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (!host) {
    throw new Error("Unable to determine app URL");
  }
  return `${proto}://${host}`;
}

export function getDiscordOAuthConfig() {
  return {
    clientId: required("DISCORD_CLIENT_ID"),
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    guildId: required("DISCORD_GUILD_ID"),
  };
}

export function getDiscordBotToken(): string {
  return required("DISCORD_BOT_TOKEN");
}

export function getDiscordWebhookUrl(): string {
  const webhookUrl =
    process.env.DISCORD_WEBHOOK_URL?.trim() ??
    process.env.DISCORD_WEBHOOK?.trim();
  if (!webhookUrl) {
    throw new Error(
      "Missing required environment variable: DISCORD_WEBHOOK_URL"
    );
  }
  return webhookUrl;
}

export function getDatabaseUrl(): string {
  return required("DATABASE_URL");
}

export function getSessionSecret(): string {
  const secret = required("SESSION_SECRET");
  if (secret.length < 16) {
    throw new Error("SESSION_SECRET must be at least 16 characters");
  }
  return secret;
}

export function getBingoAdminUserIds(): string[] {
  const configured =
    process.env.BINGO_ADMIN_USER_IDS?.trim() ??
    process.env.BINGO_ADMIN_USER_ID?.trim();
  if (!configured) {
    throw new Error(
      "Missing required environment variable: BINGO_ADMIN_USER_IDS"
    );
  }

  const userIds = configured.split(",").map((userId) => userId.trim()).filter(Boolean);
  if (userIds.length === 0) {
    throw new Error("BINGO_ADMIN_USER_IDS must contain at least one user ID");
  }
  return userIds;
}

export function isBingoAdminUser(userId: string): boolean {
  try {
    return getBingoAdminUserIds().includes(userId);
  } catch {
    return false;
  }
}

export function getRedirectUri(request: Request): string {
  const fromEnv = process.env.DISCORD_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return `${getAppUrl(request)}/api/auth/discord/callback`;
}
