import "server-only";

import { getSupabasePublicEnv } from "@/src/lib/supabase/config";

export type SupabaseHealthCheck = {
  ok: boolean;
  status: number;
  checkedAt: string;
  message: string;
};

export async function checkSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const { url, publishableKey } = getSupabasePublicEnv();

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      cache: "no-store",
    });

    const ok = response.status < 500;

    return {
      ok,
      status: response.status,
      checkedAt: new Date().toISOString(),
      message: ok
        ? "Supabase REST endpoint reachable."
        : "Supabase REST endpoint returned server error.",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error.";

    return {
      ok: false,
      status: 0,
      checkedAt: new Date().toISOString(),
      message,
    };
  }
}
