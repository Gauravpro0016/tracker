"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Timer,
  LayoutDashboard,
  Calendar,
  BarChart3,
  Trophy,
  CheckSquare,
  Target,
  User as UserIcon,
  Palette,
  ChevronLeft,
  ChevronRight,
  Flame,
  LogOut,
  LogIn,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTimerStore } from "@/store/timerStore";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

function AppSidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const collapsed = useTimerStore((state) => state.sidebarCollapsed);
  const setCollapsed = useTimerStore((state) => state.setSidebarCollapsed);
  const isRunning = useTimerStore((state) => state.isRunning);
  const mode = useTimerStore((state) => state.mode);

  // Sync live user profile data for immediate avatar & name updates
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const res = await fetch("/api/user");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user,
    staleTime: 30 * 1000,
  });

  const sidebarAvatar = userProfile?.avatar || session?.user?.image;
  const sidebarName = userProfile?.name || session?.user?.name;

  const queryClient = useQueryClient();
  const resetUserContext = useTimerStore((state) => state.resetUserContext);

  const handleSignOut = () => {
    resetUserContext();
    queryClient.clear();
    signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    { label: "Timer", href: "/", icon: Timer, highlight: isRunning },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Study Planner", href: "/planner", icon: Calendar },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Rankings", href: "/leaderboard", icon: Trophy },
    { label: "Habits", href: "/habits", icon: CheckSquare },
    { label: "Goals", href: "/goals", icon: Target },
    { label: "Profile", href: "/profile", icon: UserIcon },
    { label: "Appearance", href: "/appearance", icon: Palette },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-black/90 backdrop-blur-xl border-r border-neutral-800 transition-all duration-300 flex flex-col justify-between shadow-2xl ${
          collapsed ? "lg:w-20 w-64 max-w-[85vw]" : "w-64 max-w-[85vw]"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top: Logo & Navigation */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-800 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-3 overflow-hidden"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold tracking-tighter shrink-0">
                FD
              </div>
              {(!collapsed || mobileOpen) && (
                <div className="flex flex-col">
                  <span className="font-semibold tracking-tight text-white text-base">
                    FocusDesk
                  </span>
                  <span className="text-[10px] text-neutral-400 -mt-1 tracking-wider uppercase">
                    Study Tracker
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Items (smoothly scrolls on short screen heights) */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto overscroll-contain">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                  }`}
                  title={collapsed && !mobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? "text-black" : "text-neutral-400 group-hover:text-white"
                    }`}
                  />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}

                  {/* Active timer pulse indicator */}
                  {item.highlight && (
                    <span
                      className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto ${
                        collapsed && !mobileOpen ? "absolute top-2 right-2" : ""
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-neutral-800 shrink-0">
          {session?.user ? (
            <div
              className={`flex items-center gap-3 p-2 rounded-xl bg-neutral-900/40 border border-neutral-800/60 ${
                collapsed && !mobileOpen ? "justify-center" : ""
              }`}
            >
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden hover:ring-2 hover:ring-neutral-600 transition-all"
                title="View Profile"
              >
                {sidebarAvatar ? (
                  <img
                    src={sidebarAvatar}
                    alt={sidebarName || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (sidebarName || "U")[0].toUpperCase()
                )}
              </Link>

              {(!collapsed || mobileOpen) && (
                <Link href="/profile" className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-xs font-semibold text-white truncate">
                    {sidebarName}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {(session.user as any).username
                      ? `@${(session.user as any).username}`
                      : session.user.email}
                  </p>
                </Link>
              )}

              {(!collapsed || mobileOpen) && (
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(!collapsed || mobileOpen) ? (
                <div className="p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Guest Mode
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-2">
                    Data stored in browser. Sign up to sync across devices.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      href="/login"
                      className="text-center py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-500 text-white font-medium transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="text-center py-1.5 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900"
                  title="Log in"
                >
                  <LogIn className="w-5 h-5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

const MemoizedAppSidebar = React.memo(AppSidebar);
export { MemoizedAppSidebar as AppSidebar };
export default MemoizedAppSidebar;

