import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export function getSupabaseServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      async get(name: string) {
        const store = await cookies();
        return store.get(name)?.value;
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          const store = await cookies();
          store.set({ name, value, ...options });
        } catch {
          // ignore (e.g. middleware vs route handler)
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          const store = await cookies();
          store.set({ name, value: "", ...options });
        } catch {
          // ignore
        }
      },
    },
  });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  // ponytail: service role bypasses RLS — for webhooks only.
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
