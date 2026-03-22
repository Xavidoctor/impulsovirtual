import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { brandConfig } from "@/content/brand";
import { contactSchema } from "@/lib/contact-schema";
import {
  DEFAULT_CONTACT_NOTIFICATION_EMAIL,
  getAdminPanelSettings,
} from "@/src/lib/cms/admin-panel-settings";
import {
  renderContactInternalEmail,
  renderContactUserConfirmationEmail,
} from "@/src/lib/email/contact-email";
import { getCommercialEmailConfig } from "@/src/lib/email/config";
import { sendResendEmail } from "@/src/lib/email/sender";
import { createLead } from "@/src/lib/domain/leads";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const ipRateMap = new Map<string, number[]>();

function clean(value: string | undefined | null) {
  return (value ?? "").trim();
}

function hashIp(value: string) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function canProceedByRateLimit(ip: string) {
  const now = Date.now();
  const entries = ipRateMap.get(ip) ?? [];
  const fresh = entries.filter((value) => now - value <= RATE_LIMIT_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT_MAX) {
    ipRateMap.set(ip, fresh);
    return false;
  }
  fresh.push(now);
  ipRateMap.set(ip, fresh);
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Datos de formulario invalidos." },
        { status: 400 },
      );
    }

    const data = parsed.data;
    if (clean(data.website).length > 0) {
      return NextResponse.json({ success: true });
    }

    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() ?? "unknown";
    if (!canProceedByRateLimit(ip)) {
      return NextResponse.json(
        { error: "Has enviado demasiadas solicitudes en poco tiempo. Intentalo en 1 minuto." },
        { status: 429 },
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const adminSettings = await getAdminPanelSettings(supabaseAdmin);

    const source = clean(data.source) || "web_contact_form";
    const pageUrl = clean(data.pageUrl);
    const referrer = clean(data.referrer);
    const utmSource = clean(data.utmSource);
    const utmMedium = clean(data.utmMedium);
    const utmCampaign = clean(data.utmCampaign);
    const userAgent = request.headers.get("user-agent") ?? null;
    const ipHash = hashIp(ip);

    const leadNotes = [
      pageUrl ? `page_url: ${pageUrl}` : null,
      referrer ? `referrer: ${referrer}` : null,
      utmSource ? `utm_source: ${utmSource}` : null,
      utmMedium ? `utm_medium: ${utmMedium}` : null,
      utmCampaign ? `utm_campaign: ${utmCampaign}` : null,
      userAgent ? `user_agent: ${userAgent}` : null,
      ipHash ? `ip_hash: ${ipHash}` : null,
    ]
      .filter((item): item is string => Boolean(item))
      .join("\n");

    const insertedLead = await createLead(
      {
        full_name: clean(data.name),
        email: clean(data.email),
        phone: clean(data.phone) || null,
        company: clean(data.company) || null,
        service_interest: clean(data.service),
        message: clean(data.message),
        source,
        status: "new",
        notes: leadNotes || null,
      },
      supabaseAdmin,
    );

    if (!insertedLead) {
      return NextResponse.json(
        { error: "No se pudo guardar tu mensaje. Intentalo de nuevo." },
        { status: 500 },
      );
    }

    const warnings: string[] = [];
    let emailStatus: "sent" | "error" | "skipped" = "skipped";
    let emailProviderId: string | null = null;

    const fallbackToEmail =
      clean(adminSettings.contact_notification_email) || DEFAULT_CONTACT_NOTIFICATION_EMAIL;
    const emailConfig = getCommercialEmailConfig({ contactToFallback: fallbackToEmail });

    const shouldNotifyTeam = adminSettings.contact_notifications_enabled;
    if (shouldNotifyTeam) {
      if (!emailConfig.contact.to) {
        emailStatus = "error";
        warnings.push(
          "Lead guardado correctamente, pero falta configurar CONTACT_TO_EMAIL para notificar al equipo.",
        );
      } else {
        const internalTemplate = renderContactInternalEmail({
          brandName: brandConfig.name,
          leadId: insertedLead.id,
          fullName: insertedLead.full_name,
          email: insertedLead.email,
          phone: insertedLead.phone,
          company: insertedLead.company,
          serviceInterest: insertedLead.service_interest,
          message: insertedLead.message,
          source: insertedLead.source,
          pageUrl: pageUrl || null,
          submittedAt: insertedLead.created_at,
        });

        const internalEmail = await sendResendEmail({
          resendApiKey: emailConfig.resendApiKey,
          from: emailConfig.contact.from,
          to: emailConfig.contact.to,
          subject: internalTemplate.subject,
          html: internalTemplate.html,
          text: internalTemplate.text,
          replyTo: insertedLead.email,
        });

        if (internalEmail.ok) {
          emailStatus = "sent";
          emailProviderId = internalEmail.id;
        } else {
          emailStatus = "error";
          warnings.push(
            "Lead guardado correctamente, pero no se pudo enviar la notificacion interna.",
          );
        }
      }
    }

    const shouldSendUserConfirmation =
      adminSettings.contact_auto_reply_enabled || emailConfig.contact.userConfirmationEnabled;

    if (shouldSendUserConfirmation && emailConfig.resendApiKey) {
      const userTemplate = renderContactUserConfirmationEmail({
        brandName: brandConfig.name,
        fullName: insertedLead.full_name,
        supportEmail: emailConfig.contact.to || brandConfig.contact.email,
      });

      const confirmationResult = await sendResendEmail({
        resendApiKey: emailConfig.resendApiKey,
        from: emailConfig.contact.from,
        to: insertedLead.email,
        subject: userTemplate.subject,
        html: userTemplate.html,
        text: userTemplate.text,
      });

      if (!confirmationResult.ok) {
        warnings.push(
          "Lead guardado correctamente, pero no se pudo enviar la confirmacion al usuario.",
        );
      }
    }

    await supabaseAdmin.from("analytics_events").insert({
      session_id: `contact-${insertedLead.id}`,
      visitor_id: ipHash ?? insertedLead.id,
      event_type: "contact_form_submit",
      path: pageUrl || "/",
      page_title: null,
      referrer: referrer || null,
      device_type: null,
      country: request.headers.get("x-vercel-ip-country") ?? null,
      browser: null,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      value_json: {
        lead_id: insertedLead.id,
        email_status: emailStatus,
        notification_email: emailConfig.contact.to,
        email_provider_id: emailProviderId,
      },
    });

    return NextResponse.json({
      success: true,
      warning: warnings.length > 0 ? warnings.join(" ") : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la solicitud." },
      { status: 500 },
    );
  }
}

