// ponytail: dual-currency display. Hardcoded KRW for simplicity. In production, fetch daily from open.er-api.com.

import * as React from "react";

const RATE = 1400; // USD → KRW. Update quarterly.

export type Currency = "USD" | "KRW";

export function formatPrice(usd: number, currency: Currency): { symbol: string; amount: string; original: string } {
  if (currency === "KRW") {
    const krw = Math.round((usd * RATE) / 1000) * 1000;
    return {
      symbol: "₩",
      amount: krw.toLocaleString("ko-KR"),
      original: `($${usd} USD)`,
    };
  }
  return {
    symbol: "$",
    amount: usd.toFixed(0),
    original: "",
  };
}

export function detectCurrency(): Currency {
  if (typeof window === "undefined") return "USD";
  const stored = localStorage.getItem("shotshot:currency");
  if (stored === "USD" || stored === "KRW") return stored;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("ko")) return "KRW";
  return "USD";
}

export function setCurrency(c: Currency) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shotshot:currency", c);
}

export function useCurrency() {
  const [currency, setC] = React.useState<Currency>("USD");
  React.useEffect(() => {
    setC(detectCurrency());
  }, []);
  const change = React.useCallback((c: Currency) => {
    setCurrency(c);
    setC(c);
  }, []);
  const fmt = React.useCallback(
    (usd: number) => formatPrice(usd, currency),
    [currency],
  );
  return { currency, change, fmt, currencies: ["USD", "KRW"] as Currency[] };
}
