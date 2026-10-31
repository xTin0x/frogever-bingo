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

export function getDiscordConfig() {
  return {
    clientId: required("DISCORD_CLIENT_ID"),
    clientSecret: required("DISCORD_CLIENT_SECRET"),
    guildId: required("DISCORD_GUILD_ID"),
    webhookUrl: required("DISCORD_WEBHOOK_URL"),
  };
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

export function getBingoAdminUserId(): string {
  return required("BINGO_ADMIN_USER_ID");
}

export function getRedirectUri(request: Request): string {
  const fromEnv = process.env.DISCORD_REDIRECT_URI?.trim();
  if (fromEnv) return fromEnv;
  return `${getAppUrl(request)}/api/auth/discord/callback`;
}
