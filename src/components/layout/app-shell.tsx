"use client";

import { useState, useSyncExternalStore, createContext, useContext, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import {
  CloseIcon,
  LayoutDashboardIcon,
  UsersIcon,
  SearchIcon,
  TrophyIcon,
  CalendarIcon,
  SwordsIcon,
  ActivityIcon,
  MessageSquareIcon,
  UserIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/models";

function createSidebarStore(storageKey: string) {
  const listeners = new Set<() => void>();

  const getSnapshot = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  };

  const getServerSnapshot = (): boolean => false;

  const subscribe = (callback: () => void): (() => void) => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  };

  const toggle = (): void => {
    if (typeof window === "undefined") return;
    const current = getSnapshot();
    const next = !current;
    try {
      localStorage.setItem(storageKey, String(next));
    } catch {}
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe,
    getSnapshot,
    getServerSnapshot,
    toggle,
  };
}

// External stores for persistent sidebar collapse state (zero hydration mismatch)
const coachSidebarStore = createSidebarStore("oa_coach_sidebar_collapsed");
const playerSidebarStore = createSidebarStore("oa_player_sidebar_collapsed");
const scoutSidebarStore = createSidebarStore("oa_scout_sidebar_collapsed");

export interface AppShellProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  children: ReactNode;
  title?: string;
  description?: string;
  badge?: ReactNode;
}

const roleBadgeStyles: Record<UserRole, { badge: string; dot: string }> = {
  coach: {
    badge: "bg-[#E4F1E8] text-[#263D32] border-[#397B53]/30",
    dot: "bg-[#397B53]",
  },
  player: {
    badge: "bg-sky-50 text-sky-800 border-sky-300/80",
    dot: "bg-sky-500",
  },
  scout: {
    badge: "bg-amber-50 text-amber-800 border-amber-300/80",
    dot: "bg-amber-500",
  },
};

interface NavItem {
  label: string;
  href: string;
  active: boolean;
  icon?: ReactNode;
}

const InAppShellContext = createContext<boolean>(false);

export function AppShell({ user, children }: AppShellProps) {
  const isNested = useContext(InAppShellContext);
  if (isNested) {
    return <>{children}</>;
  }

  return (
    <InAppShellContext.Provider value={true}>
      <AppShellContent user={user}>{children}</AppShellContent>
    </InAppShellContext.Provider>
  );
}

