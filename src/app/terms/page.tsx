export const metadata = {
  title: "Terms of Service — Shotshot",
  description: "The terms and conditions for using Shotshot.",
};

export default function TermsPage() {
  return (
    <article className="prose prose-zinc mx-auto max-w-3xl px-6 py-12 dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 30, 2026</p>

      <h2>1. Acceptance</h2>
      <p>
        By using Shotshot ("the Service"), you agree to these Terms. If you don't agree, don't use the Service.
      </p>

      <h2>2. The Service</h2>
      <p>
        Shotshot is a web-based screenshot editor for App Store and Google Play marketing assets. It is provided free of charge for 1 project, with paid Pro ($5/month) and Lifetime ($49 one-time) tiers for additional projects and features.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You may use the Service without an account (anonymous mode) for 1 project.</li>
        <li>To save additional projects or access Pro features, you must sign in with a magic-link email.</li>
        <li>You are responsible for the security of your email and account.</li>
        <li>You must provide a valid email address you control.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Use the Service for any illegal purpose or in violation of any laws.</li>
        <li>Upload content that infringes on third-party intellectual property rights.</li>
        <li>Upload content that is malicious, deceptive, or violates Apple/Google App Store guidelines.</li>
        <li>Attempt to reverse-engineer, decompile, or otherwise extract source code.</li>
        <li>Abuse the OCR or AI features to generate harmful, harassing, or misleading content.</li>
        <li>Use the Service to create screenshots that violate trademark or copyright law.</li>
        <li>Circumvent the free tier limits (e.g., by creating multiple accounts).</li>
      </ul>

      <h2>5. Your Content</h2>
      <p>
        You retain all rights to the screenshots, captions, and marketing copy you create with the Service. We claim no ownership over your content. You grant us a limited license to host and process your content solely to provide the Service to you.
      </p>

      <h2>6. AI-Generated Content</h2>
      <p>
        AI captions and background images are generated using models you select (OpenAI, Anthropic, or OpenRouter). You are responsible for reviewing AI-generated content before use. We do not warrant the accuracy, originality, or non-infringement of AI outputs. You are solely responsible for any claims arising from your use of AI-generated content.
      </p>

      <h2>7. Payment Terms</h2>
      <ul>
        <li><strong>Pro ($5/month):</strong> Billed monthly via PayPal. Cancel anytime; access continues until the end of the paid period.</li>
        <li><strong>Lifetime ($49 one-time):</strong> One-time payment for permanent access. No refunds after 14 days from purchase.</li>
        <li><strong>Refunds:</strong> See our <a href="/refund">Refund Policy</a>.</li>
        <li>All prices are in USD. You are responsible for any applicable taxes.</li>
      </ul>

      <h2>8. Service Availability</h2>
      <p>
        The Service is provided "as is" without warranty of any kind. We do not guarantee uninterrupted, secure, or error-free operation. We may modify, suspend, or discontinue any part of the Service at any time.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Shotshot shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from your use of the Service.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Shotshot from any claims, damages, or expenses arising from your use of the Service, your content, or your violation of these Terms.
      </p>

      <h2>11. Termination</h2>
      <p>
        We may suspend or terminate your account if you violate these Terms. You may delete your account at any time by contacting us.
      </p>

      <h2>12. Changes to These Terms</h2>
      <p>
        We may update these Terms at any time. Material changes will be announced via email and a notice on the Service. Continued use after changes constitutes acceptance.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles.
      </p>

      <h2>14. Contact</h2>
      <p>
        Questions? Email us at <a href="mailto:legal@shotshot.app">legal@shotshot.app</a>.
      </p>

      <p className="text-sm text-muted-foreground">
        This document is a template and does not constitute legal advice. Consult a lawyer for jurisdiction-specific requirements.
      </p>
    </article>
  );
}
