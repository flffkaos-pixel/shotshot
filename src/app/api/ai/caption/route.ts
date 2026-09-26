import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

type Body = {
  appName: string;
  features: string[];
  tone?: string;
  userKey?: string; // BYOK: user-provided OpenAI-compatible key
  model?: string;
};

const SYSTEM = (tone: string) =>
  `You are an ASO copywriter. Output exactly ${tone ? tone : "short, punchy, one-idea-per-line"} headline copy for an App Store screenshot slide. ` +
  `Rules: 1-2 syllable words, 3-5 words per line, no jargon, sell an outcome not a feature. ` +
  `Return a JSON array of objects { "label": "FEATURE 01", "headline": "Two\\nword line." } — one per feature. ` +
  `Do not explain. Do not wrap in markdown. JSON only.`;

export async function POST(req: Request) {
  // ponytail: 20 caption generations per IP per minute.
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.appName || !Array.isArray(body.features) || body.features.length === 0) {
    return NextResponse.json({ ok: false, error: "appName + features required" }, { status: 400 });
  }

  const userKey = body.userKey || process.env.OPENROUTER_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!userKey) {
    return NextResponse.json(
      { ok: false, error: "No API key. Add your OpenAI/Anthropic key in settings or set OPENROUTER_API_KEY on the server." },
      { status: 402 },
    );
  }

  const model = body.model || (body.userKey ? "gpt-4o-mini" : "google/gemini-2.5-flash:free");
  const url = body.userKey
    ? "https://api.openai.com/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";

  const messages = [
    { role: "system", content: SYSTEM(body.tone || "") },
    {
      role: "user",
      content: `App: ${body.appName}\nFeatures (priority order):\n${body.features.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nGenerate one slide per feature.`,
    },
  ];

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
        messages,
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ ok: false, error: `Upstream ${r.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Model did not return JSON", raw }, { status: 502 });
    }
    return NextResponse.json({ ok: true, slides: parsed, model });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
