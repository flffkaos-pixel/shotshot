"use client";

// Shotshot marketing page.
// Design read: indie-developer SaaS landing for iOS/Android devs, sharp dev-tool
// language, one warm accent on ink neutrals, restrained scroll-reveal motion.
// Dials: VARIANCE 7 / MOTION 5 / DENSITY 3.
// Radius lock: cards rounded-3xl, buttons rounded-full. One accent (amber-500).

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
  Coffee,
  Github,
} from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { CurrencySwitcher } from "./currency-switcher";
import { useCurrency } from "@/lib/currency";

// ---------- helpers ----------

// Zero-dep scroll reveal. Adds .is-in when the element enters the viewport.
function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

// iPhone bezel from the product itself, with an app-store screenshot ad inside.
// Screen rect mirrors PHONE_SCREEN in src/lib/constants.ts (52/46/918/1990 of 1022x2082).
// The screen shows the kind of marketing slide Shotshot produces: a designed surface,
// a small label, and one oversized headline. No external image, so it renders instantly.
function PhoneMock({
  kicker,
  headline,
  tone = "amber",
  tilt = -4,
  className = "",
}: {
  kicker: string;
  headline: string;
  tone?: "amber" | "ink";
  tilt?: number;
  className?: string;
}) {
  const amber = tone === "amber";
  const bg = amber
    ? "linear-gradient(165deg,#fcd34d 0%,#f59e0b 46%,#b45309 100%)"
    : "linear-gradient(165deg,#3f3f46 0%,#18181b 58%,#09090b 100%)";
  return (
    <div className={`relative ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <div className="relative" style={{ aspectRatio: "1022 / 2082" }}>
        {/* bezel first in flow; screen content sits above it (matches the editor) */}
        <img
          src="/mockup.png"
          alt=""
          className="relative block h-full w-full select-none"
          draggable={false}
        />
        <div
          className="absolute z-10 overflow-hidden"
          style={{
            left: `${(52 / 1022) * 100}%`,
            top: `${(46 / 2082) * 100}%`,
            width: `${(918 / 1022) * 100}%`,
            height: `${(1990 / 2082) * 100}%`,
            borderRadius: `${(126 / 918) * 100}% / ${(126 / 1990) * 100}%`,
            background: bg,
          }}
        >
          <div className="flex h-full flex-col justify-between p-[8%]">
            <span
              className={`font-[family-name:var(--font-geist-mono)] text-[0.55rem] uppercase tracking-[0.2em] ${
                amber ? "text-amber-950/70" : "text-amber-400"
              }`}
            >
              {kicker}
            </span>
            <p
              className={`font-[family-name:var(--font-geist)] text-[1.35rem] font-semibold leading-[1.08] tracking-[-0.02em] ${
                amber ? "text-amber-950" : "text-white"
              }`}
            >
              {headline}
            </p>
            <span
              className={`h-1 w-8 rounded-full ${amber ? "bg-amber-950/60" : "bg-amber-400"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- content ----------

const WORKS_WITH = [
  { name: "Apple App Store", slug: "apple" },
  { name: "Google Play", slug: "googleplay" },
  { name: "OpenAI", slug: "openai" },
  { name: "GitHub", slug: "github" },
  { name: "Cloudflare", slug: "cloudflare" },
];

const BENTO = [
  {
    icon: ScanLine,
    title: "OCR caption-verify",
    body: "Tesseract.js reads your screenshot and checks the headline text is actually in the UI. It is the difference between shipping and a two week review loop.",
    span: "lg:col-span-3",
    tone: "paper",
  },
  {
    icon: Sparkles,
    title: "AI captions, your key",
    body: "Bring your own OpenAI key. Your data, your bill. Our servers never see the prompt.",
    span: "lg:col-span-3",
    tone: "ink",
  },
  {
    icon: Languages,
    title: "80+ locales",
    body: "Translate the whole deck in one pass. Korean, Japanese, German, Arabic, and more.",
    span: "lg:col-span-2",
    tone: "paper",
  },
  {
    icon: Rocket,
    title: "Fastlane upload",
    body: "Generate a Fastfile, run one command, done.",
    span: "lg:col-span-2",
    tone: "amber",
  },
  {
    icon: Download,
    title: "Every required size",
    body: "iPhone, iPad, Android phone and tablets, Feature Graphic. One zip.",
    span: "lg:col-span-2",
    tone: "paper",
  },
];

const PROCESS = [
  {
    verb: "Drag",
    body: "Drop your raw device captures onto the canvas. Layouts snap into place, and you nudge from there.",
  },
  {
    verb: "Verify",
    body: "Run OCR before you export. Missing words get flagged while you can still fix them, not after review.",
  },
  {
    verb: "Export",
    body: "One zip with every size and locale the stores ask for, then upload by hand or through Fastlane.",
  },
];

const COMPARISON = [
  { feature: "OCR verify against the real screenshot", shotshot: true, others: false },
  { feature: "AI captions on the free tier", shotshot: true, others: false },
  { feature: "Deck stored as git-trackable JSON", shotshot: true, others: false },
  { feature: "Bring your own AI key", shotshot: true, others: false },
  { feature: "80+ locales in one pass", shotshot: true, others: "paid only" },
  { feature: "Open source, MIT", shotshot: true, others: false },
];

const FAQ = [
  {
    q: "Is it really free?",
    a: "Yes. One project with every size, every locale, and every feature. No watermark, no trial timer. Pro only exists for people who need more than one project at a time.",
  },
  {
    q: "What does Pro cost?",
    a: "5 dollars a month, or 49 dollars once for lifetime access. Cancel from PayPal whenever you want.",
  },
  {
    q: "Does the AI see my screenshots?",
    a: "No. Caption calls go from your browser straight to OpenAI with your key. Our servers never receive the prompt or the image.",
  },
  {
    q: "What happens if I still get rejected?",
    a: "OCR verify removes the most common cause. If something slips through, the GitHub issues are the place to compare notes with other indie devs.",
  },
  {
    q: "Can I self-host it?",
    a: "Yes. It is MIT licensed. Clone the repo, install, run the dev server.",
  },
];

// ---------- page ----------

export function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-[#faf9f7] font-[family-name:var(--font-geist)] text-zinc-950 antialiased">
      <style>{`
        .reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s cubic-bezier(.16,1,.3,1), transform .7s cubic-bezier(.16,1,.3,1); }
        .reveal.is-in { opacity: 1; transform: none; }
        @keyframes ss-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .float { animation: ss-float 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .float { animation: none !important; }
        }
      `}</style>

      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-zinc-950/8 bg-[#faf9f7]/85 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/landing" className="flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-[7px] bg-[conic-gradient(from_140deg,#f59e0b,#fb7185,#f59e0b)]" />
            <span className="text-[17px] font-semibold tracking-tight">Shotshot</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] text-zinc-600 md:flex">
            <a href="#features" className="transition-colors hover:text-zinc-950">Features</a>
            <a href="#how" className="transition-colors hover:text-zinc-950">How it works</a>
            <a href="#pricing" className="transition-colors hover:text-zinc-950">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-zinc-950">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/flffkaos-pixel/shotshot"
              className="hidden text-zinc-500 transition-colors hover:text-zinc-950 sm:block"
              aria-label="GitHub"
            >
              <Github className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </a>
            <Link
              href="/"
              className="rounded-full bg-zinc-950 px-4 py-2 text-[13px] font-medium text-white transition-transform hover:-translate-y-px active:translate-y-0"
            >
              Open editor
            </Link>
          </div>
        </div>
      </header>

      {/* hero - asymmetric split */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-amber-300/25 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-28 lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-950/10 bg-white/70 px-3 py-1 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.14em] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Free for indie developers
            </span>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[3.4rem] lg:text-[3.9rem]">
              App Store screenshots
              <br />
              that don't get{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">rejected.</span>
                <span className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.32em] bg-amber-300/70" />
              </span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-relaxed text-zinc-600">
              Drag, drop, AI-caption, OCR-verify, then export every size the stores ask for.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-6 py-3.5 text-[15px] font-medium text-white transition-transform hover:-translate-y-px active:translate-y-0"
              >
                <Rocket className="h-4 w-4" strokeWidth={1.75} />
                Open editor
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-950/12 px-6 py-3.5 text-[15px] font-medium text-zinc-800 transition-colors hover:border-zinc-950/25 hover:bg-white"
              >
                See how it works
              </a>
            </div>
          </div>

          <div className="relative mx-auto flex h-[420px] w-full max-w-[340px] items-center justify-center sm:h-[500px] lg:mx-0 lg:max-w-none lg:justify-end">
            <div className="float relative z-20 w-[196px] sm:w-[224px]">
              <PhoneMock kicker="Feature 02" headline={"Keep your\nstreak alive."} tone="amber" tilt={-4} />
            </div>
            <div className="absolute -bottom-4 left-0 z-10 hidden w-[142px] sm:block sm:w-[158px] lg:left-8">
              <PhoneMock kicker="Feature 05" headline={"Find dinner\nfast."} tone="ink" tilt={7} />
            </div>
          </div>
        </div>
      </section>

      {/* works with - real logos, under the hero */}
      <section className="border-y border-zinc-950/8 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-5 px-5 py-7 sm:gap-x-14 sm:px-8">
          <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            Built for
          </span>
          {WORKS_WITH.map((w) => (
            <img
              key={w.slug}
              src={`https://cdn.simpleicons.org/${w.slug}/71717a`}
              alt={w.name}
              title={w.name}
              className="h-[22px] w-auto opacity-70 transition-opacity hover:opacity-100"
              loading="lazy"
            />
          ))}
        </div>
      </section>

      {/* problem - full-width editorial */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <Reveal>
            <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-amber-600">
              The quiet rejection
            </span>
            <h2 className="mt-5 max-w-[17ch] text-[2.1rem] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[2.7rem]">
              Two weeks lost over a caption the UI never said.
            </h2>
            <p className="mt-6 max-w-[56ch] text-[1.0625rem] leading-relaxed text-zinc-600">
              Review reads your screenshot, not your intent. A headline promising habits, on a screen
              that only counts streaks, is enough to bounce a build. Shotshot checks that text against
              the pixels before you submit.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <figure className="rounded-3xl bg-zinc-950 p-9 text-white shadow-[0_30px_70px_-40px_rgba(24,24,27,0.55)] sm:p-11">
              <figcaption className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                App Review
              </figcaption>
              <blockquote className="mt-6 text-[1.35rem] font-medium leading-[1.45] tracking-[-0.015em] sm:text-[1.5rem]">
                Your screenshots do not accurately reflect the app. Metadata must match the
                functionality shown in the build.
              </blockquote>
              <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
                <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-red-400">
                  Rejected
                </span>
                <span className="text-[13px] text-zinc-500">Guideline 2.3.3</span>
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* features - bento */}
      <section id="features" className="border-t border-zinc-950/8 bg-white/60 py-24 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-[46ch]">
            <h2 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
              Everything the store review looks for.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-zinc-600">
              Screenshots are ads. Shotshot treats them that way, and keeps the boring requirements out of your way.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {BENTO.map((cell, i) => {
              const Icon = cell.icon;
              const ink = cell.tone === "ink";
              const amber = cell.tone === "amber";
              return (
                <Reveal
                  key={cell.title}
                  delay={i * 70}
                  className={`${cell.span} rounded-3xl border p-7 ${
                    ink
                      ? "border-zinc-950 bg-zinc-950 text-white"
                      : amber
                        ? "border-amber-950/10 bg-[#fde9c8]"
                        : "border-zinc-950/8 bg-white"
                  }`}
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                      ink ? "bg-white/10 text-amber-400" : amber ? "bg-zinc-950 text-amber-300" : "bg-zinc-950/5 text-zinc-800"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </div>
                  <h3 className={`mt-5 text-[1.0625rem] font-semibold tracking-tight ${ink ? "text-white" : ""}`}>
                    {cell.title}
                  </h3>
                  <p className={`mt-2.5 max-w-[42ch] text-[0.9375rem] leading-relaxed ${ink ? "text-zinc-400" : "text-zinc-600"}`}>
                    {cell.body}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* process - vertical, verb headers */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <h2 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
              Drag, verify, export.
            </h2>
            <p className="mt-5 max-w-[38ch] text-[1.0625rem] leading-relaxed text-zinc-600">
              Three moves between a folder of raw captures and a store listing.
            </p>
            <div className="mt-9 hidden rounded-3xl border border-zinc-950/8 bg-white p-8 lg:block">
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                In the zip
              </span>
              <ul className="mt-5 space-y-3">
                {[
                  "iPhone 6.9, 6.5, 6.3, 6.1",
                  "iPad 13 and 12.9",
                  "Android phone, 7 and 10 inch",
                  "Play Store Feature Graphic",
                ].map((row) => (
                  <li key={row} className="flex items-center gap-3 text-[0.9375rem] text-zinc-700">
                    <Check className="h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
                    {row}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <div className="lg:pt-3">
            {PROCESS.map((step, i) => (
              <Reveal
                key={step.verb}
                delay={i * 90}
                className={`flex gap-7 py-8 ${i > 0 ? "border-t border-zinc-950/10" : ""}`}
              >
                <span className="font-[family-name:var(--font-geist-mono)] text-[13px] text-amber-600">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="text-[1.35rem] font-semibold tracking-tight">{step.verb}</h3>
                  <p className="mt-2.5 max-w-[48ch] text-[0.9375rem] leading-relaxed text-zinc-600">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* comparison - clean, not a hairlined table */}
      <section className="border-y border-zinc-950/8 bg-zinc-950 py-24 text-white lg:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-[44ch]">
            <h2 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
              Where the other tools stop.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-zinc-400">
              AppScreens, Previewed and the rest put text on a picture. That is the part that gets you bounced.
            </p>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-1 sm:grid-cols-2">
            {[COMPARISON.slice(0, 3), COMPARISON.slice(3)].map((group, gi) => (
              <Reveal key={gi} delay={gi * 90} className="divide-y divide-white/10">
                {group.map((row) => (
                  <div key={row.feature} className="flex items-center justify-between gap-6 py-5">
                    <span className="text-[0.9375rem] text-zinc-300">{row.feature}</span>
                    <span className="flex shrink-0 items-center gap-5">
                      <span className="flex items-center gap-2 text-[0.8125rem] text-white">
                        <Check className="h-4 w-4 text-amber-400" strokeWidth={2} />
                        Shotshot
                      </span>
                      <span className="flex w-[5.5rem] items-center gap-2 text-[0.8125rem] text-zinc-500">
                        {row.others === true ? (
                          <Check className="h-4 w-4 text-zinc-500" strokeWidth={2} />
                        ) : (
                          <X className="h-4 w-4 text-zinc-600" strokeWidth={2} />
                        )}
                        {typeof row.others === "string" ? row.others : "Others"}
                      </span>
                    </span>
                  </div>
                ))}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <Reveal className="max-w-[40ch]">
          <h2 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
            Pay nothing, or pay once.
          </h2>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-zinc-600">
            The free tier is not a demo. It is the whole tool for one project.
          </p>
        </Reveal>
        <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <PriceCard
            name="Free"
            priceUsd={0}
            period="forever"
            cta="Open editor"
            href="/"
            features={[
              "One project",
              "All six store sizes",
              "80+ locales",
              "OCR verify",
              "Git-trackable JSON",
              "Bring your own AI key",
            ]}
          />
          <PriceCard
            name="Pro"
            priceUsd={5}
            period="/ month"
            cta="Open editor"
            href="/"
            highlight
            features={[
              "Unlimited projects",
              "Cloud sync across devices",
              "AI captions without a key",
              "Everything in Free",
            ]}
          />
          <PriceCard
            name="Lifetime"
            priceUsd={49}
            period="once"
            cta="Open editor"
            href="/"
            features={[
              "Everything in Pro",
              "Pay once, keep it",
              "No renewals",
              "Same MIT source",
            ]}
          />
        </div>
      </section>

      {/* faq */}
      <section id="faq" className="border-t border-zinc-950/8 bg-white/60 py-24 lg:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-[0.65fr_1.35fr]">
          <Reveal>
            <h2 className="text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-[2.5rem]">
              Questions.
            </h2>
          </Reveal>
          <div>
            {FAQ.map((row, i) => (
              <Reveal key={row.q} delay={i * 60}>
                <details className={`group py-6 ${i > 0 ? "border-t border-zinc-950/10" : ""}`}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[1.0625rem] font-medium tracking-tight">
                    {row.q}
                    <span className="text-zinc-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3.5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-zinc-600">{row.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* final cta */}
      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full bg-amber-400/20 blur-[110px]" />
          <div className="relative">
            <h2 className="mx-auto max-w-[20ch] text-[2.2rem] font-semibold leading-[1.06] tracking-[-0.035em] text-white sm:text-[3rem]">
              Ship the next launch in five minutes.
            </h2>
            <p className="mx-auto mt-5 max-w-[44ch] text-[1.0625rem] text-zinc-400">
              No account needed to start. Open the editor and drop a screenshot in.
            </p>
            <Link
              href="/"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-amber-400 px-7 py-4 text-[15px] font-semibold text-zinc-950 transition-transform hover:-translate-y-px active:translate-y-0"
            >
              <Rocket className="h-[18px] w-[18px]" strokeWidth={2} />
              Open editor
            </Link>
          </div>
        </Reveal>
      </section>

      {/* footer */}
      <footer className="border-t border-zinc-950/8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-5 rounded-md bg-[conic-gradient(from_140deg,#f59e0b,#fb7185,#f59e0b)]" />
            <span className="text-[13px] text-zinc-500">Shotshot. MIT licensed.</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-zinc-500">
            <a href="/terms" className="transition-colors hover:text-zinc-950">Terms</a>
            <a href="/privacy" className="transition-colors hover:text-zinc-950">Privacy</a>
            <a href="/refund" className="transition-colors hover:text-zinc-950">Refunds</a>
            <a
              href="https://www.buymeacoffee.com/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-950"
            >
              <Coffee className="h-3.5 w-3.5" strokeWidth={1.75} />
              Buy me a coffee
            </a>
            <a
              href="https://github.com/sponsors/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-950"
            >
              <Github className="h-3.5 w-3.5" strokeWidth={1.75} />
              Sponsor
            </a>
            <span className="flex items-center gap-2">
              <LanguageSwitcher />
              <CurrencySwitcher />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PriceCard({
  name,
  priceUsd,
  period,
  cta,
  href,
  features,
  highlight = false,
}: {
  name: string;
  priceUsd: number;
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
      className={`flex flex-col rounded-3xl border p-8 ${
        highlight
          ? "border-zinc-950 bg-zinc-950 text-white shadow-[0_30px_70px_-45px_rgba(24,24,27,0.7)]"
          : "border-zinc-950/10 bg-white"
      }`}
    >
      <span className={`font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.16em] ${highlight ? "text-amber-400" : "text-zinc-500"}`}>
        {name}
      </span>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[2.75rem] font-semibold tracking-[-0.03em]">
          {display.symbol}
          {display.amount}
        </span>
        <span className={`text-[0.9375rem] ${highlight ? "text-zinc-400" : "text-zinc-500"}`}>{period}</span>
      </div>
      {display.original ? (
        <span className={`mt-1 text-[12px] ${highlight ? "text-zinc-500" : "text-zinc-400"}`}>{display.original}</span>
      ) : null}
      <ul className="mt-7 flex-1 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[0.9375rem]">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlight ? "text-amber-400" : "text-amber-600"}`} strokeWidth={2} />
            <span className={highlight ? "text-zinc-300" : "text-zinc-700"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3.5 text-[15px] font-medium transition-transform hover:-translate-y-px active:translate-y-0 ${
          highlight ? "bg-amber-400 text-zinc-950" : "bg-zinc-950 text-white"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
