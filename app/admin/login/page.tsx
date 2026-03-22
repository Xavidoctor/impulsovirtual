import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const db = supabase as unknown as { from: (table: string) => any };
    let profileResult = await db
      .from("admin_profiles")
      .select("role, is_active")
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    if (profileResult.error) {
      profileResult = await supabase
        .from("admin_profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .maybeSingle();
    }

    const { data: profile } = profileResult as {
      data: { role: "admin" | "editor"; is_active: boolean } | null;
      error: { message?: string } | null;
    };

    if (profile?.is_active && (profile.role === "admin" || profile.role === "editor")) {
      redirect("/admin");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#090909] px-4 text-white">
      <AdminLoginForm />
    </main>
  );
}
