import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireEditorPage();

  return <AdminShell email={profile.email} role={profile.role}>{children}</AdminShell>;
}
