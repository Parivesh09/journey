"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/app/logout-button";
import { cn } from "@/lib/utils";
import { Bell, Menu, X, User, Settings as SettingsIcon } from "lucide-react";

const PRIMARY_NAV = [
  { key: "overview", label: "Overview", href: "/", number: "01" },
  { key: "today", label: "Today", href: "/today", number: "02" },
  { key: "roadmap", label: "Roadmap", href: "/roadmaps", number: "03" },
  { key: "calendar", label: "Calendar", href: "/calendar", number: "04" },
  { key: "study-sessions", label: "Study Sessions", href: "/study", number: "05" },
  { key: "progress", label: "Progress", href: "/progress", number: "06" },
];

const SECONDARY_NAV = [
  { key: "settings", label: "Settings", href: "/settings", number: "07" },
  { key: "notifications", label: "Notifications", href: "/notifications", number: "08" },
];

function BrandMark() {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-2xl font-bold tracking-tight text-foreground font-display leading-none">
        SDE
      </span>
      <span className="text-xl font-medium tracking-tight text-foreground font-display leading-none">
        COMMAND
      </span>
      <span className="text-lg font-normal tracking-tight text-primary/80 font-display leading-none">
        CENTER
      </span>
    </div>
  );
}

function StreakCard({ streak = 12 }: { streak?: number }) {
  return (
    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <span className="text-primary font-semibold">🔥</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-graphite-muted uppercase tracking-wide">Current Streak</p>
          <p className="text-2xl font-bold text-foreground font-display tabular-nums">{streak} days</p>
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, isActive, isSecondary = false }: { 
  item: { key: string; label: string; href: string; number: string }; 
  isActive: boolean; 
  isSecondary?: boolean;
}) {
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg",
        isActive
          ? "bg-primary/5 text-primary border-l-4 border-primary"
          : "text-graphite-muted hover:text-foreground hover:bg-muted/50",
        isSecondary && "text-graphite-muted"
      )}
    >
      <span className={cn(
        "font-mono text-xs w-5 tabular-nums",
        isActive ? "text-primary" : "text-graphite-faint"
      )}>
        {item.number}
      </span>
      <span className="font-medium truncate">{item.label}</span>
    </Link>
  );
}

function MobileNavButton({ item, isActive, onClick }: { 
  item: { key: string; label: string; href: string; icon: React.ReactNode }; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors rounded-lg min-w-[72px]",
        isActive
          ? "text-primary bg-primary/5"
          : "text-graphite-muted hover:text-foreground hover:bg-muted/50"
      )}
    >
      <span className="h-5 w-5">{item.icon}</span>
      <span>{item.label}</span>
    </button>
  );
}

interface AppShellProps {
  active: string;
  children: ReactNode;
  user: {
    name: string | null;
    email: string;
  } | null;
}

export default function AppShell({ active, children, user }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b border-border bg-background/80 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandMark />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors" aria-label="Profile">
            <User className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {[
          { key: "overview", label: "Overview", href: "/", icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
          { key: "today", label: "Today", href: "/today", icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { key: "roadmap", label: "Roadmap", href: "/roadmaps", icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg> },
          { key: "calendar", label: "Calendar", href: "/calendar", icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        ].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <MobileNavButton item={item} isActive={active === item.key} onClick={() => setIsMobileMenuOpen(false)} />
          </Link>
        ))}
      </nav>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 hidden w-[280px] bg-surface border-r border-border md:flex md:flex-col transition-transform duration-300 ease-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Mobile overlay */}
        <div 
          className={cn(
            "fixed inset-0 z-40 md:hidden transition-opacity",
            isMobileMenuOpen ? "opacity-100 bg-black/50" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="flex h-20 items-center gap-4 px-6 border-b border-border">
            <BrandMark />
          </div>

          {/* Primary Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {PRIMARY_NAV.map((item) => (
              <NavItem key={item.key} item={item} isActive={active === item.key} />
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t border-border px-3 my-2" />

          {/* Secondary Navigation */}
          <nav className="px-3 space-y-1 pb-4">
            {SECONDARY_NAV.map((item) => (
              <NavItem key={item.key} item={item} isActive={active === item.key} isSecondary />
            ))}
          </nav>

          {/* User Section with Streak */}
          {user && (
            <div className="border-t border-border p-4 mt-auto">
              <StreakCard />
              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name ?? "Signed in"}
                </p>
                <p className="truncate font-mono text-xs text-graphite-faint mt-0.5">
                  {user.email}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button className="btn btn-tertiary text-xs flex-1">
                    <SettingsIcon className="h-3.5 w-3.5 mr-1" />
                    Settings
                  </button>
                  <LogoutButton />
                </div>
              </div>
            </div>
          )}

          {/* Mobile-only close button */}
          <div className="md:hidden p-4 border-t border-border">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="btn btn-secondary w-full justify-center"
            >
              <X className="h-4 w-4 mr-2" />
              Close Menu
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer overlay when open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="md:pl-[280px] min-h-screen">
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}