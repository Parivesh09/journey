import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import TasksWorkspace from "@/app/tasks/tasks-workspace";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Projects",
  description: "Engineering projects and development tasks",
};

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
      <TasksWorkspace
        initialTab="roadmap"
        initialFilters={{}}
      />
    </AppShell>
  );
}