import "server-only";

import { Resend } from "resend";

export type SendEmailInput = {
  resendApiKey: string | null;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string };

export async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!input.resendApiKey) {
    return { ok: false, error: "missing_resend_api_key" };
  }

  try {
    const resend = new Resend(input.resendApiKey);
    const response = await resend.emails.send({
      from: input.from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { ok: true, id: response.data?.id ?? null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "resend_send_failed",
    };
  }
}

