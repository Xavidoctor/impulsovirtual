import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { analyticsTrackPayloadSchema } from "@/src/lib/validators/analytics-schema";

const SESSION_COOKIE = "iv_session_id";
const VISITOR_COOKIE = "iv_visitor_id";

function hashIp(value: string) {
  if (!value) return null;
  return Buffer.from(value).toString("base64url").slice(0, 32);
}

function inferDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
  return "desktop";
}

function inferBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge";
  if (ua.includes("chrome/")) return "chrome";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "safari";
  if (ua.includes("firefox/")) return "firefox";
  return "otro";
}

export async function POST(request: NextRequest) {
  try {
    const payload = analyticsTrackPayloadSchema.parse(await request.json());
    const response = NextResponse.json({ success: true });

    const cookieSession = request.cookies.get(SESSION_COOKIE)?.value;
    const cookieVisitor = request.cookies.get(VISITOR_COOKIE)?.value;
    const sessionId = cookieSession ?? randomUUID();
    const visitorId = cookieVisitor ?? randomUUID();

    if (!cookieSession) {
      response.cookies.set(SESSION_COOKIE, sessionId, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24,
      });
    }

    if (!cookieVisitor) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    const userAgent = request.headers.get("user-agent") ?? "";
    const country =
      request.headers.get("x-vercel-ip-country") ??
      request.headers.get("cf-ipcountry") ??
      null;
    const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
    const ip = forwardedFor.split(",")[0]?.trim() ?? "";

    const supabase = createSupabaseAdminClient();
    await supabase.from("analytics_events").insert({
      session_id: sessionId,
      visitor_id: visitorId,
      event_type: payload.eventType,
      path: payload.path,
      page_title: payload.pageTitle ?? null,
      referrer: payload.referrer ?? request.headers.get("referer") ?? null,
      device_type: inferDeviceType(userAgent),
      country,
      browser: inferBrowser(userAgent),
      utm_source: payload.utmSource ?? null,
      utm_medium: payload.utmMedium ?? null,
      utm_campaign: payload.utmCampaign ?? null,
      value_json: {
        ...(payload.value ?? {}),
        source: payload.source ?? null,
        ip_hash: hashIp(ip),
      },
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Evento de analytics no válido.", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json({ success: true });
  }
}
