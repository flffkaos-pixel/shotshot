"use client";
import * as React from "react";
import { useCurrency } from "@/lib/currency";

export function CurrencySwitcher() {
  const { currency, change, currencies } = useCurrency();
  return (
    <select
      value={currency}
      onChange={(e) => change(e.target.value as "USD" | "KRW")}
      className="rounded border bg-background px-2 py-1 text-xs"
      title="Display currency"
    >
      {currencies.map((c) => (
        <option key={c} value={c}>
          {c === "USD" ? "$ USD" : "₩ KRW"}
        </option>
      ))}
    </select>
  );
}
