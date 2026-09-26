import AppShell from "@/app/components/shell";
import TasksWorkspace from "./tasks-workspace";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; category?: string; taskType?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { tab, category, taskType } = await searchParams;
  return (
    <AppShell active="today" user={{ name: user.name, email: user.email }}>
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
