import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/app/logout-button";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "tasks", label: "Tasks", href: "/tasks" },
  { key: "roadmaps", label: "Roadmaps", href: "/roadmaps" },
  { key: "settings", label: "Settings", href: "/settings" },
];

function Mark() {
  return (
    <span
      aria-hidden
      className="grid h-6 w-6 place-items-center rounded-lg bg-amber text-[0.62rem] font-bold text-white shadow-[0_6px_14px_-6px_var(--color-amber)]"
    >
      S
    </span>
  );
}

export default async function AppShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-rule bg-paper/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-[0.95rem] font-bold tracking-tight text-bone"
          >
            <Mark />
            <span className="hidden sm:inline">SDE Command Center</span>
            <span className="sm:hidden">SDE</span>
          </Link>

          <nav
            aria-label="Sections"
            className="-mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto scrollbar-none"
          >
            {NAV.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[0.8rem] font-medium transition-colors duration-150",
                    isActive
                      ? "bg-ink-3 text-amber-ink shadow-[0_1px_2px_rgba(24,30,48,0.10)]"
                      : "text-bone-2 hover:bg-ink-2 hover:text-bone",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <div className="text-right leading-tight">
                <p className="truncate text-[0.8rem] font-semibold text-bone">
                  {user.name ?? "Signed in"}
                </p>
                <p className="truncate font-mono text-[0.65rem] text-bone-3">
                  {user.email}
                </p>
              </div>
              <LogoutButton />
            </div>
          ) : null}
        </div>
      </header>

      <div className="min-w-0 flex-1">{children}</div>

      {user ? (
        <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper/60 px-5 py-3 lg:hidden">
          <p className="truncate font-mono text-[0.7rem] text-bone-3">
            {user.email}
          </p>
          <LogoutButton />
        </div>
      ) : null}
    </div>
  );
}