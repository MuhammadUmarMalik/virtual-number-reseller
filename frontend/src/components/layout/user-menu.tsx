"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">
          {user.fullName}
        </p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void signOut()}
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
