import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi, requireEditorApi } from "@/src/lib/auth/require-api-role";
import { writeAuditLog } from "@/src/lib/cms/audit";
import { listSettings, upsertSetting } from "@/src/lib/cms/queries";
import { parseSettingValue, settingUpsertSchema } from "@/src/lib/validators/settings-schema";

async function handleUpsert(request: NextRequest) {
  const auth = await requireAdminApi();
  if (!auth.ok) {
    return auth.response;
  }

  const payload = settingUpsertSchema.parse(await request.json());
  const parsedValue = parseSettingValue(payload.key, payload.valueJson);
  const { supabase, userId } = auth.context;

  const { data: before } = await supabase
    .from("site_settings")
    .select("*")
    .eq("key", payload.key)
    .maybeSingle();

  const { data, error } = await upsertSetting(supabase, {
    key: payload.key,
    value_json: parsedValue,
    updated_by: userId,
  });

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar el ajuste." }, { status: 400 });
  }

  await writeAuditLog(supabase, {
    actor_id: userId,
    action: "setting.upserted",
    entity_type: "site_setting",
    entity_id: payload.key,
    before_json: before,
    after_json: data,
  });

  return NextResponse.json({ data });
}

export async function GET() {
  const auth = await requireEditorApi();
  if (!auth.ok) {
    return auth.response;
  }

  const { data, error } = await listSettings(auth.context.supabase);
  if (error) {
    return NextResponse.json({ error: "No se pudieron cargar los ajustes." }, { status: 400 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  return handleUpsert(request);
}

export async function PUT(request: NextRequest) {
  return handleUpsert(request);
}
