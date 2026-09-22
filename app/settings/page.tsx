import { redirect } from "next/navigation";
import AppShell from "@/app/components/shell";
import { Sheet, PageHeader } from "@/app/components/ui";
import SettingsForm from "@/app/settings-form";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <AppShell active="settings">
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Settings"
            subtitle="Account details for your workspace"
          />
          <div className="mt-8">
            <SettingsForm />
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}