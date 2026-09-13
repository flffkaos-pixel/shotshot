"use client";
// ponytail: from a saved project, generate a static landing HTML. Preview inline + download.
// Lives in the project list view (not the editor) — landing is a one-shot artifact.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Globe, Download, X, Loader2 } from "lucide-react";

export function LandingGenerator({
  projectId,
  projectName,
  hasSupabase,
}: {
  projectId: string;
  projectName: string;
  hasSupabase: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [html, setHtml] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const close = () => {
    setOpen(false);
    if (url) {
      URL.revokeObjectURL(url);
      setUrl(null);
    }
  };

  const load = async () => {
    setBusy(true);
    setErr(null);
    try {
      // ponytail: use blob URL for preview iframe so we don't need a separate route hit.
      const r = await fetch(`/api/landing/render?id=${projectId}`, { credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const text = await r.text();
      setHtml(text);
      const blob = new Blob([text], { type: "text/html" });
      setUrl(URL.createObjectURL(blob));
      setOpen(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!html || !url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9-_]/gi, "_").toLowerCase() || "landing"}.html`;
    a.click();
  };

  if (!hasSupabase) return null;

  return (
    <>
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={load} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
        Landing
      </Button>

      {err && <p className="text-xs text-destructive">{err}</p>}

      {open && url && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-4">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col rounded-lg bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-semibold">Landing preview — {projectName}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={download}>
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button size="icon" variant="ghost" onClick={close}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <iframe src={url} className="flex-1 rounded-b-lg bg-white" title="Landing preview" />
          </div>
        </div>
      )}
    </>
  );
}
