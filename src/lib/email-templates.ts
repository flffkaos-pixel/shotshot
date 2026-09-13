// ponytail: 7 transactional email templates with consistent Shotshot branding.
// Renders inline HTML for max email client compatibility. Lightweight, no MJML/Handlebars.

export type EmailKey =
  | "welcome_pro"
  | "welcome_lifetime"
  | "payment_failed"
  | "subscription_cancelled"
  | "subscription_suspended"
  | "renewal_warning"
  | "refund_processed"
  | "webhook_failed";

const BRAND = {
  primary: "#0a0a0a",
  accent: "#f59e0b",
  bg: "#fafafa",
  text: "#1a1a1a",
  muted: "#666",
  border: "#e5e5e5",
};

const SHELL = (body: string, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Shotshot</title>
  <style>
    body { margin: 0; padding: 0; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Pretendard", sans-serif; color: ${BRAND.text}; line-height: 1.55; -webkit-font-smoothing: antialiased; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 24px; }
    .card { background: #fff; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 32px; }
    .logo { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 18px; letter-spacing: -0.02em; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
    .badge-pro { background: #fef3c7; color: #92400e; }
    .badge-warn { background: #fee2e2; color: #991b1b; }
    .badge-ok { background: #d1fae5; color: #065f46; }
    h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 12px; line-height: 1.25; }
    h2 { font-size: 18px; font-weight: 600; margin: 24px 0 8px; }
    p { font-size: 15px; margin: 0 0 16px; }
    .muted { color: ${BRAND.muted}; font-size: 13px; }
    .btn { display: inline-block; padding: 12px 20px; background: ${BRAND.primary}; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .btn-amber { background: ${BRAND.accent}; color: ${BRAND.primary} !important; }
    .divider { height: 1px; background: ${BRAND.border}; margin: 24px 0; border: 0; }
    .row { padding: 8px 0; border-bottom: 1px solid ${BRAND.border}; display: flex; justify-content: space-between; font-size: 14px; }
    .row:last-child { border-bottom: 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid ${BRAND.border}; font-size: 12px; color: ${BRAND.muted}; text-align: center; }
    .footer a { color: ${BRAND.muted}; }
  </style>
</head>
<body>
  <span style="display:none;font-size:1px;color:${BRAND.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span style="display:inline-block;width:24px;height:24px;background:linear-gradient(135deg,${BRAND.accent},#ec4899);border-radius:6px;"></span>
        Shotshot
      </div>
      ${body}
    </div>
    <div class="footer">
      <p>Shotshot — Free App Store screenshot maker</p>
      <p><a href="https://shotshot.app">shotshot.app</a> · <a href="https://shotshot.app/terms">Terms</a> · <a href="https://shotshot.app/privacy">Privacy</a> · <a href="https://shotshot.app/refund">Refunds</a></p>
      <p>You're receiving this because you have an account at shotshot.app. <a href="https://shotshot.app/admin">Manage</a></p>
    </div>
  </div>
</body>
</html>
`;

export function renderEmail(key: EmailKey, vars: Record<string, string | number> = {}): { subject: string; html: string } {
  switch (key) {
    case "welcome_pro":
      return {
        subject: "Welcome to Shotshot Pro",
        html: SHELL(
          `<span class="badge badge-pro">Pro Active</span>
           <h1 style="margin-top:12px;">Welcome to Shotshot Pro 🎉</h1>
           <p>Your <strong>Pro subscription</strong> is now active. Unlimited projects, cloud sync, and AI captions without BYOK — all unlocked.</p>
           <a href="https://shotshot.app" class="btn">Open the editor</a>
           <h2>What you get</h2>
           <div class="row"><span>Unlimited projects</span><span class="muted">✓</span></div>
           <div class="row"><span>Cloud sync across devices</span><span class="muted">✓</span></div>
           <div class="row"><span>AI captions (no BYOK needed)</span><span class="muted">✓</span></div>
           <div class="row"><span>80+ locales, one-click translate</span><span class="muted">✓</span></div>
           <hr class="divider" />
           <p class="muted">Renewal date: <strong>${vars.renewalDate || "in 30 days"}</strong>. Cancel anytime from your PayPal account — your access continues until then.</p>
           <p class="muted">Need help? Reply to this email.</p>`,
          "Your Pro subscription is active. Unlimited projects unlocked.",
        ),
      };

    case "welcome_lifetime":
      return {
        subject: "Shotshot Lifetime activated",
        html: SHELL(
          `<span class="badge badge-pro">Lifetime</span>
           <h1 style="margin-top:12px;">You own Shotshot. Forever.</h1>
           <p>Your <strong>Lifetime</strong> purchase is confirmed. One payment, no renewals, permanent access.</p>
           <a href="https://shotshot.app" class="btn btn-amber">Open the editor</a>
           <h2>Receipt</h2>
           <div class="row"><span>Plan</span><span><strong>Lifetime</strong></span></div>
           <div class="row"><span>Amount</span><span><strong>$${vars.amount || "49.00"} USD</strong></span></div>
           <div class="row"><span>Date</span><span>${vars.date || new Date().toLocaleDateString()}</span></div>
           <hr class="divider" />
           <p class="muted">A receipt was also sent to your PayPal email. Need a refund within 14 days? Email <a href="mailto:refunds@shotshot.app">refunds@shotshot.app</a>.</p>
           <p class="muted">Thanks for supporting indie software. Now go launch that app 🚀</p>`,
          "Your Lifetime access is active. No renewals, ever.",
        ),
      };

    case "payment_failed":
      return {
        subject: "Payment failed — 3-day grace period",
        html: SHELL(
          `<span class="badge badge-warn">Action Required</span>
           <h1 style="margin-top:12px;">We couldn't process your payment</h1>
           <p>Your PayPal payment for Shotshot Pro failed. <strong>Your Pro access stays active for 3 days</strong> while you fix it.</p>
           <h2>What to do</h2>
           <ol style="padding-left:20px;margin:0 0 16px;font-size:15px;">
             <li style="margin-bottom:8px;">Log in to your PayPal account</li>
             <li style="margin-bottom:8px;">Check that your card isn't expired or over its limit</li>
             <li style="margin-bottom:8px;">Update your payment method</li>
           </ol>
           <a href="https://www.paypal.com" class="btn">Update PayPal payment</a>
           <hr class="divider" />
           <p class="muted">If you don't update by <strong>${vars.graceEnd || "in 3 days"}</strong>, your Pro access will be removed and your account will revert to Free. You can resubscribe anytime.</p>
           <p class="muted">Need help? Reply to this email.</p>`,
          "PayPal payment failed. 3 days to fix.",
        ),
      };

    case "subscription_cancelled":
      return {
        subject: "Your Shotshot Pro subscription has ended",
        html: SHELL(
          `<span class="badge">Cancelled</span>
           <h1 style="margin-top:12px;">Your Pro subscription has ended</h1>
           <p>Your Pro access has been removed. Your account is now on the Free plan (1 project, every size, every locale).</p>
           <p>If this was a mistake, you can resubscribe anytime — your saved projects are still there.</p>
           <a href="https://shotshot.app" class="btn">Resubscribe</a>
           <hr class="divider" />
           <p class="muted">If you cancelled, thanks for trying Pro. We'd love to hear why you left — just reply to this email.</p>`,
          "Your Pro access has ended. Resubscribe anytime.",
        ),
      };

    case "subscription_suspended":
      return {
        subject: "Subscription suspended — 3-day grace period",
        html: SHELL(
          `<span class="badge badge-warn">Suspended</span>
           <h1 style="margin-top:12px;">Your Pro subscription is suspended</h1>
           <p>PayPal couldn't process your recurring payment. Your <strong>Pro access stays active for 3 days</strong> while you fix it.</p>
           <a href="https://www.paypal.com" class="btn">Fix payment in PayPal</a>
           <hr class="divider" />
           <p class="muted">If unresolved by <strong>${vars.graceEnd || "in 3 days"}</strong>, your account will revert to Free. Your projects and data are safe.</p>`,
          "Subscription suspended. 3 days to fix PayPal.",
        ),
      };

    case "renewal_warning":
      return {
        subject: "Your Shotshot Pro renews in 3 days",
        html: SHELL(
          `<span class="badge badge-pro">Renewal Soon</span>
           <h1 style="margin-top:12px;">Heads up: renewal in 3 days</h1>
           <p>Your Shotshot Pro subscription will renew on <strong>${vars.renewalDate || "soon"}</strong> for $5.00 USD.</p>
           <p>No action needed if you want to continue. To cancel, visit your PayPal subscriptions page.</p>
           <a href="https://www.paypal.com/myaccount/autopay" class="btn">Manage in PayPal</a>
           <hr class="divider" />
           <p class="muted">Thanks for being a Pro user. If you have feedback, hit reply.</p>`,
          "Pro renews in 3 days. $5 USD. Manage in PayPal.",
        ),
      };

    case "refund_processed":
      return {
        subject: "Refund processed",
        html: SHELL(
          `<span class="badge">Refunded</span>
           <h1 style="margin-top:12px;">Your refund has been processed</h1>
           <p>We've refunded <strong>$${vars.amount || "your payment"}</strong> to your original payment method. Funds should appear within 5 business days.</p>
           <h2>What happens to your account</h2>
           <div class="row"><span>Pro access</span><span>Removed</span></div>
           <div class="row"><span>Account</span><span>Active on Free plan</span></div>
           <div class="row"><span>Projects</span><span>Safe</span></div>
           <hr class="divider" />
           <p class="muted">Sorry to see you go. If you have a moment, reply with what we could have done better — it really helps.</p>`,
          "Your refund has been processed.",
        ),
      };

    case "webhook_failed":
      // ponytail: internal alert. Same template, different audience.
      return {
        subject: `[Shotshot] webhook DB update failed`,
        html: SHELL(
          `<span class="badge badge-warn">Operator Alert</span>
           <h1 style="margin-top:12px;">PayPal webhook failed</h1>
           <p>A PayPal webhook event was received but failed to update the database.</p>
           <h2>Details</h2>
           <div class="row"><span>Event</span><span><code>${vars.eventType || "?"}</code></span></div>
           <div class="row"><span>Subscription</span><span><code>${vars.subscriptionId || "?"}</code></span></div>
           <div class="row"><span>User</span><span><code>${vars.userId || "?"}</code></span></div>
           <div class="row"><span>Error</span><span><code>${vars.error || "?"}</code></span></div>
           <hr class="divider" />
           <p class="muted">PayPal will retry. Check <a href="https://shotshot.app/admin">/admin</a> for status.</p>`,
          "Internal alert — PayPal webhook failed.",
        ),
      };
  }
}
