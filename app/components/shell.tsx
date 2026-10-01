"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/app/logout-button";
import { cn } from "@/lib/utils";
import { Menu, User } from "lucide-react";
import { ThemeToggle } from "@/app/components/ui";
import { GlobalTaskTimer } from "@/app/components/global-task-timer";
import { TaskCompletionDialog } from "@/app/components/task-completion-dialog";
import { useTaskTimer } from "@/lib/store/timer-hooks";
import { useUpdateTaskMutation, useToggleTaskCompleteTodayMutation } from "@/lib/api";

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

function NavLink({
  href,
  label,
  number,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  number: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-fast ${
        isActive
          ? "bg-primary/10 text-foreground"
          : "text-graphite-muted hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="font-mono text-xs text-graphite-faint w-5 text-right">
        {number}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function Shell({
  children,
  active,
  user,
}: {
  children: ReactNode;
  active: string;
  user: { name: string | null; email: string } | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const { state, completeTask, clearTask } = useTaskTimer();
  const [updateTask] = useUpdateTaskMutation();
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();

  const isCompleted = state.status === "completed_pending";

  const handleCompleteTask = async () => {
    if (!state.activeTask) return;
    try {
      if (state.activeTask.isDailyTask) {
        await toggleTaskCompleteToday(state.activeTask.id).unwrap();
      } else {
        await updateTask({ id: state.activeTask.id, status: "COMPLETED" }).unwrap();
      }
      completeTask();
    } catch {
      // Error handled by toast
    }
  };

  const handleKeepTask = () => {
    if (!state.activeTask) return;
    clearTask();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <Link href="/" onClick={() => setSidebarOpen(false)} className="block">
              <BrandMark />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                label={item.label}
                number={item.number}
                isActive={active === item.key}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
            <div className="my-4 border-t border-border" />
            {SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                label={item.label}
                number={item.number}
                isActive={active === item.key}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-graphite-faint truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
                aria-label="Profile menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground">
                    {user.name}
                  </span>
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 card rounded-lg border border-border shadow-lg py-1 animate-slide-in-down">
                    <Link
                      href="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <User className="w-4 h-4" />
                      Settings
                    </Link>
                    <LogoutButton className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted" />
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Global Task Timer - always rendered at the bottom */}
        <GlobalTaskTimer />

        {/* Task Completion Dialog */}
        {isCompleted && state.activeTask && (
          <TaskCompletionDialog
            open={true}
            onClose={handleKeepTask}
            onConfirm={handleCompleteTask}
            onKeepTask={handleKeepTask}
            task={state.activeTask}
          />
        )}
      </main>
    </div>
  );
}

export default Shell;