import { NextResponse } from "next/server";
import { renderFastlaneSetup } from "@/lib/fastlane-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Parameters<typeof renderFastlaneSetup>[0];
  try {
    body = (await req.json()) as Parameters<typeof renderFastlaneSetup>[0];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.platform || !body.appName || !body.bundleId) {
    return NextResponse.json({ ok: false, error: "platform, appName, bundleId required" }, { status: 400 });
  }
  const text = renderFastlaneSetup(body);
  const safeName = body.appName.replace(/[^a-z0-9]/gi, "_");
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="Fastlane-${safeName}.md"`,
    },
  });
}
