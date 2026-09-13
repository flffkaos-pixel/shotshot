// ponytail: Cloudflare R2 upload via raw fetch + AWS SigV4. Edge runtime compatible.
// No aws-sdk dependency. S3-compatible (R2 supports S3 API).

import { createHash, createHmac } from "node:crypto";

function toBuffer(data: ArrayBuffer | Uint8Array | string): ArrayBuffer {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  if (data instanceof Uint8Array) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }
  return data;
}

function sha256(data: ArrayBuffer | Uint8Array | string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", toBuffer(data));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    toBuffer(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function amzDate(d = new Date()): { dateStamp: string; amzNow: string } {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const amzNow = `${dateStamp}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  return { dateStamp, amzNow };
}

export async function r2Put(opts: {
  key: string;
  body: ArrayBuffer | Uint8Array;
  contentType: string;
  accountId: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl?: string;
}): Promise<string> {
  const endpoint = `https://${opts.accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${opts.bucket}/${opts.key}`;
  const { dateStamp, amzNow } = amzDate();
  const bodyBytes = opts.body instanceof Uint8Array ? opts.body : new Uint8Array(opts.body);
  const payloadHash = toHex(await sha256(bodyBytes));

  const canonicalHeaders = `content-type:${opts.contentType}\nhost:${opts.accountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzNow}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = [
    "PUT",
    `/${opts.bucket}/${opts.key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzNow,
    credentialScope,
    toHex(await sha256(canonicalRequest)),
  ].join("\n");

  // Derive signing key
  const kDate = await hmac(new TextEncoder().encode(`AWS4${opts.secretKey}`), dateStamp);
  const kRegion = await hmac(kDate, "auto");
  const kService = await hmac(kRegion, "s3");
  const kSigning = await hmac(kService, "aws4_request");
  const signature = toHex(await hmac(kSigning, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${opts.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const r = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": opts.contentType,
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzNow,
      Authorization: authHeader,
    },
    body: bodyBytes.buffer.slice(bodyBytes.byteOffset, bodyBytes.byteOffset + bodyBytes.byteLength) as ArrayBuffer,
  });
  if (!r.ok) {
    throw new Error(`R2 ${r.status}: ${await r.text()}`);
  }
  return opts.publicUrl ? `${opts.publicUrl}/${opts.key}` : `${endpoint}/${opts.bucket}/${opts.key}`;
}
