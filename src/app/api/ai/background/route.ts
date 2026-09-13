// ponytail: DALL-E 3 image generation for slide backgrounds. BYOK.
// User supplies OpenAI key. We never see the prompt or result.

import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type Body = {
  prompt: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024";
  userKey?: string;
  style?: "vivid" | "natural";
};

export async function POST(req: Request) {
  // ponytail: 10 generations per IP per minute (DALL-E is expensive).
  const ip = getClientIp(req);
  const rl = rateLimit(ip, 10, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.resetAt);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.prompt) return NextResponse.json({ ok: false, error: "prompt required" }, { status: 400 });

  const userKey = body.userKey || process.env.OPENAI_API_KEY;
  if (!userKey) {
    return NextResponse.json(
      { ok: false, error: "No API key. Add your OpenAI key in settings or set OPENAI_API_KEY on the server." },
      { status: 402 },
    );
  }

  // ponytail: hint the model to leave a clean area in the center for headline + device.
  const enhancedPrompt = `${body.prompt}. Marketing background, soft gradient, clean composition, plenty of negative space in the center for text and a phone mockup. Photographic, professional, no text, no logos, no watermarks.`;

  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: body.size || "1024x1792",
        quality: "standard",
        style: body.style || "vivid",
        response_format: "url",
      }),
    });
    if (!r.ok) {
      const text = await r.text();
      return NextResponse.json({ ok: false, error: `OpenAI ${r.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }
    const data = await r.json();
    const url = data.data?.[0]?.url;
    if (!url) return NextResponse.json({ ok: false, error: "No image URL in response" }, { status: 502 });

    // ponytail: download + upload to our /api/upload so it's a stable URL the user owns.
    // This decouples from OpenAI's expiring URLs.
    try {
      const img = await fetch(url);
      const buf = await img.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      const contentType = img.headers.get("content-type") || "image/png";
      const upload = await fetch(new URL("/api/upload", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({ dataUrl: `data:${contentType};base64,${b64}` }),
      });
      const uploaded = await upload.json();
      if (uploaded.ok) {
        return NextResponse.json({ ok: true, path: uploaded.path, revised_prompt: data.data[0].revised_prompt });
      }
    } catch {
      // ponytail: fallback to OpenAI URL (expires in 1hr but user can re-generate).
    }
    return NextResponse.json({ ok: true, url, revised_prompt: data.data[0].revised_prompt });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
