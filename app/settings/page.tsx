import { redirect } from "next/navigation";
import SettingsForm from "@/app/settings-form";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-8 text-slate-100">
      <SettingsForm />
    </main>
  );
}