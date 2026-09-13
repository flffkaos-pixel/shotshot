"use client";
// ponytail: marketing page. minimal, server-rendered, no JS deps for the hero.
// "Open editor" CTA = single button to /

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ScanLine,
  Languages,
  Rocket,
  Download,
  Check,
  X,
  GitBranch,
  Coffee,
  Github,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CurrencySwitcher } from "./currency-switcher";
import { useCurrency } from "@/lib/currency";

const FEATURES = [
  {
    icon: ScanLine,
    title: "OCR caption-verify",
    body: "Tesseract.js checks your headline text actually appears in the screenshot. Prevents 'Inaccurate metadata' app-review rejections.",
  },
  {
    icon: Sparkles,
    title: "AI captions (BYOK)",
    body: "Bring your own OpenAI key. Your data, your bill, our servers never see the prompt. OpenRouter free models as fallback.",
  },
  {
    icon: Languages,
    title: "80+ locales, one click",
    body: "Translate every slide into Korean, Japanese, German, French, Spanish, Italian, Portuguese, Russian, Arabic, and 20+ more.",
  },
  {
    icon: Rocket,
    title: "Fastlane 1-click upload",
    body: "Generate a Fastfile snippet, drop it in your iOS/Android project, ship. No more zip-and-drag through App Store Connect.",
  },
  {
    icon: Download,
    title: "Every size, bundled",
    body: "iPhone 6.9/6.5/6.3/6.1, iPad, Android phone, 7\"/10\" tablets, Feature Graphic — exported as one zip, no upload tool needed.",
  },
  {
    icon: GitBranch,
    title: "Git-trackable project",
    body: "Your deck is a JSON file. Commit it, branch it, review design changes in PRs. Restore any version with `git checkout`.",
  },
];

