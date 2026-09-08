"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hospital, Stethoscope } from "lucide-react";

import { NAV_ITEMS } from "@/lib/constants";
import { cn, formatRoleLabel } from "@/lib/utils";
import type { UserRole } from "@/types";

type SidebarProps = {
  role: UserRole;
  onNavigate?: () => void;
};

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-white">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="rounded-xl bg-[#e8f3ff] p-2 text-primary">
          <Hospital className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-foreground">Emmaus Health</p>
          <p className="text-xs text-muted">{formatRoleLabel(role)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#e8f3ff] text-primary"
                  : "text-[#2d5573] hover:bg-[#f1f8ff]",
              )}
            >
              <Stethoscope className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
