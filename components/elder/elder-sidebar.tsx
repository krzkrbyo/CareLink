"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  ELDER_NAV_GROUPS,
  elderSectionHref,
  parseElderSection,
} from "@/lib/elder-nav";
import { cn } from "@/lib/utils";

interface ElderAppShellNavProps {
  onNavigate?: () => void;
}

/** Grouped elder navigation for the AppShell sidebar. */
export function ElderAppShellNav({ onNavigate }: ElderAppShellNavProps) {
  const searchParams = useSearchParams();
  const activeId = parseElderSection(searchParams.get("seccion"));

  return (
    <nav aria-label="Menú principal" className="flex flex-col gap-5">
      {ELDER_NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-care-muted-light">
            {group.label}
          </p>
          <div className="flex flex-col gap-1">
            {group.items.map(({ id, label, icon: Icon, highlight }) => {
              const active = activeId === id;
              return (
                <Link
                  key={id}
                  href={elderSectionHref(id)}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                    active
                      ? highlight
                        ? "bg-red-600 text-white shadow-md"
                        : "bg-care-accent-dark text-white shadow-sm"
                      : highlight
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "text-care-muted hover:bg-care-secondary/30 hover:text-care-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 font-semibold leading-tight">{label}</span>
                  {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

interface ElderMobileBottomNavProps {
  onNavigate?: () => void;
}

/** Compact bottom bar for mobile elder view. */
export function ElderMobileBottomNav({ onNavigate }: ElderMobileBottomNavProps) {
  const searchParams = useSearchParams();
  const activeId = parseElderSection(searchParams.get("seccion"));
  const primaryIds = ["inicio", "medicamentos", "citas", "rutina"];
  const items = ELDER_NAV_GROUPS.flatMap((g) => g.items).filter((item) =>
    primaryIds.includes(item.id)
  );

  return (
    <nav
      aria-label="Acceso rápido"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-care-secondary/50 bg-white/95 px-2 py-2 backdrop-blur-sm lg:hidden"
    >
      <div className="mx-auto flex max-w-lg justify-around gap-1">
        {items.map(({ id, label, icon: Icon, highlight }) => {
          const active = activeId === id;
          return (
            <Link
              key={id}
              href={elderSectionHref(id)}
              onClick={onNavigate}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-semibold transition-colors",
                active
                  ? highlight
                    ? "bg-red-100 text-red-700"
                    : "bg-care-accent/30 text-care-accent-darker"
                  : highlight
                    ? "text-red-600"
                    : "text-care-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
