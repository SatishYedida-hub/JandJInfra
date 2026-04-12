const nodemailer = require("nodemailer");
const twilio = require("twilio");

const sendEmailNotification = async (lead) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, LEAD_NOTIFY_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !LEAD_NOTIFY_EMAIL) return;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: SMTP_USER,
    to: LEAD_NOTIFY_EMAIL,
    subject: `New Designer Lead - ${lead.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f8f6f1;padding:20px">
        <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e5dccf;border-radius:14px;padding:20px">
          <h2 style="margin:0 0 12px;color:#1f2937">New Meet Designer Request</h2>
          <p style="margin:0 0 14px;color:#6b7280">A new lead was submitted from your website landing page.</p>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#374151"><strong>Name</strong></td><td style="padding:8px 0;color:#111827">${lead.name}</td></tr>
            <tr><td style="padding:8px 0;color:#374151"><strong>Phone</strong></td><td style="padding:8px 0;color:#111827">${lead.phone}</td></tr>
            <tr><td style="padding:8px 0;color:#374151"><strong>City</strong></td><td style="padding:8px 0;color:#111827">${lead.city}</td></tr>
            <tr><td style="padding:8px 0;color:#374151"><strong>WhatsApp Opt-In</strong></td><td style="padding:8px 0;color:#111827">${lead.whatsappOptIn ? "Yes" : "No"}</td></tr>
          </table>
          <p style="margin-top:16px;color:#9ca3af;font-size:12px">J & J Infra • Lead Notification</p>
        </div>
      </div>
    `,
    text: `New lead details:
Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
WhatsApp Opt-In: ${lead.whatsappOptIn ? "Yes" : "No"}
Created At: ${lead.createdAt}`
  });
};

const sendWhatsAppNotification = async (lead) => {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM,
    TWILIO_WHATSAPP_TO
  } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM || !TWILIO_WHATSAPP_TO) return;

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: TWILIO_WHATSAPP_TO,
    body: `New Designer Lead:
Name: ${lead.name}
Phone: ${lead.phone}
City: ${lead.city}
WhatsApp Opt-In: ${lead.whatsappOptIn ? "Yes" : "No"}`
  });
};

const notifyLeadCreated = async (lead) => {
  await Promise.allSettled([sendEmailNotification(lead), sendWhatsAppNotification(lead)]);
};

module.exports = { notifyLeadCreated };
