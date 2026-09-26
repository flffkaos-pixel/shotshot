// ponytail: R2 upload via fetch+HMAC (works everywhere). No fs/path imports — pure fetch + Web Crypto.
// On Cloudflare Workers, R2 is the only storage option.

import { NextResponse } from "next/server";
import { r2Put } from "@/lib/r2";

export const dynamic = "force-dynamic";

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  // ponytail: edge-safe base64 decode.
  const binStr = atob(m[2]);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return { mime, bytes };
}

function r2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}

export async function POST(req: Request) {
  let body: { dataUrl?: string };
  try {
    body = (await req.json()) as { dataUrl?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body?.dataUrl || typeof body.dataUrl !== "string") {
    return NextResponse.json({ ok: false, error: "Missing dataUrl" }, { status: 400 });
  }
  const parsed = parseDataUrl(body.dataUrl);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "Unsupported data URL" }, { status: 400 });
  }
  const ext = MIME_EXT[parsed.mime];
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: `Unsupported mime: ${parsed.mime}` },
      { status: 400 },
    );
  }
  if (parsed.bytes.byteLength > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Image too large (>8MB)" }, { status: 413 });
  }

  // ponytail: Web Crypto SHA-1 (Edge compatible). We use SHA-1 for content address only — not security.
  const hashBuf = await crypto.subtle.digest("SHA-1", parsed.bytes.buffer.slice(parsed.bytes.byteOffset, parsed.bytes.byteOffset + parsed.bytes.byteLength) as ArrayBuffer);
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
  const filename = `${hash}.${ext}`;

  if (!r2Configured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET env vars.",
      },
      { status: 503 },
    );
  }

  try {
    const url = await r2Put({
      key: `screenshots/uploaded/${filename}`,
      body: parsed.bytes,
      contentType: parsed.mime,
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKey: process.env.R2_ACCESS_KEY_ID!,
      secretKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET!,
      publicUrl: process.env.R2_PUBLIC_URL,
    });
    return NextResponse.json({ ok: true, path: url });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `R2: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }
}
