"use client";
// ponytail: batch translate every slide into N locales. BYOK. One-click apply.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Languages, KeyRound, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Slide } from "@/lib/types";

type SlideLite = { label?: string; headline?: string };
type ApiResp = {
  ok: true;
  translations: Record<string, SlideLite[]>;
  model: string;
} | { ok: false; error: string };

const PRESETS: { label: string; locales: string[] }[] = [
  { label: "All major (12)", locales: ["ko", "ja", "zh-Hans", "de", "fr", "es", "it", "pt-BR", "ru", "ar", "hi", "vi"] },
  { label: "Asia (6)", locales: ["ko", "ja", "zh-Hans", "zh-Hant", "th", "vi", "id"] },
  { label: "Europe (10)", locales: ["de", "fr", "es", "it", "pt", "nl", "sv", "pl", "ru", "tr"] },
  { label: "Top 3 (en+ko+ja)", locales: ["ko", "ja"] },
];

function getKey(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("shotshot:openai_key") || "";
}
function setKey(v: string) {
  if (typeof window === "undefined") return;
  if (v) sessionStorage.setItem("shotshot:openai_key", v);
  else sessionStorage.removeItem("shotshot:openai_key");
}

export function TranslateAllButton({
  appName,
  slides,
  currentLocale,
  onApply,
}: {
  appName: string;
  slides: Slide[];
  currentLocale: string;
  onApply: (translations: Record<string, SlideLite[]>) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [key, setKeyState] = React.useState("");
  const [targets, setTargets] = React.useState("ko,ja,zh-Hans,de,fr,es");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setKeyState(getKey());
  }, []);

  const run = async () => {
    setErr(null);
    setBusy(true);
    try {
      const list = targets
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (list.length === 0) throw new Error("Add at least one target locale");
      if (list.includes(currentLocale)) throw new Error(`"${currentLocale}" is the current locale, not a target`);

      const sourceSlides: SlideLite[] = slides.map((s) => ({
        label: typeof s.label === "string" ? s.label : (s.label?.[currentLocale] ?? ""),
        headline: typeof s.headline === "string" ? s.headline : (s.headline?.[currentLocale] ?? ""),
      }));

      const r = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName,
          slides: sourceSlides,
          targetLocales: list,
          sourceLocale: currentLocale,
          userKey: key || undefined,
        }),
      });
      const data = (await r.json()) as ApiResp;
      if (!data.ok) throw new Error(data.error);
      onApply(data.translations);
      const count = Object.keys(data.translations).length;
      toast.success(`Translated ${sourceSlides.length} slides into ${count} locales`);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setOpen(true)}>
        <Languages className="h-3.5 w-3.5" /> Translate all
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded border bg-card p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Translate to multiple locales</span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">×</button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">OpenAI API key (BYOK, optional)</Label>
        <div className="flex gap-1">
          <Input
            type="password"
            value={key}
            onChange={(e) => {
              setKeyState(e.target.value);
              setKey(e.target.value);
            }}
            placeholder="sk-…"
            className="h-7 text-xs"
          />
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="flex h-7 items-center text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground">
          <KeyRound className="inline h-3 w-3" /> sessionStorage only. No key? Server OpenRouter fallback works for free.
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px]">Target locales (comma-separated)</Label>
        <Input value={targets} onChange={(e) => setTargets(e.target.value)} className="h-7 text-xs" placeholder="ko, ja, de, fr" />
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setTargets(p.locales.join(", "))}
              className="rounded border border-dashed px-1.5 py-0.5 text-[10px] hover:border-solid"
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Source: <span className="font-mono">{currentLocale}</span> · Supported: en, ko, ja, zh-Hans, zh-Hant, de, fr, es, it, pt, pt-BR, nl, sv, da, no, fi, pl, ru, tr, ar, he, th, vi, id, hi, uk, cs, hu, ro, el, ms, ca
        </p>
      </div>

      {err && <p className="text-[10px] text-destructive">{err}</p>}

      <Button size="sm" className="h-7 w-full text-xs" disabled={busy} onClick={run}>
        {busy ? (
          <>
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            Translating {targets.split(/[,\s]+/).filter(Boolean).length} locales…
          </>
        ) : (
          "Translate all slides"
        )}
      </Button>
    </div>
  );
}
