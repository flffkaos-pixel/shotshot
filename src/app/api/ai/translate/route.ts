import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// ponytail: translate an array of {label, headline} into N target locales in one call.
// GPT-4o-mini handles 80+ locales well. input tokens ~ 200/output locale.

type Slide = { label?: string; headline?: string };
type Body = {
  appName: string;
  slides: Slide[];
  targetLocales: string[]; // e.g. ["ko", "ja", "de", "es"]
  sourceLocale?: string; // default "en"
  userKey?: string;
  tone?: string;
};

const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ko: "Korean",
  ja: "Japanese",
  "zh-Hans": "Simplified Chinese",
  "zh-Hant": "Traditional Chinese",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  "pt-BR": "Brazilian Portuguese",
  nl: "Dutch",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  pl: "Polish",
  ru: "Russian",
  tr: "Turkish",
  ar: "Arabic",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  hi: "Hindi",
  uk: "Ukrainian",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  el: "Greek",
  ms: "Malay",
  ca: "Catalan",
};

const SYSTEM = (tone: string) =>
  `You are an App Store Optimization (ASO) copywriter translating marketing screenshots into multiple languages. ` +
  `Rules: 1-2 syllable equivalents when possible, 3-5 words per line, no jargon, sell an outcome not a feature. ` +
  `Adapt cultural references; do not literally translate idioms. ` +
  `Preserve line breaks (\\n in JSON) when natural. ` +
  `Tone: ${tone || "short, punchy, one-idea-per-line"}. ` +
  `Output JSON object: { "<locale>": [{ "label": "...", "headline": "..." }, ...] } — one array per locale, same length as input. ` +
  `Do not explain. JSON only.`;

export async function POST(req: Request) {
  // ponytail: 5 batch translations per IP per minute.
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 5, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.appName || !Array.isArray(body.slides) || body.slides.length === 0 || !Array.isArray(body.targetLocales) || body.targetLocales.length === 0) {
    return NextResponse.json({ ok: false, error: "appName, slides, targetLocales required" }, { status: 400 });
  }

  const userKey = body.userKey || process.env.OPENROUTER_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!userKey) {
    return NextResponse.json(
      { ok: false, error: "No API key. Add your OpenAI key in settings or set OPENROUTER_API_KEY on the server." },
      { status: 402 },
    );
  }

  const unknown = body.targetLocales.filter((l) => !LOCALE_NAMES[l]);
  if (unknown.length > 0) {
    return NextResponse.json(
      { ok: false, error: `Unsupported locales: ${unknown.join(", ")}. Supported: ${Object.keys(LOCALE_NAMES).join(", ")}` },
      { status: 400 },
    );
  }

  const model = body.userKey ? "gpt-4o-mini" : "google/gemini-2.5-flash:free";
  const url = body.userKey
    ? "https://api.openai.com/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const localeList = body.targetLocales.map((l) => `${l} (${LOCALE_NAMES[l]})`).join(", ");
  const userPrompt =
    `App: ${body.appName}\n` +
    `Source slides (${body.sourceLocale || "en"}):\n` +
    body.slides.map((s, i) => `${i + 1}. label="${s.label || ""}" headline="${(s.headline || "").replace(/\n/g, "↵")}"`).join("\n") +
    `\n\nTranslate into these locales: ${localeList}.`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userKey}`,
        ...(url.includes("openrouter") ? { "HTTP-Referer": "https://shotshot.app" } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM(body.tone || "") },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ ok: false, error: `Upstream ${r.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: Record<string, Slide[]>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Model did not return JSON", raw }, { status: 502 });
    }
    // ponytail: normalize and validate
    const result: Record<string, Slide[]> = {};
    for (const locale of body.targetLocales) {
      const slides = parsed[locale] || [];
      result[locale] = body.slides.map((orig, i) => {
        const translated = slides[i] || {};
        return {
          label: typeof translated.label === "string" ? translated.label : orig.label,
          headline: typeof translated.headline === "string" ? translated.headline.replace(/↵/g, "\n") : orig.headline,
        };
      });
    }
    return NextResponse.json({ ok: true, translations: result, model });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