function AppShellContent({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isCoach = user.role === "coach";
  const isPlayer = user.role === "player";
  const isScout = user.role === "scout";

  // Persistent sidebar collapse state synced with localStorage and safe server snapshot
  const coachSidebarCollapsed = useSyncExternalStore(
    coachSidebarStore.subscribe,
    coachSidebarStore.getSnapshot,
    coachSidebarStore.getServerSnapshot
  );

  const playerSidebarCollapsed = useSyncExternalStore(
    playerSidebarStore.subscribe,
    playerSidebarStore.getSnapshot,
    playerSidebarStore.getServerSnapshot
  );

  const scoutSidebarCollapsed = useSyncExternalStore(
    scoutSidebarStore.subscribe,
    scoutSidebarStore.getSnapshot,
    scoutSidebarStore.getServerSnapshot
  );

  const sidebarCollapsed = isCoach
    ? coachSidebarCollapsed
    : isPlayer
    ? playerSidebarCollapsed
    : scoutSidebarCollapsed;

  const handleToggleSidebar = () => {
    if (isCoach) {
      coachSidebarStore.toggle();
    } else if (isPlayer) {
      playerSidebarStore.toggle();
    } else if (isScout) {
      scoutSidebarStore.toggle();
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  };

  const dashboardPath = `/dashboard/${user.role}`;

  const coachNavItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard/coach",
      active: pathname === "/dashboard/coach",
      icon: <LayoutDashboardIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Players",
      href: "/dashboard/coach/players",
      active: pathname.startsWith("/dashboard/coach/players"),
      icon: <UsersIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Scouts",
      href: "/dashboard/coach/scouts",
      active: pathname.startsWith("/dashboard/coach/scouts"),
      icon: <SearchIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Sports",
      href: "/dashboard/coach/sports",
      active: pathname.startsWith("/dashboard/coach/sports"),
      icon: <TrophyIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Sessions",
      href: "/dashboard/coach/sessions",
      active: pathname.startsWith("/dashboard/coach/sessions"),
      icon: <CalendarIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Matches",
      href: "/dashboard/coach/matches",
      active: pathname.startsWith("/dashboard/coach/matches"),
      icon: <SwordsIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Readiness",
      href: "/dashboard/coach/readiness",
      active: pathname.startsWith("/dashboard/coach/readiness"),
      icon: <ActivityIcon className="w-4 h-4 shrink-0" />,
    },
  ];

  const scoutNavItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard/scout",
      active: pathname === "/dashboard/scout",
      icon: <LayoutDashboardIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Talent Discovery",
      href: "/dashboard/scout/discover",
      active:
        pathname.startsWith("/dashboard/scout/discover") ||
        pathname.startsWith("/dashboard/scout/players"),
      icon: <SearchIcon className="w-4 h-4 shrink-0" />,
    },
  ];

  const playerPrimaryNavItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard/player",
      active: pathname === "/dashboard/player",
      icon: <LayoutDashboardIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Attendance",
      href: "/dashboard/player/attendance",
      active: pathname.startsWith("/dashboard/player/attendance"),
      icon: <CalendarIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Match History",
      href: "/dashboard/player/matches",
      active: pathname.startsWith("/dashboard/player/matches"),
      icon: <TrophyIcon className="w-4 h-4 shrink-0" />,
    },
    {
      label: "Coach Feedback",
      href: "/dashboard/player/remarks",
      active: pathname.startsWith("/dashboard/player/remarks"),
      icon: <MessageSquareIcon className="w-4 h-4 shrink-0" />,
    },
  ];

  const playerProfileNavItem: NavItem = {
    label: "My Profile",
    href: "/dashboard/player/profile",
    active: pathname.startsWith("/dashboard/player/profile"),
    icon: <UserIcon className="w-4 h-4 shrink-0" />,
  };

  const playerNavItems: NavItem[] = [...playerPrimaryNavItems, playerProfileNavItem];
  const allPlayerNavItems: NavItem[] = playerNavItems;

  const currentRoleStyle = roleBadgeStyles[user.role] || roleBadgeStyles.coach;

  // -------------------------------------------------------------
  // COACH LAYOUT: Flex Flow with Vintage Slate-Teal Sidebar & Parchment Canvas
  // -------------------------------------------------------------
  if (user.role === "coach") {
    return (
      <div className="min-h-screen bg-[#F5EBD8] text-[#132B32] flex flex-col md:flex-row">
        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col shrink-0 bg-[#11262C] border-r border-[#1B3B44] transition-all duration-200 ease-in-out sticky top-0 h-screen z-30 overflow-hidden",
            sidebarCollapsed ? "w-20 min-w-20 max-w-20" : "w-64 min-w-64 max-w-64"
          )}
        >
          {/* Sidebar Top Header with Logo & Toggle Button */}
          <div
            className={cn(
              "border-b border-[#1B3B44] bg-[#11262C] transition-all shrink-0",
              sidebarCollapsed
                ? "flex flex-col items-center justify-center gap-2 py-3 px-2"
                : "h-16 flex items-center justify-between px-4"
            )}
          >
            <Link
              href={dashboardPath}
              className="flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-md"
              aria-label="One Academy Coach Dashboard"
            >
              <Logo size="sm" variant="white" showWordmark={!sidebarCollapsed} />
            </Link>

            {/* Toggle Button Always Accessible */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#C5A56A] hover:text-white hover:bg-[#1A3840] transition-colors cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? (
                <svg
                  className="w-4 h-4 text-[#D95B24]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-[#C5A56A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden relative z-10">
            {coachNavItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  prefetch={true}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24]",
                    sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                    item.active
                      ? "bg-[#D95B24] text-white font-bold shadow-sm"
                      : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C] border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      item.active ? "text-white" : "text-[#E9DCC5] group-hover:text-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>

                {/* Floating Tooltip when collapsed */}
                {sidebarCollapsed && (
                  <div
                    role="tooltip"
                    aria-hidden="true"
                    className="hidden pointer-events-none group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#132B32] border border-[#1B3B44] text-[#FFF9EF] text-[11px] font-semibold rounded-md shadow-lg z-50 whitespace-nowrap"
                  >
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Subtle Vintage Athletic Line Sphere Artwork at Bottom */}
          <div className="relative shrink-0 pointer-events-none select-none overflow-hidden px-4 py-2 flex items-center justify-start opacity-35">
            <svg
              viewBox="0 0 100 100"
              className={cn("text-[#D5A64A] transition-all", sidebarCollapsed ? "w-12 h-12 mx-auto" : "w-24 h-24 -ml-2 -mb-2")}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              {/* Outer sphere and concentric curved athletic seams */}
              <circle cx="50" cy="50" r="45" strokeWidth="1.2" />
              <ellipse cx="50" cy="50" rx="45" ry="18" />
              <ellipse cx="50" cy="50" rx="18" ry="45" />
              <path d="M12,30 C30,22 70,22 88,30" />
              <path d="M12,70 C30,78 70,78 88,70" />
              <path d="M30,12 C22,30 22,70 30,88" />
              <path d="M70,12 C78,30 78,70 70,88" />
              {/* Spiraling rosette seams */}
              <path d="M18,18 Q50,50 82,82" strokeDasharray="2 2" />
              <path d="M18,82 Q50,50 82,18" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Sidebar Bottom: Role Indicator & Expand Helper */}
          <div className="p-3 border-t border-[#1B3B44] bg-[#0E1F24] shrink-0 overflow-hidden">
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={handleToggleSidebar}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-full py-2 flex items-center justify-center text-[#C5A56A] hover:text-[#D95B24] hover:bg-[#1A3840] rounded-lg transition-colors cursor-pointer border border-transparent"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-medium text-[#A2BAC0]">
                  <span className="font-bold text-[#E9DCC5]">One Academy</span>
                  <div className="text-[10px] text-[#718E94]">Coach Portal</div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
                  <span className="w-1 h-1 rounded-full bg-[#4ADE80]" />
                  <span>Coach</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area (Naturally Takes Remaining Width) */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F5EBD8] overflow-x-hidden">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 w-full bg-[#F5EBD8]/95 backdrop-blur-md border-b border-[#E2D7C3] h-16 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
              {/* Left: Mobile Drawer Trigger / Desktop Breadcrumb */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open mobile navigation menu"
                  className="md:hidden p-2 rounded-lg text-[#132B32] hover:bg-[#EAE0CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] shrink-0 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                <div className="md:hidden flex items-center">
                  <Link href={dashboardPath}>
                    <Logo size="sm" variant="dark" showWordmark={true} />
                  </Link>
                </div>

                {/* Desktop breadcrumb context */}
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#132B32]">
                  <span className="font-bold text-[#132B32]">Coach Portal</span>
                  <span className="text-[#A89F91]">/</span>
                  <span className="text-[#D95B24] font-bold">
                    {coachNavItems.find((n) => n.active)?.label || "Dashboard"}
                  </span>
                </div>
              </div>

              {/* Right: Role Badge, Avatar & Logout */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Role Badge: Deep Forest Green with bright dot */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shadow-2xs shrink-0 select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">COACH</span>
                </div>

                {/* Circular Avatar */}
                <div
                  className="w-8 h-8 rounded-full bg-[#D5A64A] text-[#132B32] border border-[#132B32]/30 flex items-center justify-center font-bold text-xs select-none shadow-2xs"
                  title={user.email}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center text-xs font-semibold h-8 px-3 rounded-lg border border-[#DACBB4] bg-[#FFF9EF] text-[#132B32] hover:text-red-700 hover:border-red-300 hover:bg-red-50/50 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">{loggingOut ? "Logging out…" : "Log Out"}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Slide-Out Drawer with Backdrop */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="fixed inset-0 bg-[#11262C]/70 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              <div className="fixed inset-y-0 left-0 w-72 bg-[#11262C] border-r border-[#1B3B44] shadow-2xl flex flex-col p-5 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#1B3B44]">
                  <Logo size="sm" variant="white" showWordmark={true} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 text-[#C5A56A] hover:text-white rounded-lg hover:bg-[#1A3840] cursor-pointer"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-2.5 text-xs text-[#A2BAC0] border-b border-[#1B3B44]">
                  Coach Navigation • Single Academy
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  {coachNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                        item.active
                          ? "bg-[#D95B24] text-white font-bold"
                          : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C]"
                      )}
                    >
                      <span className={cn(item.active ? "text-white" : "text-[#E9DCC5]")}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="pt-4 border-t border-[#1B3B44]">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#FFF9EF] bg-red-800/80 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{loggingOut ? "Logging out…" : "Log Out"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Dashboard Footer */}
          <footer className="w-full bg-white border-t border-[#E2EAE5] py-4 text-center text-xs text-slate-500 shrink-0">
            One Academy • Single-Academy Sports Management System • Authenticated Coach Portal
          </footer>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PLAYER LAYOUT: Retro Slate-Teal Sidebar & Warm Parchment Canvas
  // -------------------------------------------------------------
  if (user.role === "player") {
    return (
      <div className="min-h-screen bg-[#F5EBD8] text-[#132B32] flex flex-col md:flex-row">
        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col shrink-0 bg-[#11262C] border-r border-[#1B3B44] transition-all duration-200 ease-in-out sticky top-0 h-screen z-30 overflow-hidden",
            sidebarCollapsed ? "w-20 min-w-20 max-w-20" : "w-64 min-w-64 max-w-64"
          )}
        >
          {/* Sidebar Top Header with Logo & Toggle Button */}
          <div
            className={cn(
              "border-b border-[#1B3B44] bg-[#11262C] transition-all shrink-0",
              sidebarCollapsed
                ? "flex flex-col items-center justify-center gap-2 py-3 px-2"
                : "h-16 flex items-center justify-between px-4"
            )}
          >
            <Link
              href={dashboardPath}
              className="flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-md"
              aria-label="One Academy Player Dashboard"
            >
              <Logo size="sm" variant="white" showWordmark={!sidebarCollapsed} />
            </Link>

            {/* Toggle Button Always Accessible */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#C5A56A] hover:text-white hover:bg-[#1A3840] transition-colors cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? (
                <svg
                  className="w-4 h-4 text-[#D95B24]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-[#C5A56A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden relative z-10">
            {playerPrimaryNavItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  prefetch={true}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24]",
                    sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                    item.active
                      ? "bg-[#D95B24] text-white font-bold shadow-sm"
                      : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C] border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      item.active ? "text-white" : "text-[#E9DCC5] group-hover:text-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>

                {/* Floating Tooltip when collapsed */}
                {sidebarCollapsed && (
                  <div
                    role="tooltip"
                    aria-hidden="true"
                    className="hidden pointer-events-none group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#132B32] border border-[#1B3B44] text-[#FFF9EF] text-[11px] font-semibold rounded-md shadow-lg z-50 whitespace-nowrap"
                  >
                    {item.label}
                  </div>
                )}
              </div>
            ))}

            {/* Vintage Divider before My Profile */}
            <div className="my-2.5 border-t border-[#1B3B44]/80" />

            {/* STRICTLY LAST NAVIGATION ITEM: My Profile */}
            <div className="relative group">
              <Link
                href={playerProfileNavItem.href}
                prefetch={true}
                title={sidebarCollapsed ? playerProfileNavItem.label : undefined}
                aria-label={sidebarCollapsed ? playerProfileNavItem.label : undefined}
                className={cn(
                  "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24]",
                  sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                  playerProfileNavItem.active
                    ? "bg-[#D95B24] text-white font-bold shadow-sm"
                    : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C] border border-transparent"
                )}
              >
                <span
                  className={cn(
                    playerProfileNavItem.active ? "text-white" : "text-[#E9DCC5] group-hover:text-white"
                  )}
                >
                  {playerProfileNavItem.icon}
                </span>
                {!sidebarCollapsed && <span className="truncate">{playerProfileNavItem.label}</span>}
              </Link>

              {sidebarCollapsed && (
                <div
                  role="tooltip"
                  aria-hidden="true"
                  className="hidden pointer-events-none group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#132B32] border border-[#1B3B44] text-[#FFF9EF] text-[11px] font-semibold rounded-md shadow-lg z-50 whitespace-nowrap"
                >
                  {playerProfileNavItem.label}
                </div>
              )}
            </div>
          </nav>

          {/* Subtle Vintage Athletic Line Sphere Artwork at Bottom */}
          <div className="relative shrink-0 pointer-events-none select-none overflow-hidden px-4 py-2 flex items-center justify-start opacity-35">
            <svg
              viewBox="0 0 100 100"
              className={cn("text-[#D5A64A] transition-all", sidebarCollapsed ? "w-12 h-12 mx-auto" : "w-24 h-24 -ml-2 -mb-2")}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <circle cx="50" cy="50" r="45" strokeWidth="1.2" />
              <ellipse cx="50" cy="50" rx="45" ry="18" />
              <ellipse cx="50" cy="50" rx="18" ry="45" />
              <path d="M12,30 C30,22 70,22 88,30" />
              <path d="M12,70 C30,78 70,78 88,70" />
              <path d="M30,12 C22,30 22,70 30,88" />
              <path d="M70,12 C78,30 78,70 70,88" />
              <path d="M18,18 Q50,50 82,82" strokeDasharray="2 2" />
              <path d="M18,82 Q50,50 82,18" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Sidebar Bottom: Role Indicator & Expand Helper */}
          <div className="p-3 border-t border-[#1B3B44] bg-[#0E1F24] shrink-0 overflow-hidden">
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={handleToggleSidebar}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-full py-2 flex items-center justify-center text-[#C5A56A] hover:text-[#D95B24] hover:bg-[#1A3840] rounded-lg transition-colors cursor-pointer border border-transparent"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-medium text-[#A2BAC0]">
                  <span className="font-bold text-[#E9DCC5]">One Academy</span>
                  <div className="text-[10px] text-[#718E94]">Player Portal</div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
                  <span className="w-1 h-1 rounded-full bg-[#4ADE80]" />
                  <span>Player</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F5EBD8] overflow-x-hidden">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 w-full bg-[#F5EBD8]/95 backdrop-blur-md border-b border-[#E2D7C3] h-16 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
              {/* Left: Mobile Drawer Trigger / Desktop Breadcrumb */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open mobile navigation menu"
                  className="md:hidden p-2 rounded-lg text-[#132B32] hover:bg-[#EAE0CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] shrink-0 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                <div className="md:hidden flex items-center">
                  <Link href={dashboardPath}>
                    <Logo size="sm" variant="dark" showWordmark={true} />
                  </Link>
                </div>

                {/* Desktop breadcrumb context */}
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#132B32]">
                  <span className="font-bold text-[#132B32]">Player Portal</span>
                  <span className="text-[#A89F91]">/</span>
                  <span className="text-[#D95B24] font-bold">
                    {allPlayerNavItems.find((n) => n.active)?.label || "Overview"}
                  </span>
                </div>
              </div>

              {/* Right: Role Badge, Avatar & Logout */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Role Indicator Badge: PLAYER */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shadow-2xs select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shrink-0" aria-hidden="true" />
                  <span>PLAYER</span>
                </div>

                {/* Athlete User Avatar Circle */}
                <div
                  className="w-8 h-8 rounded-full bg-[#E5D7C0] border border-[#D5A64A] text-[#132B32] font-alfa text-xs flex items-center justify-center shrink-0 select-none shadow-2xs"
                  title={user.email}
                >
                  {user.email.slice(0, 1).toUpperCase()}
                </div>

                {/* Red Pill Log Out Button */}
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center text-xs font-semibold h-8 px-3 rounded-lg bg-red-800/80 hover:bg-red-700 text-[#FFF9EF] transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">{loggingOut ? "Logging out…" : "Log Out"}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Slide-Out Drawer with Backdrop */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="fixed inset-0 bg-[#11262C]/70 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              <div className="fixed inset-y-0 left-0 w-72 bg-[#11262C] border-r border-[#1B3B44] shadow-2xl flex flex-col p-5 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#1B3B44]">
                  <Logo size="sm" variant="white" showWordmark={true} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 text-[#C5A56A] hover:text-white rounded-lg hover:bg-[#1A3840] cursor-pointer"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-2.5 text-xs text-[#A2BAC0] border-b border-[#1B3B44]">
                  Player Navigation • Single Academy
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  {playerPrimaryNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                        item.active
                          ? "bg-[#D95B24] text-white font-bold"
                          : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C]"
                      )}
                    >
                      <span className={cn(item.active ? "text-white" : "text-[#E9DCC5]")}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  ))}

                  <div className="my-2 border-t border-[#1B3B44]" />

                  {/* Strictly last navigation item: My Profile */}
                  <Link
                    href={playerProfileNavItem.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                      playerProfileNavItem.active
                        ? "bg-[#D95B24] text-white font-bold"
                        : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C]"
                    )}
                  >
                    <span className={cn(playerProfileNavItem.active ? "text-white" : "text-[#E9DCC5]")}>
                      {playerProfileNavItem.icon}
                    </span>
                    <span>{playerProfileNavItem.label}</span>
                  </Link>
                </nav>

                <div className="pt-4 border-t border-[#1B3B44]">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#FFF9EF] bg-red-800/80 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{loggingOut ? "Logging out…" : "Log Out"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Dashboard Footer */}
          <footer className="w-full bg-white border-t border-[#E2EAE5] py-4 text-center text-xs text-slate-500 shrink-0">
            One Academy • Single-Academy Sports Management System • Authenticated Player Portal
          </footer>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SCOUT LAYOUT: Retro Slate-Teal Sidebar & Warm Parchment Canvas
  // -------------------------------------------------------------
  if (user.role === "scout") {
    return (
      <div className="min-h-screen bg-[#F5EBD8] text-[#132B32] flex flex-col md:flex-row">
        {/* Desktop Collapsible Left Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col shrink-0 bg-[#11262C] border-r border-[#1B3B44] transition-all duration-200 ease-in-out sticky top-0 h-screen z-30 overflow-hidden",
            sidebarCollapsed ? "w-20 min-w-20 max-w-20" : "w-64 min-w-64 max-w-64"
          )}
        >
          {/* Sidebar Top Header with Logo & Toggle Button */}
          <div
            className={cn(
              "border-b border-[#1B3B44] bg-[#11262C] transition-all shrink-0",
              sidebarCollapsed
                ? "flex flex-col items-center justify-center gap-2 py-3 px-2"
                : "h-16 flex items-center justify-between px-4"
            )}
          >
            <Link
              href={dashboardPath}
              className="flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] rounded-md"
              aria-label="One Academy Scout Dashboard"
            >
              <Logo size="sm" variant="white" showWordmark={!sidebarCollapsed} />
            </Link>

            {/* Toggle Button Always Accessible */}
            <button
              type="button"
              onClick={handleToggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-1.5 rounded-lg text-[#C5A56A] hover:text-white hover:bg-[#1A3840] transition-colors cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? (
                <svg
                  className="w-4 h-4 text-[#D95B24]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-[#C5A56A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden relative z-10">
            {scoutNavItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  prefetch={true}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24]",
                    sidebarCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5",
                    item.active
                      ? "bg-[#D95B24] text-white font-bold shadow-sm"
                      : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C] border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      item.active ? "text-white" : "text-[#E9DCC5] group-hover:text-white"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>

                {/* Floating Tooltip when collapsed */}
                {sidebarCollapsed && (
                  <div
                    role="tooltip"
                    aria-hidden="true"
                    className="hidden pointer-events-none group-hover:block absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1 bg-[#132B32] border border-[#1B3B44] text-[#FFF9EF] text-[11px] font-semibold rounded-md shadow-lg z-50 whitespace-nowrap"
                  >
                    {item.label}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Subtle Vintage Athletic Line Sphere Artwork at Bottom */}
          <div className="relative shrink-0 pointer-events-none select-none overflow-hidden px-4 py-2 flex items-center justify-start opacity-35">
            <svg
              viewBox="0 0 100 100"
              className={cn("text-[#D5A64A] transition-all", sidebarCollapsed ? "w-12 h-12 mx-auto" : "w-24 h-24 -ml-2 -mb-2")}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            >
              <circle cx="50" cy="50" r="45" strokeWidth="1.2" />
              <ellipse cx="50" cy="50" rx="45" ry="18" />
              <ellipse cx="50" cy="50" rx="18" ry="45" />
              <path d="M12,30 C30,22 70,22 88,30" />
              <path d="M12,70 C30,78 70,78 88,70" />
              <path d="M30,12 C22,30 22,70 30,88" />
              <path d="M70,12 C78,30 78,70 70,88" />
              <path d="M18,18 Q50,50 82,82" strokeDasharray="2 2" />
              <path d="M18,82 Q50,50 82,18" strokeDasharray="2 2" />
            </svg>
          </div>

          {/* Sidebar Bottom: Role Indicator & Expand Helper */}
          <div className="p-3 border-t border-[#1B3B44] bg-[#0E1F24] shrink-0 overflow-hidden">
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={handleToggleSidebar}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-full py-2 flex items-center justify-center text-[#C5A56A] hover:text-[#D95B24] hover:bg-[#1A3840] rounded-lg transition-colors cursor-pointer border border-transparent"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ) : (
              <div className="flex items-center justify-between px-1">
                <div className="text-[11px] font-medium text-[#A2BAC0]">
                  <span className="font-bold text-[#E9DCC5]">One Academy</span>
                  <div className="text-[10px] text-[#718E94]">Scout Portal</div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E]">
                  <span className="w-1 h-1 rounded-full bg-[#4ADE80]" />
                  <span>Scout</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#F5EBD8] overflow-x-hidden">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-20 w-full bg-[#F5EBD8]/95 backdrop-blur-md border-b border-[#E2D7C3] h-16 shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
              {/* Left: Mobile Drawer Trigger / Desktop Breadcrumb */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open mobile navigation menu"
                  className="md:hidden p-2 rounded-lg text-[#132B32] hover:bg-[#EAE0CF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D95B24] shrink-0 cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>

                <div className="md:hidden flex items-center">
                  <Link href={dashboardPath}>
                    <Logo size="sm" variant="dark" showWordmark={true} />
                  </Link>
                </div>

                {/* Desktop breadcrumb context */}
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-[#132B32]">
                  <span className="font-bold text-[#132B32]">Scout Portal</span>
                  <span className="text-[#A89F91]">/</span>
                  <span className="text-[#D95B24] font-bold">
                    {scoutNavItems.find((n) => n.active)?.label || "Overview"}
                  </span>
                </div>
              </div>

              {/* Right: Role Badge, Avatar & Logout */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Role Indicator Badge: SCOUT */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#1F382B] text-[#FFF9EF] border border-[#2E543E] shadow-2xs select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] shrink-0" aria-hidden="true" />
                  <span>SCOUT</span>
                </div>

                {/* Scout User Avatar Circle */}
                <div
                  className="w-8 h-8 rounded-full bg-[#E5D7C0] border border-[#D5A64A] text-[#132B32] font-alfa text-xs flex items-center justify-center shrink-0 select-none shadow-2xs"
                  title={user.email}
                >
                  {user.email.slice(0, 1).toUpperCase()}
                </div>

                {/* Red Pill Log Out Button */}
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center text-xs font-semibold h-8 px-3 rounded-lg bg-red-800/80 hover:bg-red-700 text-[#FFF9EF] transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span className="whitespace-nowrap">{loggingOut ? "Logging out…" : "Log Out"}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Slide-Out Drawer with Backdrop */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="fixed inset-0 bg-[#11262C]/70 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
                aria-hidden="true"
              />

              <div className="fixed inset-y-0 left-0 w-72 bg-[#11262C] border-r border-[#1B3B44] shadow-2xl flex flex-col p-5 animate-in slide-in-from-left duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-[#1B3B44]">
                  <Logo size="sm" variant="white" showWordmark={true} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-1.5 text-[#C5A56A] hover:text-white rounded-lg hover:bg-[#1A3840] cursor-pointer"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="py-2.5 text-xs text-[#A2BAC0] border-b border-[#1B3B44]">
                  Scout Navigation • Single Academy
                </div>

                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                  {scoutNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors",
                        item.active
                          ? "bg-[#D95B24] text-white font-bold"
                          : "text-[#E9DCC5] hover:text-white hover:bg-[#17343C]"
                      )}
                    >
                      <span className={cn(item.active ? "text-white" : "text-[#E9DCC5]")}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="pt-4 border-t border-[#1B3B44]">
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#FFF9EF] bg-red-800/80 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>{loggingOut ? "Logging out…" : "Log Out"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Dashboard Footer */}
          <footer className="w-full bg-white border-t border-[#E2EAE5] py-4 text-center text-xs text-slate-500 shrink-0">
            One Academy • Single-Academy Sports Management System • Authenticated Scout Portal
          </footer>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FALLBACK LAYOUT: Strictly Preserved Top Navbar Header
  // -------------------------------------------------------------
  const navItems: NavItem[] = playerNavItems;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="w-5 h-5" />
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>

            {/* Approved Brand Logo (Left) */}
            <Link
              href={dashboardPath}
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md shrink-0"
              aria-label="One Academy Dashboard"
            >
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 pl-4 lg:pl-5 border-l border-slate-200">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 whitespace-nowrap",
                    item.active
                      ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/70 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Utility Items: Role Indicator Badge & Log Out Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-2xs shrink-0 select-none",
                currentRoleStyle.badge
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", currentRoleStyle.dot)} aria-hidden="true" />
              <span className="whitespace-nowrap">{user.role}</span>
            </div>

            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              className="inline-flex items-center justify-center text-xs font-semibold h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-red-700 hover:border-red-200 hover:bg-red-50/50 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <span className="whitespace-nowrap">{loggingOut ? "Logging out…" : "Log Out"}</span>
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2.5 shadow-md">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="truncate max-w-[200px]">
                Signed in as: <strong className="text-slate-900">{user.email}</strong>
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                  currentRoleStyle.badge
                )}
              >
                {user.role}
              </span>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors",
                    item.active
                      ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/70"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Dashboard Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        One Academy • Single-Academy Sports Management System • Authenticated Session
      </footer>
    </div>
  );
}
