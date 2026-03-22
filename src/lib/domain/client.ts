import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { Database } from "@/src/types/database.types";

export type DomainSupabaseClient = SupabaseClient<Database>;

export function toDomainClient(client?: DomainSupabaseClient): DomainSupabaseClient {
  if (client) {
    return client;
  }

  return createSupabaseAdminClient();
}

export function getOptionalDomainClient(client?: DomainSupabaseClient): DomainSupabaseClient | null {
  try {
    return toDomainClient(client);
  } catch {
    return null;
  }
}

export function isMissingRelationError(error: unknown, relation: string) {
  if (!error || typeof error !== "object") return false;
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  return message.includes(`relation "${relation}"`) || message.includes(`table "${relation}"`);
}
