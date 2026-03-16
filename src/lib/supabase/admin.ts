import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/src/types/database.types";
import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
} from "@/src/lib/supabase/config";

let adminClient: SupabaseClient<Database> | undefined;

export function createSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const { url } = getSupabasePublicEnv();
  const secretKey = getSupabaseServiceRoleKey();

  adminClient = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
