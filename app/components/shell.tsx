import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/app/logout-button";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "dashboard", label: "Dashboard", href: "/", number: "01" },
  { key: "tasks", label: "Tasks", href: "/tasks?tab=daily", number: "02" },
  { key: "roadmap", label: "Roadmap", href: "/roadmaps", number: "03" },
  // { key: "dsa", label: "DSA", href: "/dsa", number: "04" },
  { key: "projects", label: "Projects", href: "/projects", number: "05" },
  // { key: "revision", label: "Revision", href: "/revision", number: "06" },
  { key: "calendar", label: "Calendar", href: "/calendar", number: "07" },
  { key: "progress", label: "Progress", href: "/progress", number: "08" },
  {
    key: "notifications",
    label: "Notifications",
    href: "/notifications",
    number: "09",
  },
  { key: "settings", label: "Settings", href: "/settings", number: "10" },
];

function Mark() {
  return (
    <span className="grid h-8 w-8 place-items-center bg-primary text-sm font-bold text-white rounded-lg">
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-y-0 left-0 z-50 hidden w-[280px] bg-surface border-r border-border md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <Mark />
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground font-display">
              SDE Command Center
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg",
                      isActive
                        ? "bg-primary/5 text-primary border-l-4 border-primary"
                        : "text-graphite-muted hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-xs w-6 tabular-nums",
                        isActive ? "text-primary" : "text-graphite-faint",
                      )}
                    >
                      {item.number}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {user && (
          <div className="border-t border-border p-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name ?? "Signed in"}
              </p>
              <p className="truncate font-mono text-xs text-graphite-faint mt-0.5">
                {user.email}
              </p>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:pl-[280px]">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-4 px-6 py-4 md:hidden">
            <Mark />
            <span className="text-base font-semibold text-foreground font-display">
              SDE Command Center
            </span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
