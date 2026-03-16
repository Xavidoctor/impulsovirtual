import { draftMode } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireEditorApi } from "@/src/lib/auth/require-api-role";
import { previewPayloadSchema } from "@/src/lib/validators/release-schema";

function sanitizePreviewPath(path: string) {
  if (!path.startsWith("/")) {
    return "/";
  }
  if (path.startsWith("//")) {
    return "/";
  }
  return path;
}

export async function POST(request: NextRequest) {
  try {
    const payload = previewPayloadSchema.parse(await request.json());
    const expectedSecret = process.env.CMS_PREVIEW_SECRET;
    const hasValidSecret =
      Boolean(expectedSecret) && payload.secret === expectedSecret;

    if (!hasValidSecret) {
      const auth = await requireEditorApi();
      if (!auth.ok) {
        return auth.response;
      }
    }

    const draft = await draftMode();
    if (payload.enabled) {
      draft.enable();
    } else {
      draft.disable();
    }

    return NextResponse.json({
      success: true,
      enabled: payload.enabled,
      path: sanitizePreviewPath(payload.path),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Payload de vista previa no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    void error;
    return NextResponse.json({ error: "Error interno al gestionar la vista previa." }, { status: 500 });
  }
}
