import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { renderLanding } from "@/lib/landing-renderer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const locale = url.searchParams.get("locale") || "en";
  const download = url.searchParams.get("download") === "1";

  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });

  const supabase = getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 503 });

  // ponytail: auth required. users get their own landing only.
  const { data: sess } = await supabase.auth.getSession();
  if (!sess.session) return NextResponse.json({ ok: false, error: "Sign in first" }, { status: 401 });

  const { data: project, error } = await supabase
    .from("projects")
    .select("name, state")
    .eq("id", id)
    .single();
  if (error || !project) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  // ponytail: bump payload so user-billed users (R2 url) get resolved; this is a server context.
  // For now, just trust the screenshot paths in the state. If R2 was used, URLs are absolute.
  const html = renderLanding(project.state, locale);

  if (download) {
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.name.replace(/[^a-z0-9-_]/gi, "_").toLowerCase() || "landing"}.html"`,
      },
    });
  }
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
