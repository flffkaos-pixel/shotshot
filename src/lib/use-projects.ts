"use client";
// ponytail: useProjects() — list/create/load/save projects in Supabase.
// 1 project = free. 2nd project creation triggers PayPal modal.
// All file I/O happens against Supabase, not the local JSON file.

import * as React from "react";
import { getSupabase } from "@/lib/supabase-client";
import type { ProjectState } from "@/lib/types";

export type DbProject = {
  id: string;
  name: string;
  state: ProjectState;
  updated_at: string;
};

export function useProjects() {
  const [projects, setProjects] = React.useState<DbProject[] | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [plan, setPlan] = React.useState<"free" | "pro" | "lifetime">("free");
  const [userId, setUserId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: sess } = await sb.auth.getSession();
    if (!sess.session) {
      setProjects(null);
      setUserId(null);
      return;
    }
    setUserId(sess.session.user.id);
    const { data: billing } = await sb.from("user_billing").select("plan").eq("user_id", sess.session.user.id).single();
    setPlan((billing?.plan as "free" | "pro" | "lifetime") || "free");
    const { data, error } = await sb
      .from("projects")
      .select("id,name,state,updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      setError(error.message);
      return;
    }
    setProjects((data || []) as DbProject[]);
  }, []);

  React.useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void refresh();
    const { data: sub } = sb.auth.onAuthStateChange(() => void refresh());
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const create = React.useCallback(
    async (name: string, state: ProjectState): Promise<DbProject | null> => {
      const sb = getSupabase();
      if (!sb) return null;
      if (plan === "free" && projects && projects.length >= 1) {
        setError("Free plan: 1 project. Upgrade to Pro for unlimited.");
        return null;
      }
      setBusy(true);
      setError(null);
      try {
        const { data: sess } = await sb.auth.getSession();
        if (!sess.session) {
          setError("Sign in first");
          return null;
        }
        const { data, error } = await sb
          .from("projects")
          .insert({ user_id: sess.session.user.id, name, state })
          .select("id,name,state,updated_at")
          .single();
        if (error) throw error;
        await refresh();
        return data as DbProject;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [plan, projects, refresh],
  );

  const save = React.useCallback(
    async (id: string, state: ProjectState) => {
      const sb = getSupabase();
      if (!sb) return;
      setError(null);
      const { error } = await sb.from("projects").update({ state, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) setError(error.message);
    },
    [],
  );

  const remove = React.useCallback(
    async (id: string) => {
      const sb = getSupabase();
      if (!sb) return;
      const { error } = await sb.from("projects").delete().eq("id", id);
      if (error) setError(error.message);
      else await refresh();
    },
    [refresh],
  );

  return { projects, activeId, setActiveId, plan, userId, error, busy, refresh, create, save, remove };
}
