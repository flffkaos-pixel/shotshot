export const metadata = {
  title: "Refund Policy — Shotshot",
  description: "How refunds work for Shotshot Pro and Lifetime.",
};

export default function RefundPage() {
  return (
    <article className="prose prose-zinc mx-auto max-w-3xl px-6 py-12 dark:prose-invert">
      <h1>Refund Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 30, 2026</p>

      <h2>Pro Subscription ($5/month)</h2>
      <ul>
        <li>Cancel anytime from your PayPal account — access continues until the end of the paid period.</li>
        <li>Full refund available within <strong>7 days</strong> of your first charge if you haven't used Pro features.</li>
        <li>Prorated refunds after 7 days are at our discretion (typically granted for documented technical issues).</li>
      </ul>

      <h2>Lifetime ($49 one-time)</h2>
      <ul>
        <li>Full refund available within <strong>14 days</strong> of purchase.</li>
        <li>After 14 days, no refunds — Lifetime is a permanent access purchase.</li>
        <li>If a Lifetime user has a duplicate purchase (e.g., bought twice by accident), we refund the duplicate.</li>
      </ul>

      <h2>How to Request a Refund</h2>
      <ol>
        <li>Email <a href="mailto:refunds@shotshot.app">refunds@shotshot.app</a> from the email you used to sign up.</li>
        <li>Include your account email and the reason (optional but helps us improve).</li>
        <li>We respond within <strong>2 business days</strong>.</li>
        <li>Approved refunds are processed via the original payment method (PayPal) within <strong>5 business days</strong>.</li>
      </ol>

      <h2>What Happens to Your Data After a Refund</h2>
      <ul>
        <li>Your Pro/Lifetime access is removed immediately.</li>
        <li>Your account remains active at the Free tier (1 project).</li>
        <li>You can continue using the Service free forever.</li>
        <li>If you want your account and all data deleted, see our <a href="/privacy">Privacy Policy</a>.</li>
      </ul>

      <h2>Disputes</h2>
      <p>
        If you have an issue with a charge, please email us first at <a href="mailto:refunds@shotshot.app">refunds@shotshot.app</a> before opening a PayPal dispute. We resolve most issues within 24 hours.
      </p>

      <h2>EU Consumers (14-Day Cooling-Off)</h2>
      <p>
        If you are an EU consumer, you have a statutory 14-day right of withdrawal for distance contracts. This applies to Lifetime purchases and to your first month of Pro. To exercise this right, contact us within 14 days of purchase. We will refund using the original payment method within 14 days.
      </p>

      <h2>Contact</h2>
      <p>
        Refund questions? Email <a href="mailto:refunds@shotshot.app">refunds@shotshot.app</a>.
      </p>

      <p className="text-sm text-muted-foreground">
        This document is a template and does not constitute legal advice. Consult a lawyer for jurisdiction-specific requirements.
      </p>
    </article>
  );
}
