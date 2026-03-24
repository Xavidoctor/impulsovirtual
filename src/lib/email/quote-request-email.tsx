import "server-only";

type QuoteInternalTemplateInput = {
  brandName: string;
  quoteId: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  projectType: string | null;
  requestedServices: string[];
  budgetRange: string | null;
  deadline: string | null;
  projectSummary: string;
  references: string | null;
  submittedAt: string;
};

type QuoteUserConfirmationInput = {
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

export function renderQuoteRequestInternalEmail(
  input: QuoteInternalTemplateInput,
): RenderedEmailTemplate {
  const subject = `Nueva solicitud de propuesta: ${input.fullName}`;
  const services =
    input.requestedServices.length > 0
      ? input.requestedServices.join(", ")
      : "No especificados";

  const html = shell(`
    <h1 style="margin:0 0 16px;font-size:24px;">Nueva solicitud de propuesta</h1>
    <p style="margin:0 0 16px;color:#c8c8c2;">Se ha registrado una nueva solicitud comercial en ${escapeHtml(input.brandName)}.</p>
    <ul style="margin:0;padding:0 0 0 20px;line-height:1.8;">
      <li><strong>ID:</strong> ${escapeHtml(input.quoteId)}</li>
      <li><strong>Nombre:</strong> ${escapeHtml(input.fullName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(input.email)}</li>
      <li><strong>Teléfono:</strong> ${escapeHtml(input.phone || "No indicado")}</li>
      <li><strong>Empresa:</strong> ${escapeHtml(input.company || "No indicada")}</li>
      <li><strong>Tipo de proyecto:</strong> ${escapeHtml(input.projectType || "No indicado")}</li>
      <li><strong>Servicios solicitados:</strong> ${escapeHtml(services)}</li>
      <li><strong>Presupuesto:</strong> ${escapeHtml(input.budgetRange || "No indicado")}</li>
      <li><strong>Fecha objetivo:</strong> ${escapeHtml(input.deadline || "No indicada")}</li>
      <li><strong>Fecha:</strong> ${escapeHtml(new Date(input.submittedAt).toLocaleString("es-ES"))}</li>
    </ul>
    <hr style="border-color:#2b2b2b;margin:20px 0;" />
    <p style="margin:0 0 8px;font-weight:700;">Resumen del proyecto</p>
    <p style="margin:0 0 16px;white-space:pre-wrap;color:#ddddda;">${escapeHtml(input.projectSummary)}</p>
    ${
      input.references
        ? `
      <p style="margin:0 0 8px;font-weight:700;">Referencias</p>
      <p style="margin:0;white-space:pre-wrap;color:#ddddda;">${escapeHtml(input.references)}</p>
    `
        : ""
    }
  `);

  const text = [
    "Nueva solicitud de propuesta",
    `ID: ${input.quoteId}`,
    `Nombre: ${input.fullName}`,
    `Email: ${input.email}`,
    `Teléfono: ${input.phone || "No indicado"}`,
    `Empresa: ${input.company || "No indicada"}`,
    `Tipo de proyecto: ${input.projectType || "No indicado"}`,
    `Servicios solicitados: ${services}`,
    `Presupuesto: ${input.budgetRange || "No indicado"}`,
    `Fecha objetivo: ${input.deadline || "No indicada"}`,
    `Fecha: ${new Date(input.submittedAt).toLocaleString("es-ES")}`,
    "",
    "Resumen del proyecto:",
    input.projectSummary,
    "",
    "Referencias:",
    input.references || "No indicadas",
  ].join("\n");

  return { subject, html, text };
}

export function renderQuoteRequestUserConfirmationEmail(
  input: QuoteUserConfirmationInput,
): RenderedEmailTemplate {
  const subject = `Hemos recibido tu solicitud en ${input.brandName}`;
  const html = shell(`
    <h1 style="margin:0 0 16px;font-size:24px;">Solicitud recibida</h1>
    <p style="margin:0 0 12px;color:#d6d6d2;">Hola ${escapeHtml(input.fullName)}, gracias por compartir los detalles de tu proyecto.</p>
    <p style="margin:0 0 12px;color:#c8c8c2;">Revisaremos la solicitud y te responderemos con los siguientes pasos.</p>
    <p style="margin:0 0 12px;color:#c8c8c2;">Si necesitas ampliar información, puedes escribirnos a ${escapeHtml(input.supportEmail)}.</p>
    <p style="margin:0;color:#c8c8c2;">Equipo ${escapeHtml(input.brandName)}</p>
  `);

  const text = [
    `Hola ${input.fullName},`,
    `Hemos recibido tu solicitud en ${input.brandName}.`,
    "Te responderemos con los siguientes pasos lo antes posible.",
    `Si necesitas ampliar información, escribe a ${input.supportEmail}.`,
    "",
    `Equipo ${input.brandName}`,
  ].join("\n");

  return { subject, html, text };
}

