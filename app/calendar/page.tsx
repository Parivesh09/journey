import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import TasksWorkspace from "@/app/tasks/tasks-workspace";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Calendar",
  description: "View scheduled tasks and events",
};

export default async function CalendarPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <AppShell active="calendar">
      <TasksWorkspace
        initialTab="daily"
        initialFilters={{}}
      />
    </AppShell>
  );
}
