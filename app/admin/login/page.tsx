import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

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
