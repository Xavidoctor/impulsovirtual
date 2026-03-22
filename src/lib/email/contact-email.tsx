import "server-only";

type ContactInternalTemplateInput = {
  brandName: string;
  leadId: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  serviceInterest: string | null;
  message: string;
  source: string | null;
  pageUrl: string | null;
  submittedAt: string;
};

type ContactUserConfirmationInput = {
  brandName: string;
  fullName: string;
  supportEmail: string;
};

type RenderedEmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(content: string) {
  return `
    <html>
      <body style="margin:0;background:#0f0f0f;color:#f2f2ef;font-family:Arial,sans-serif;">
        <div style="max-width:680px;margin:0 auto;padding:24px;">
          ${content}
        </div>
      </body>
    </html>
  `;
}

export function renderContactInternalEmail(
  input: ContactInternalTemplateInput,
): RenderedEmailTemplate {
  const subject = `Nuevo lead de contacto: ${input.fullName}`;
  const html = shell(`
    <h1 style="margin:0 0 16px;font-size:24px;">Nuevo lead de contacto</h1>
    <p style="margin:0 0 16px;color:#c8c8c2;">Se ha registrado un nuevo lead en ${escapeHtml(input.brandName)}.</p>
    <ul style="margin:0;padding:0 0 0 20px;line-height:1.8;">
      <li><strong>ID:</strong> ${escapeHtml(input.leadId)}</li>
      <li><strong>Nombre:</strong> ${escapeHtml(input.fullName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
      <li><strong>Telefono:</strong> ${escapeHtml(input.phone || "No indicado")}</li>
      <li><strong>Empresa:</strong> ${escapeHtml(input.company || "No indicada")}</li>
      <li><strong>Servicio:</strong> ${escapeHtml(input.serviceInterest || "No indicado")}</li>
      <li><strong>Fuente:</strong> ${escapeHtml(input.source || "No indicada")}</li>
      <li><strong>Pagina:</strong> ${escapeHtml(input.pageUrl || "No indicada")}</li>
      <li><strong>Fecha:</strong> ${escapeHtml(new Date(input.submittedAt).toLocaleString("es-ES"))}</li>
    </ul>
    <hr style="border-color:#2b2b2b;margin:20px 0;" />
    <p style="margin:0 0 8px;font-weight:700;">Mensaje</p>
    <p style="margin:0;white-space:pre-wrap;color:#ddddda;">${escapeHtml(input.message)}</p>
  `);

  const text = [
    "Nuevo lead de contacto",
    `ID: ${input.leadId}`,
    `Nombre: ${input.fullName}`,
    `Email: ${input.email}`,
    `Telefono: ${input.phone || "No indicado"}`,
    `Empresa: ${input.company || "No indicada"}`,
    `Servicio: ${input.serviceInterest || "No indicado"}`,
    `Fuente: ${input.source || "No indicada"}`,
    `Pagina: ${input.pageUrl || "No indicada"}`,
    `Fecha: ${new Date(input.submittedAt).toLocaleString("es-ES")}`,
    "",
    "Mensaje:",
    input.message,
  ].join("\n");

  return { subject, html, text };
}

export function renderContactUserConfirmationEmail(
  input: ContactUserConfirmationInput,
): RenderedEmailTemplate {
  const subject = `Hemos recibido tu mensaje en ${input.brandName}`;
  const html = shell(`
    <h1 style="margin:0 0 16px;font-size:24px;">Gracias por escribirnos</h1>
    <p style="margin:0 0 12px;color:#d6d6d2;">Hola ${escapeHtml(input.fullName)}, hemos recibido tu mensaje y lo revisaremos cuanto antes.</p>
    <p style="margin:0 0 12px;color:#c8c8c2;">Si necesitas ampliar contexto, puedes responder a este email o escribirnos en ${escapeHtml(input.supportEmail)}.</p>
    <p style="margin:0;color:#c8c8c2;">Equipo ${escapeHtml(input.brandName)}</p>
  `);

  const text = [
    `Hola ${input.fullName},`,
    `Hemos recibido tu mensaje en ${input.brandName}.`,
    `Si necesitas ampliar contexto, responde a este correo o escribe a ${input.supportEmail}.`,
    "",
    `Equipo ${input.brandName}`,
  ].join("\n");

  return { subject, html, text };
}

