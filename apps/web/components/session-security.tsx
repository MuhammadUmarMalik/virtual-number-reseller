"use client";

import { Laptop, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
  current: boolean;
}

export function SessionSecurity() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    try {
      const result = await apiRequest<{ sessions: Session[] }>("/api/auth/sessions");
      setSessions(result.sessions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load sessions.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-sky-800" /><h2 className="font-semibold text-slate-950">Active sessions</h2></div>
        <p className="mt-2 text-sm text-slate-600">Revoke devices you no longer recognise. Password resets revoke every session.</p>
      </div>
      {error ? <p className="p-5 text-sm text-red-700" role="alert">{error}</p> : null}
      <ul className="divide-y divide-slate-200">
        {sessions.map((session) => (
          <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={session.id}>
            <div className="flex gap-3">
              <Laptop className="mt-0.5 h-5 w-5 text-slate-500" aria-hidden />
              <div><p className="text-sm font-medium text-slate-950">{describeAgent(session.userAgent)} {session.current ? <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">This device</span> : null}</p><p className="mt-1 text-xs text-slate-500">{session.ipAddress ?? "IP unavailable"} · Started {new Date(session.createdAt).toLocaleDateString()}</p></div>
            </div>
            <button className="text-left text-sm font-semibold text-red-700 hover:underline" onClick={async () => {
              await apiRequest(`/api/auth/sessions/${session.id}`, { method: "DELETE" });
              if (session.current) window.location.assign("/login");
              else await load();
            }}>Revoke</button>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-200 p-5">
        <button className="text-sm font-semibold text-red-700 hover:underline" onClick={async () => {
          await apiRequest("/api/auth/sessions", { method: "DELETE" });
          window.location.assign("/login");
        }}>Sign out everywhere</button>
      </div>
    </section>
  );
}

function describeAgent(agent: string | null) {
  if (!agent) return "Unknown device";
  if (agent.includes("Firefox")) return "Firefox browser";
  if (agent.includes("Edg/")) return "Edge browser";
  if (agent.includes("Chrome")) return "Chrome browser";
  if (agent.includes("Safari")) return "Safari browser";
  return "Web browser";
}
