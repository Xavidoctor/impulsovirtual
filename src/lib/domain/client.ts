import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/src/lib/supabase/config";
import type { Database } from "@/src/types/database.types";

export type DomainSupabaseClient = SupabaseClient<Database>;

let publicDomainClient: DomainSupabaseClient | undefined;

function createSupabasePublicDomainClient() {
  if (publicDomainClient) {
    return publicDomainClient;
  }

  const { url, publishableKey } = getSupabasePublicEnv();

  publicDomainClient = createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return publicDomainClient;
}

export function toDomainClient(client?: DomainSupabaseClient): DomainSupabaseClient {
  if (client) {
    return client;
  }

  try {
    return createSupabaseAdminClient();
  } catch {
    return createSupabasePublicDomainClient();
  }
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
