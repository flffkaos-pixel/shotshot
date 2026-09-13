"use client";
// ponytail: "Upload to store" generates Fastlane config from the current project state.
// One-click download of Fastfile + Appfile snippets for iOS or Android.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Apple, Smartphone, Download, X, Check } from "lucide-react";
import { toast } from "sonner";

export function FastlaneButton({
  appName,
  bundleId,
  zipPath,
  locales,
}: {
  appName: string;
  bundleId?: string;
  zipPath?: string;
  locales: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [platform, setPlatform] = React.useState<"ios" | "android">("ios");
  const [name, setName] = React.useState(appName);
  const [bid, setBid] = React.useState(bundleId || `com.example.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
  const [busy, setBusy] = React.useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/fastlane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          appName: name,
          bundleId: bid,
          zipPath: zipPath || `./${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-screenshots.zip`,
          locales,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fastlane-${name.replace(/[^a-z0-9]/gi, "_")}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fastlane config downloaded. Drop into your iOS/Android project root.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)} title="Generate Fastlane config to upload screenshots to App Store / Play Store">
        <Rocket className="h-3.5 w-3.5" /> Upload to store
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <button
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Rocket className="h-4 w-4" />
          Upload to store
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Generate a Fastlane config for one-click upload. You supply your own App Store Connect / Play Console API key.
        </p>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setPlatform("ios")}
            className={`flex items-center justify-center gap-2 rounded border p-2 text-sm ${platform === "ios" ? "border-foreground bg-foreground/5" : "border-dashed"}`}
          >
            <Apple className="h-4 w-4" /> iOS
          </button>
          <button
            onClick={() => setPlatform("android")}
            className={`flex items-center justify-center gap-2 rounded border p-2 text-sm ${platform === "android" ? "border-foreground bg-foreground/5" : "border-dashed"}`}
          >
            <Smartphone className="h-4 w-4" /> Android
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <Label className="text-xs">App name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs">{platform === "ios" ? "Bundle ID" : "Package name"}</Label>
            <Input value={bid} onChange={(e) => setBid(e.target.value)} placeholder="com.example.app" className="h-8 text-sm" />
          </div>
        </div>

        <div className="mt-3 space-y-1 rounded bg-muted/50 p-2 text-[11px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" /> Locales: {locales.join(", ") || "en"}
          </p>
          <p className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" /> Configures deliver (iOS) or supply (Android)
          </p>
          <p className="flex items-center gap-1">
            <Check className="h-3 w-3 text-green-500" /> Skips binary/metadata upload — screenshots only
          </p>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={download} disabled={busy || !name || !bid}>
            <Download className="h-4 w-4" /> {busy ? "Generating…" : "Download Fastfile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
