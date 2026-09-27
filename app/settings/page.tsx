import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/app/components/shell";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account, appearance, and notification preferences",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell active="settings" user={{ name: user.name, email: user.email }}>
      <SettingsClient />
    </AppShell>
  );
}