import { NextResponse } from "next/server";

import { brandConfig } from "@/content/brand";
import {
  renderQuoteRequestInternalEmail,
  renderQuoteRequestUserConfirmationEmail,
} from "@/src/lib/email/quote-request-email";
import { getCommercialEmailConfig } from "@/src/lib/email/config";
import { sendResendEmail } from "@/src/lib/email/sender";
import { createQuoteRequest } from "@/src/lib/domain/quote-requests";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { quoteRequestPublicSchema } from "@/src/lib/validators/quote-request-public-schema";

function clean(value: string | null | undefined) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = quoteRequestPublicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
        { status: 400 },
      );
    }

    if ((parsed.data.website ?? "").trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const supabase = createSupabaseAdminClient();
    const created = await createQuoteRequest(
      {
        full_name: parsed.data.fullName.trim(),
        email: parsed.data.email.trim(),
        phone: clean(parsed.data.phone),
        company: clean(parsed.data.company),
        project_type: clean(parsed.data.projectType),
        requested_services: parsed.data.requestedServices,
        budget_range: clean(parsed.data.budgetRange),
        deadline: clean(parsed.data.deadline),
        project_summary: parsed.data.projectSummary.trim(),
        references: clean(parsed.data.references),
        status: "new",
      },
      supabase,
    );

    if (!created) {
      return NextResponse.json(
        { error: "No se pudo registrar la solicitud. Inténtalo de nuevo." },
        { status: 500 },
      );
    }

    const warnings: string[] = [];
    const emailConfig = getCommercialEmailConfig({
      quoteToFallback: brandConfig.contact.email,
    });

    if (!emailConfig.quote.to) {
      warnings.push(
        "Solicitud guardada correctamente, pero falta configurar QUOTE_TO_EMAIL para notificar al equipo.",
      );
    } else {
      const internalTemplate = renderQuoteRequestInternalEmail({
        brandName: brandConfig.name,
        quoteId: created.id,
        fullName: created.full_name,
        email: created.email,
        phone: created.phone,
        company: created.company,
        projectType: created.project_type,
        requestedServices: created.requested_services,
        budgetRange: created.budget_range,
        deadline: created.deadline,
        projectSummary: created.project_summary,
        references: created.references,
        submittedAt: created.created_at,
      });

      const internalEmail = await sendResendEmail({
        resendApiKey: emailConfig.resendApiKey,
        from: emailConfig.quote.from,
        to: emailConfig.quote.to,
        subject: internalTemplate.subject,
        html: internalTemplate.html,
        text: internalTemplate.text,
        replyTo: created.email,
      });

      if (!internalEmail.ok) {
        warnings.push(
          "Solicitud guardada correctamente, pero no se pudo enviar la notificación interna.",
        );
      }
    }

    if (emailConfig.quote.userConfirmationEnabled && emailConfig.resendApiKey) {
      const userTemplate = renderQuoteRequestUserConfirmationEmail({
        brandName: brandConfig.name,
        fullName: created.full_name,
        supportEmail: emailConfig.quote.to || brandConfig.contact.email,
      });

      const userEmail = await sendResendEmail({
        resendApiKey: emailConfig.resendApiKey,
        from: emailConfig.quote.from,
        to: created.email,
        subject: userTemplate.subject,
        html: userTemplate.html,
        text: userTemplate.text,
      });

      if (!userEmail.ok) {
        warnings.push(
          "Solicitud guardada correctamente, pero no se pudo enviar la confirmación al usuario.",
        );
      }
    }

    return NextResponse.json({
      success: true,
      id: created.id,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 },
    );
  }
}

