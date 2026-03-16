import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";
import { requireAdminPage } from "@/src/lib/auth/require-page-role";

export default async function AdminUsersPage() {
  await requireAdminPage();

  return (
    <ModulePlaceholder
      title="Usuarios"
      description="La gestión de usuarios internos (administrador/editor) se mantiene restringida al rol administrador."
      phase="P4"
    />
  );
}
