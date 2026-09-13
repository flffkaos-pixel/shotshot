"use client";
import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, change, locales } = useI18n();
  return (
    <div className="relative inline-flex items-center">
      <Globe className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
      <select
        value={locale}
        onChange={(e) => change(e.target.value as never)}
        className="appearance-none rounded border bg-background py-1 pl-7 pr-2 text-xs"
        title="Change language"
      >
        {locales.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
