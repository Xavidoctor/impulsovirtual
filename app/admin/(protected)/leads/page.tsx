import { ModulePlaceholder } from "@/components/admin/ModulePlaceholder";
import { requireEditorPage } from "@/src/lib/auth/require-page-role";

export default async function AdminLeadsPage() {
  await requireEditorPage();

  return (
    <ModulePlaceholder
      title="Contactos"
      description="La bandeja de formularios y flujo de estados para contactos se activa en P4."
      phase="P4"
    />
  );
}