const COMPARISON = [
  { feature: "OCR verify (anti-rejection)", shotshot: true, others: false },
  { feature: "AI captions, free tier", shotshot: true, others: false },
  { feature: "Git-trackable JSON", shotshot: true, others: false },
  { feature: "Bring your own AI key", shotshot: true, others: false },
  { feature: "80+ locales one-click", shotshot: true, others: "limited" },
  { feature: "No signup to try", shotshot: true, others: "varies" },
  { feature: "Open source (MIT)", shotshot: true, others: false },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. 1 project, every size, every locale, every feature. No watermark, no time limit. We make money when you upgrade to Pro for unlimited projects.",
  },
  {
    q: "What does Pro cost?",
    a: "$5/month or $49 one-time (lifetime). Cancel anytime from PayPal.",
  },
  {
    q: "Do you train AI on my screenshots?",
    a: "No. AI calls go directly from your browser to OpenAI with your key. Our servers never see the prompt or the image.",
  },
  {
    q: "What if I get rejected?",
    a: "OCR verify reduces that risk to near zero. If it still happens, our Discord has answers from other indie devs.",
  },
  {
    q: "Can I self-host?",
    a: "Yes. It's MIT licensed. `git clone && npm install && npm run dev`.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* nav */}
      <header className="border-b border-zinc-100">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-pink-500" />
            <span className="text-lg font-bold tracking-tight">Shotshot</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#features" className="text-zinc-600 hover:text-zinc-900">Features</a>
            <a href="#pricing" className="text-zinc-600 hover:text-zinc-900">Pricing</a>
            <a href="#faq" className="text-zinc-600 hover:text-zinc-900">FAQ</a>
            <a href="https://github.com/" className="text-zinc-600 hover:text-zinc-900">
              <Github className="h-4 w-4" />
            </a>
            <Link href="/" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700">
              Open editor
            </Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-50 via-white to-white" />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Sparkles className="h-3 w-3" />
            Now with OCR verify + 80+ locales
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            App Store screenshots <br className="hidden sm:block" />
            that <span className="text-amber-500">don't get rejected</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            Drag, drop, AI-caption, OCR-verify, export every size for App Store and Play Store. Free forever for indie devs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-base font-semibold text-white shadow-lg hover:bg-zinc-800"
            >
              <Rocket className="h-5 w-5" />
              Open editor — it's free
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 text-base font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              See how it works
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">No signup. No credit card. No watermark.</p>
        </div>
      </section>

      {/* social proof / numbers */}
      <section className="border-y border-zinc-100 bg-zinc-50/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
          <Stat n="0" label="Dollar to start" />
          <Stat n="6" label="Apple+Google sizes" />
          <Stat n="80+" label="Locales one-click" />
          <Stat n="MIT" label="Open source" />
        </div>
      </section>

      {/* features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for the rejection, not the showcase.</h2>
            <p className="mt-4 text-lg text-zinc-600">
              Most screenshot tools show your UI. Shotshot sells your app — and prevents the "Inaccurate metadata" rejection that costs you a launch.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* comparison */}
      <section className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">How we compare</h2>
          <p className="mt-4 text-center text-lg text-zinc-600">Honest side-by-side vs. AppScreens, Previewed, and the rest.</p>
          <div className="mt-12 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Feature</th>
                  <th className="px-6 py-4 text-center">Shotshot</th>
                  <th className="px-6 py-4 text-center">Others</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {COMPARISON.map((row) => (
                  <tr key={row.feature}>
                    <td className="px-6 py-4 font-medium text-zinc-900">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.shotshot === true ? (
                        <Check className="mx-auto h-5 w-5 text-green-500" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-zinc-300" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-zinc-500">
                      {row.others === true ? <Check className="mx-auto h-5 w-5 text-zinc-400" /> : row.others === false ? <X className="mx-auto h-5 w-5 text-zinc-300" /> : <span className="text-xs">{row.others}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
          <p className="mt-4 text-center text-lg text-zinc-600">Pay nothing. Or pay once. Both work.</p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <PriceCard
              name="Free"
              price="$0"
              priceUsd={0}
              period="forever"
              cta="Open editor"
              href="/"
              features={["1 project", "All 6 store sizes", "80+ locales", "OCR verify (Korean, Japanese, English, +14 more)", "Git-trackable JSON", "BYOK AI captions"]}
            />
            <PriceCard
              name="Pro"
              price="$5"
              priceUsd={5}
              period="/ month"
              cta="Subscribe with PayPal"
              href="/"
              highlight
              features={["Unlimited projects", "Cloud sync across devices", "AI captions no BYOK needed", "Priority support", "Everything in Free"]}
            />
            <PriceCard
              name="Lifetime"
              price="$49"
              priceUsd={49}
              period="one-time"
              cta="Buy once"
              href="/"
              features={["Everything in Pro", "Pay once, use forever", "No renewals, ever", "Support indie software"]}
            />
          </div>
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">FAQ</h2>
          <div className="mt-12 space-y-4">
            {FAQ.map((row) => (
              <details key={row.q} className="rounded-xl border border-zinc-200 bg-white p-6 [&_summary]:cursor-pointer">
                <summary className="text-lg font-semibold">{row.q}</summary>
                <p className="mt-3 text-sm text-zinc-600">{row.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Ship your next launch in 5 minutes.</h2>
          <p className="mt-4 text-lg text-zinc-600">Free. No signup. Open source.</p>
          <Link
            href="/"
            className="mt-8 inline-flex h-14 items-center gap-2 rounded-xl bg-zinc-900 px-8 text-lg font-semibold text-white shadow-xl hover:bg-zinc-800"
          >
            <Rocket className="h-5 w-5" />
            Open the editor
          </Link>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-zinc-500">
            <a href="https://www.buymeacoffee.com/" className="inline-flex items-center gap-1 hover:text-zinc-900">
              <Coffee className="h-3.5 w-3.5" /> Buy me a coffee
            </a>
            <span>·</span>
            <a href="https://github.com/sponsors/" className="inline-flex items-center gap-1 hover:text-zinc-900">
              <Github className="h-3.5 w-3.5" /> GitHub Sponsor
            </a>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-zinc-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
          <span>© Shotshot. MIT licensed.</span>
          <div className="flex items-center gap-6">
            <a href="/terms" className="hover:text-zinc-900">Terms</a>
            <a href="/privacy" className="hover:text-zinc-900">Privacy</a>
            <a href="/refund" className="hover:text-zinc-900">Refunds</a>
            <LanguageSwitcher />
            <CurrencySwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold tracking-tight text-zinc-900">{n}</div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  priceUsd,
  period,
  cta,
  href,
  features,
  highlight = false,
}: {
  name: string;
  price: string; // legacy display
  priceUsd: number; // canonical USD price
  period: string;
  cta: string;
  href: string;
  features: string[];
  highlight?: boolean;
}) {
  const { fmt } = useCurrency();
  const display = fmt(priceUsd);
  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlight ? "border-zinc-900 bg-zinc-900 text-white shadow-2xl" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="text-sm font-medium uppercase tracking-wider opacity-70">{name}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-5xl font-bold">
          {display.symbol}{display.amount}
        </span>
        <span className="text-sm opacity-70">{period}</span>
      </div>
      {display.original && <div className="mt-1 text-xs opacity-50">{display.original}</div>}
      <Link
        href={href}
        className={`mt-6 flex h-11 w-full items-center justify-center rounded-lg font-semibold ${
          highlight ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white hover:bg-zinc-700"
        }`}
      >
        {cta}
      </Link>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-amber-300" : "text-green-500"}`} />
            <span className="opacity-90">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
