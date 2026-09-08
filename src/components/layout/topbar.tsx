"use client";

import { Bell, Menu, Search, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRoleLabel } from "@/lib/utils";
import type { AuthUser } from "@/types";

type TopbarProps = {
  user: AuthUser;
  onMenuClick: () => void;
  onLogout: () => void;
};

export function Topbar({ user, onMenuClick, onLogout }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur lg:px-6">
      <Button variant="outline" size="sm" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
        <Input className="pl-9" placeholder="Search patients, appointments, medicines..." />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl bg-[#eef7ff] p-2 text-primary hover:bg-[#e4f1ff]"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 rounded-xl border border-border bg-[#fbfdff] px-3 py-2 sm:flex">
          <UserCircle2 className="h-5 w-5 text-teal" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
            <p className="text-xs text-muted">{formatRoleLabel(user.role)}</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onLogout}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
