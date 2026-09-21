import { redirect } from "next/navigation";
import AppShell from "@/app/components/shell";
import { Sheet } from "@/app/components/ui";
import SettingsForm from "@/app/settings-form";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <AppShell active="settings">
      <main className="mx-auto max-w-[880px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Sheet className="overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          <header className="border-b border-stone-400 pb-5">
            <h1 className="text-[1.6rem] font-bold leading-none tracking-tight text-graphite sm:text-[1.9rem]">
              Settings
            </h1>
            <p className="mt-3 max-w-[62ch] text-[0.8125rem] leading-5 text-graphite-2">
              Account details, notification channels, and reminder preferences
              for your workspace.
            </p>
          </header>
          <div className="mt-8">
            <SettingsForm />
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}
