// ponytail: Resend API for transactional email. Free tier 100/day, 3k/month.
// 7 templates in email-templates.ts with consistent Shotshot branding.

import { renderEmail, type EmailKey } from "./email-templates";

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Shotshot <noreply@shotshot.app>";
  if (!apiKey) {
    console.log(`[email-stub] to=${to} subject=${subject}`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a"><h2 style="font-size:18px;margin:0 0 12px">${subject}</h2><p style="font-size:15px;line-height:1.6;margin:0 0 16px">${body}</p><p style="font-size:12px;color:#888;margin:24px 0 0">— Shotshot</p></div>`,
    }),
  });
  if (!r.ok) {
    throw new Error(`Resend ${r.status}: ${await r.text()}`);
  }
}

// ponytail: branded email using a template key. Used by webhook + return + cron.
export async function sendTemplatedEmail(
  to: string,
  key: EmailKey,
  vars: Record<string, string | number> = {},
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Shotshot <noreply@shotshot.app>";
  const { subject, html } = renderEmail(key, vars);
  if (!apiKey) {
    console.log(`[email-stub] to=${to} template=${key} subject=${subject}`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!r.ok) {
    throw new Error(`Resend ${r.status}: ${await r.text()}`);
  }
}
