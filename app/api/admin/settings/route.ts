import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAdminApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import {
  getAdminPanelSettings,
  getSiteSettings,
  upsertAdminPanelSettings,
  upsertSiteSettings,
} from "@/src/lib/domain/settings";
import { adminSettingsUpdateSchema } from "@/src/lib/validators/site-settings-schema";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  const [site, adminPanel] = await Promise.all([
    getSiteSettings(auth.context.supabase),
    getAdminPanelSettings(auth.context.supabase),
  ]);

  return NextResponse.json({
    data: {
      site,
      admin_panel: adminPanel,
    },
  });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const payload = adminSettingsUpdateSchema.parse(await request.json());
    const { supabase, userId } = auth.context;

    const [beforeSite, beforePanel] = await Promise.all([
      getSiteSettings(supabase),
      getAdminPanelSettings(supabase),
    ]);

    const site = await upsertSiteSettings(payload.site, supabase);
    if (!site) {
      return NextResponse.json({ error: "No se pudo guardar site_settings." }, { status: 400 });
    }

    let adminPanel = beforePanel;
    if (payload.admin_panel) {
      const next = await upsertAdminPanelSettings(payload.admin_panel, supabase);
      if (!next) {
        return NextResponse.json(
          { error: "No se pudo guardar admin_panel_settings." },
          { status: 400 },
        );
      }
      adminPanel = next;
    }

    await writeAuditLog(supabase, {
      actor_id: userId,
      action: "settings.updated",
      entity_type: "settings",
      entity_id: site.id,
      before_json: {
        site: beforeSite,
        admin_panel: beforePanel,
      },
      after_json: {
        site,
        admin_panel: adminPanel,
      },
    });

    return NextResponse.json({
      data: {
        site,
        admin_panel: adminPanel,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Datos de ajustes no válidos.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ error: "Error interno al guardar ajustes." }, { status: 500 });
  }
}
