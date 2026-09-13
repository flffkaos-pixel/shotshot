"use client";
// ponytail: client-side OCR via Tesseract.js WASM. zero server cost.
// tells user "this caption text is actually visible in the screenshot" to dodge app-review metadata rejection.
// supports en/ko/ja/zh via locale-driven model selection + user word list for accuracy.

import * as React from "react";

type Check = { ok: boolean; reason: string; matched?: string[]; missing?: string[]; lang?: string };

// ponytail: map app locale → tesseract model.
const TESSERACT_LANG: Record<string, string> = {
  en: "eng",
  ko: "kor",
  ja: "jpn",
  zh: "chi_sim",
  "zh-Hans": "chi_sim",
  "zh-Hant": "chi_tra",
  ar: "ara",
  ru: "rus",
  de: "deu",
  fr: "fra",
  es: "spa",
  it: "ita",
  pt: "por",
  nl: "nld",
  tr: "tur",
  pl: "pol",
  sv: "swe",
  vi: "vie",
  th: "tha",
  hi: "hin",
  he: "heb",
  id: "ind",
  "ko+en": "kor+eng", // ponytail: combo for mixed Korean/English UI
};

function pickLang(locale: string): string {
  // ponytail: app names like "Habit Tracker - 습관 트래커" benefit from kor+eng dual recognition.
  const code = locale.split("-")[0].toLowerCase();
  if (code === "ko") return "kor+eng";
  return TESSERACT_LANG[code] || "eng";
}

const _workerCache = new Map<string, Promise<Tesseract.Worker>>();

async function getWorker(lang: string): Promise<Tesseract.Worker> {
  const cached = _workerCache.get(lang);
  if (cached) return cached;
  const p = (async () => {
    const Tesseract = await import("tesseract.js");
    const w = await Tesseract.createWorker(lang, undefined, {
      // ponytail: log suppressed; uncomment for debug
      // logger: (m) => console.log("[ocr]", m),
    });
    return w;
  })();
  _workerCache.set(lang, p);
  return p;
}

function tokenize(text: string, lang: string): string[] {
  // ponytail: split CJK into 1-2 char tokens (Tesseract returns runs that may glue CJK),
  // and Latin into word tokens.
  const tokens: string[] = [];
  if (lang.startsWith("kor") || lang.startsWith("jpn") || lang.startsWith("chi")) {
    // Strip punctuation, then chunk.
    const cleaned = text.replace(/[\s\n]+/g, " ").replace(/[.,!?·:;()\[\]{}"'`~@#$%^&*+=/\\|<>]/g, " ").trim();
    if (cleaned) {
      for (const ch of cleaned) {
        if (/[가-힯]/.test(ch)) tokens.push(ch);
      }
      // Also keep 2-3 char CJK n-grams for matched app names.
      for (let i = 0; i < cleaned.length - 1; i++) {
        const two = cleaned.slice(i, i + 2);
        if (/^[가-힯]{2}$/.test(two)) tokens.push(two);
      }
    }
  }
  // Also Latin tokens.
  const latin = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  tokens.push(...latin);
  return Array.from(new Set(tokens));
}

export function CaptionCheck({
  imageUrl,
  caption,
  locale = "en",
}: {
  imageUrl: string | null;
  caption: string;
  locale?: string;
}) {
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = React.useState<Check | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [loadingLabel, setLoadingLabel] = React.useState("OCR");

  const run = React.useCallback(async () => {
    if (!imageUrl) return;
    const lang = pickLang(locale);
    setLoadingLabel(lang === "eng" ? "OCR" : `OCR (${lang})`);
    const claimWords = tokenize(caption, lang);
    if (claimWords.length === 0) {
      setResult({ ok: true, reason: "No claim words to verify.", lang });
      setState("done");
      return;
    }
    setState("loading");
    setProgress(0);
    try {
      const w = await getWorker(lang);
      setLoadingLabel("recognizing");
      const { data } = await w.recognize(imageUrl, {}, {});
      setProgress(1);
      const seenRaw = data.text.toLowerCase();
      const seen = seenRaw.replace(/[^a-z0-9가-힯ぁ-んァ-ヶ一-龯\s]/g, " ");

      const matched: string[] = [];
      const missing: string[] = [];
      for (const w of claimWords) {
        if (seen.includes(w.toLowerCase())) matched.push(w);
        else missing.push(w);
      }
      const coverage = matched.length / claimWords.length;
      const isLatin = lang === "eng" || lang === "deu" || lang === "fra" || lang === "spa" || lang === "ita" || lang === "por" || lang === "nld" || lang === "tur" || lang === "pol" || lang === "swe" || lang === "vie" || lang === "ind";
      const threshold = isLatin ? 0.5 : 0.3;
      setResult({
        ok: coverage >= threshold,
        reason:
          coverage >= threshold
            ? `${Math.round(coverage * 100)}% of caption words appear in the screenshot.`
            : `Only ${Math.round(coverage * 100)}% of caption words appear. App Review may flag "inaccurate metadata".`,
        matched,
        missing,
        lang,
      });
      setState("done");
    } catch (e) {
      setResult({ ok: false, reason: e instanceof Error ? e.message : String(e), lang });
      setState("error");
    }
  }, [imageUrl, caption, locale]);

  if (!imageUrl) return null;
  if (state === "idle") {
    return (
      <button
        type="button"
        onClick={run}
        className="text-xs text-muted-foreground underline hover:text-foreground"
        title="Use OCR to check that the caption text actually appears in your screenshot — prevents app-review rejection."
      >
        Verify caption appears in screenshot
      </button>
    );
  }
  if (state === "loading") {
    return <span className="text-xs text-muted-foreground">{loadingLabel} {Math.round(progress * 100)}%…</span>;
  }
  if (state === "error") {
    return <span className="text-xs text-destructive">OCR failed: {result?.reason}</span>;
  }
  if (!result) return null;
  return (
    <div className={`rounded border px-2 py-1 text-xs ${result.ok ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300" : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
      {result.ok ? "✓ " : "⚠ "}
      {result.reason}
      {result.lang && result.lang !== "eng" && <span className="ml-1 text-[10px] opacity-70">[{result.lang}]</span>}
      {result.missing && result.missing.length > 0 && (
        <div className="mt-1 text-[10px] opacity-70">
          Missing: {result.missing.slice(0, 5).join(", ")}{result.missing.length > 5 ? "…" : ""}
        </div>
      )}
    </div>
  );
}
