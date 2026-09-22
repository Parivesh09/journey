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
  // { key: "calendar", label: "Calendar", href: "/calendar", number: "07" },
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
    <span className="grid h-7 w-7 place-items-center bg-highlighter-amber text-[0.7rem] font-bold text-white">
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
    <div className="min-h-screen bg-ink-ground text-bone">
      <div className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-ink-raised border-r border-hairline md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 px-5 border-b border-hairline">
          <Mark />
          <div>
            <p className="text-[0.9rem] font-semibold leading-tight text-bone">
              SDE Command Center
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-2">
            {NAV.map((item) => {
              const isActive = active === item.key;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-[0.85rem] transition-colors rounded",
                      isActive
                        ? "bg-ink-panel text-highlighter-amber"
                        : "text-bone-muted hover:text-bone hover:bg-ink-panel",
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[0.7rem] w-6 tabular-nums",
                        isActive ? "text-highlighter-amber" : "text-bone-faint",
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
          <div className="border-t border-hairline p-4">
            <div className="rounded bg-ink-panel p-3">
              <p className="truncate text-[0.85rem] font-medium text-bone">
                {user.name ?? "Signed in"}
              </p>
              <p className="truncate font-mono text-[0.65rem] text-bone-faint mt-0.5">
                {user.email}
              </p>
              <div className="mt-3">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:pl-64">
        <header className="sticky top-0 z-40 border-b border-hairline bg-ink-ground/80 backdrop-blur">
          <div className="flex items-center gap-4 px-6 py-4 md:hidden">
            <Mark />
            <span className="text-[0.95rem] font-semibold">
              SDE Command Center
            </span>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
