import AppShell from "@/app/components/shell";
import TasksWorkspace from "./tasks-workspace";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; taskType?: string }>;
}) {
  if (!(await isAuthenticated())) redirect("/login");
  const { tab, category, taskType } = await searchParams;
  return (
    <AppShell active="tasks">
      <TasksWorkspace
        initialTab={tab === "daily" ? "daily" : "roadmap"}
        initialFilters={{
          category: category ?? "",
          taskType: taskType ?? "",
        }}
      />
    </AppShell>
  );
}
