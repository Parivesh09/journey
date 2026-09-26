import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AppShell from "@/app/components/shell";
import CalendarClient from "./calendar-client";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Your editorial study planner — visualize tasks, study sessions, and progress",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const view = (params.view as "month" | "week" | "day") ?? "month";
  const date = params.date ?? new Date().toISOString();

  return (
    <AppShell active="calendar">
      <CalendarClient
        initialView={view}
        initialDate={date}
        userTimezone={user.timezone}
      />
    </AppShell>
  );
}