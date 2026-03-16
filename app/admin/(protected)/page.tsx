import { BootstrapContentAction } from "@/components/admin/BootstrapContentAction";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireEditorPage();

  const [{ count: sectionsCount }, { count: settingsCount }, { count: logsCount }] =
    await Promise.all([
      supabase.from("site_sections").select("*", { count: "exact", head: true }),
      supabase.from("site_settings").select("*", { count: "exact", head: true }),
      supabase.from("audit_logs").select("*", { count: "exact", head: true }),
    ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-5xl tracking-wide">Panel de control</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Bienvenido, {profile.full_name ?? profile.email}. Estado inicial del CMS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Secciones</p>
          <p className="mt-2 text-3xl text-white">{sectionsCount ?? 0}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Ajustes</p>
          <p className="mt-2 text-3xl text-white">{settingsCount ?? 0}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-neutral-500">Auditoría</p>
          <p className="mt-2 text-3xl text-white">{logsCount ?? 0}</p>
        </article>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 text-sm text-neutral-300">
        Fases activas:
        <ul className="mt-2 list-disc space-y-1 pl-5 text-neutral-400">
          <li>P0: autenticación SSR + protección de /admin + roles/RLS base.</li>
          <li>P1: CRUD de Secciones y Ajustes con auditoría básica.</li>
        </ul>
      </div>

      <BootstrapContentAction isAdmin={profile.role === "admin"} />
    </section>
  );
}
