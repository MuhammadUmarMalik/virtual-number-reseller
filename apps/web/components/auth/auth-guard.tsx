"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface SessionData {
  user: { role: "USER" | "SUPPORT" | "ADMIN"; status: string };
  onboarding: { accountVerified: boolean; initialTopupDone: boolean; canPurchase: boolean };
}

export function AuthGuard({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "allowed" | "forbidden">("loading");

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        let session: SessionData;
        try {
          session = await apiRequest<SessionData>("/api/auth/me");
        } catch {
          await apiRequest("/api/auth/refresh", { method: "POST" });
          session = await apiRequest<SessionData>("/api/auth/me");
        }
        if (!active) return;
        if (admin && session.user.role !== "ADMIN") {
          setState("forbidden");
          return;
        }
        setState("allowed");
      } catch {
        if (active) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
    void check();
    return () => { active = false; };
  }, [admin, pathname, router]);

  if (state === "loading") return <div className="grid min-h-screen place-items-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-sky-800" aria-label="Checking your session" /></div>;
  if (state === "forbidden") return <main className="grid min-h-screen place-items-center bg-slate-50 px-4"><div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center"><h1 className="font-semibold text-amber-950">Admin access required</h1><p className="mt-2 text-sm text-amber-800">Your account does not have permission to view this area.</p></div></main>;
  return children;
}
