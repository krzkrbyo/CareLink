"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  Heart,
  Menu,
  X,
  ChevronRight,
  LayoutGrid,
  Settings,
  UserCog,
} from "lucide-react";
import { Suspense, useState } from "react";
import { signOut } from "@/app/actions/auth";
import {
  ElderAppShellNav,
  ElderMobileBottomNav,
} from "@/components/elder/elder-sidebar";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { CaregiverElder } from "@/lib/auth/session";
import { elderCarePath, parseElderSlugFromPath } from "@/lib/elders/routes";

interface NavLink {
  href: string;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  match?: (pathname: string) => boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  role: "caregiver" | "elder";
  userName: string;
  avatarUrl?: string | null;
  elders?: CaregiverElder[];
  currentElderSlug?: string;
}

function isActive(pathname: string, href: string, customMatch?: (p: string) => boolean) {
  if (customMatch) return customMatch(pathname);
  if (href === "/cuidador") return pathname === "/cuidador";
  return pathname.startsWith(href);
}

export function AppShell({
  children,
  role,
  userName,
  avatarUrl = null,
  elders = [],
  currentElderSlug,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeElderSlug = currentElderSlug ?? parseElderSlugFromPath(pathname);
  const activeElder = elders.find((e) => e.slug === activeElderSlug);

  const caregiverMainLinks: NavLink[] = [
    {
      href: "/cuidador/resumen",
      label: "Panel general",
      description: "Resumen de todas las personas",
      icon: LayoutGrid,
      match: (p) => p === "/cuidador/resumen",
    },
    {
      href: "/cuidador",
      label: "Mis personas",
      description: "Ver, agregar y seleccionar",
      icon: Users,
      match: (p) => p === "/cuidador",
    },
  ];

  const caregiverElderLinks: NavLink[] = activeElderSlug
    ? [
        {
          href: elderCarePath(activeElderSlug, "dashboard"),
          label: "Resumen",
          description: "Alertas y actividad en vivo",
          icon: LayoutDashboard,
        },
        {
          href: elderCarePath(activeElderSlug, "configuracion"),
          label: "Plan de cuidado",
          description: "Medicamentos, citas y dieta",
          icon: ClipboardList,
        },
        {
          href: elderCarePath(activeElderSlug, "perfil"),
          label: "Perfil y ajustes",
          description: "Foto, datos y notificaciones",
          icon: UserCog,
          match: (p) => p.includes(elderCarePath(activeElderSlug, "perfil")),
        },
      ]
    : [];

  const caregiverAccountLink: NavLink = {
    href: "/configuracion",
    label: "Mi cuenta",
    description: "Tu perfil como cuidador",
    icon: Settings,
    match: (p) => p.startsWith("/configuracion"),
  };

  const mainLinks = caregiverMainLinks;
  const contextualLinks = role === "caregiver" ? caregiverElderLinks : [];

  function NavLinkItem({ link }: { link: NavLink }) {
    const Icon = link.icon;
    const active = isActive(pathname, link.href, link.match);

    return (
      <Link
        href={link.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
          active
            ? "bg-care-accent-dark text-white shadow-sm"
            : "text-care-muted hover:bg-care-secondary/30 hover:text-care-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{link.label}</p>
          <p
            className={cn(
              "truncate text-xs leading-tight",
              active ? "text-white/80" : "text-care-muted-light group-hover:text-care-muted"
            )}
          >
            {link.description}
          </p>
        </div>
        {active && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
      </Link>
    );
  }

  const NavContent = () => (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-6 flex items-center gap-3 px-2">
        {role === "caregiver" ? (
          <Link href="/configuracion" onClick={() => setMobileOpen(false)}>
            <UserAvatar name={userName} avatarUrl={avatarUrl} size="md" />
          </Link>
        ) : (
          <UserAvatar name={userName} avatarUrl={avatarUrl} size="md" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-care-foreground">CareLink</p>
          {role === "caregiver" ? (
            <Link
              href="/configuracion"
              onClick={() => setMobileOpen(false)}
              className="block truncate text-sm text-care-muted hover:text-care-accent-dark"
            >
              {userName}
            </Link>
          ) : (
            <p className="truncate text-sm text-care-muted">{userName}</p>
          )}
        </div>
      </div>

      {role === "caregiver" && activeElder && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-care-secondary/30 px-3 py-3">
          <UserAvatar
            name={activeElder.full_name}
            avatarUrl={activeElder.avatar_url}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-care-muted-light">
              Viendo ahora
            </p>
            <p className="truncate font-bold text-care-foreground">{activeElder.full_name}</p>
          </div>
        </div>
      )}

      {role === "caregiver" && elders.length > 0 && (
        <div className="mb-6 px-1">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-care-muted-light">
            Cambiar persona
          </p>
          <div className="space-y-1">
            {elders.map((e) => (
              <Link
                key={e.id}
                href={elderCarePath(e.slug, "dashboard")}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeElderSlug === e.slug
                    ? "bg-white font-semibold text-care-accent-dark shadow-sm"
                    : "text-care-muted hover:bg-care-secondary/30"
                )}
              >
                <UserAvatar
                  name={e.full_name}
                  avatarUrl={e.avatar_url}
                  size="sm"
                />
                <span className="truncate">{e.full_name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {role === "elder" ? (
        <Suspense
          fallback={
            <div className="space-y-4 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-care-secondary/30" />
              ))}
            </div>
          }
        >
          <ElderAppShellNav onNavigate={() => setMobileOpen(false)} />
        </Suspense>
      ) : (
        <>
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-care-muted-light">
            Menú
          </div>
          <nav className="flex flex-col gap-1">
            {mainLinks.map((link) => (
              <NavLinkItem key={link.href} link={link} />
            ))}
          </nav>
        </>
      )}

      {role === "caregiver" && (
        <>
          <div className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wide text-care-muted-light">
            Cuenta
          </div>
          <nav className="flex flex-col gap-1">
            <NavLinkItem link={caregiverAccountLink} />
          </nav>
        </>
      )}

      {contextualLinks.length > 0 && activeElder && (
        <>
          <div className="mb-2 mt-5 px-2 text-xs font-semibold uppercase tracking-wide text-care-muted-light">
            Seguimiento
          </div>
          <div className="mb-2 flex items-center gap-2 px-2">
            <UserAvatar
              name={activeElder.full_name}
              avatarUrl={activeElder.avatar_url}
              size="sm"
            />
            <span className="truncate text-sm font-semibold text-care-foreground">
              {activeElder.full_name}
            </span>
          </div>
          <nav className="flex flex-col gap-1">
            {contextualLinks.map((link) => (
              <NavLinkItem key={link.href} link={link} />
            ))}
          </nav>
        </>
      )}

      <form action={signOut} className="mt-auto px-1 pt-6">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-care-muted transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );

  const showMobileBottomNav = role === "caregiver" || role === "elder";

  const mobileBottomLinks: NavLink[] = showMobileBottomNav
    ? [
        {
          href: "/cuidador/resumen",
          label: "Panel",
          description: "Resumen general",
          icon: LayoutGrid,
          match: (p) => p === "/cuidador/resumen",
        },
        ...(activeElderSlug ? contextualLinks : []),
        {
          href: "/cuidador",
          label: "Personas",
          description: "Lista de personas",
          icon: Users,
          match: (p) => p === "/cuidador",
        },
        caregiverAccountLink,
      ]
    : [];

  return (
    <div className="min-h-dvh bg-care-primary">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-care-secondary/50 bg-white/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          {role === "caregiver" && activeElder ? (
            <UserAvatar
              name={activeElder.full_name}
              avatarUrl={activeElder.avatar_url}
              size="sm"
            />
          ) : (
            <Heart className="h-6 w-6 shrink-0 text-care-accent-dark" />
          )}
          <div className="min-w-0">
            <span className="block truncate font-bold text-care-foreground">CareLink</span>
            {role === "caregiver" && activeElder && (
              <span className="block truncate text-xs text-care-muted">{activeElder.full_name}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 text-care-muted hover:bg-care-secondary/30"
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-care-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="flex h-full w-[min(100%,20rem)] flex-col bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-care-secondary/50 lg:bg-white/80 lg:backdrop-blur-sm">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <NavContent />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <main className={cn("flex-1", showMobileBottomNav && "pb-20 lg:pb-0")}>{children}</main>

          {role === "caregiver" && showMobileBottomNav && (
          <nav
            aria-label="Acceso rápido"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-care-secondary/50 bg-white/95 px-1 py-2 backdrop-blur-sm lg:hidden"
          >
            <div className="mx-auto flex max-w-lg justify-around gap-0.5">
              {mobileBottomLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(pathname, link.href, link.match);
                const isElderContextLink =
                  activeElder &&
                  activeElderSlug &&
                  link.href.startsWith(elderCarePath(activeElderSlug));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "bg-care-accent/30 text-care-accent-darker"
                        : "text-care-muted"
                    )}
                  >
                    {isElderContextLink ? (
                      <UserAvatar
                        name={activeElder.full_name}
                        avatarUrl={activeElder.avatar_url}
                        size="sm"
                      />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
          )}

          {role === "elder" && (
            <Suspense fallback={null}>
              <ElderMobileBottomNav />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
