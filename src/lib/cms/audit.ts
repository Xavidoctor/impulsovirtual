import "server-only";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { TablesInsert } from "@/src/types/database.types";

type ServerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type AuditInsertInput = Omit<TablesInsert<"audit_logs">, "id" | "created_at">;

export async function writeAuditLog(
  supabase: ServerSupabase,
  payload: AuditInsertInput,
) {
  const { error } = await supabase.from("audit_logs").insert(payload);

  if (error) {
    // Audit logs should not block critical operations in this phase.
    console.error("audit_logs insert failed", error.message);
  }
}
