import "server-only";

import { brandConfig } from "@/content/brand";

type ResolveChannelOptions = {
  toFallback?: string | null;
};

export type EmailChannelConfig = {
  to: string | null;
  from: string;
  userConfirmationEnabled: boolean;
};

export type CommercialEmailConfig = {
  resendApiKey: string | null;
  contact: EmailChannelConfig;
  quote: EmailChannelConfig;
};

const DEFAULT_FROM_EMAIL = `${brandConfig.name} <onboarding@resend.dev>`;

function clean(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function resolveContactChannel(options: ResolveChannelOptions): EmailChannelConfig {
  const to =
    clean(process.env.CONTACT_TO_EMAIL) ??
    clean(options.toFallback) ??
    clean(brandConfig.contact.email);

  const from =
    clean(process.env.CONTACT_FROM_EMAIL) ??
    clean(process.env.DEFAULT_FROM_EMAIL) ??
    DEFAULT_FROM_EMAIL;

  return {
    to,
    from,
    userConfirmationEnabled: parseBooleanEnv(
      process.env.CONTACT_USER_CONFIRMATION_ENABLED,
      false,
    ),
  };
}

function resolveQuoteChannel(options: ResolveChannelOptions): EmailChannelConfig {
  const to =
    clean(process.env.QUOTE_TO_EMAIL) ??
    clean(process.env.CONTACT_TO_EMAIL) ??
    clean(options.toFallback) ??
    clean(brandConfig.contact.email);

  const from =
    clean(process.env.QUOTE_FROM_EMAIL) ??
    clean(process.env.CONTACT_FROM_EMAIL) ??
    clean(process.env.DEFAULT_FROM_EMAIL) ??
    DEFAULT_FROM_EMAIL;

  return {
    to,
    from,
    userConfirmationEnabled: parseBooleanEnv(
      process.env.QUOTE_USER_CONFIRMATION_ENABLED,
      false,
    ),
  };
}

export function getCommercialEmailConfig(options?: {
  contactToFallback?: string | null;
  quoteToFallback?: string | null;
}): CommercialEmailConfig {
  return {
    resendApiKey: clean(process.env.RESEND_API_KEY),
    contact: resolveContactChannel({ toFallback: options?.contactToFallback }),
    quote: resolveQuoteChannel({ toFallback: options?.quoteToFallback }),
  };
}

