import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import TasksWorkspace from "@/app/tasks/tasks-workspace";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Projects",
  description: "Engineering projects and development tasks",
};

export default async function ProjectsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <AppShell active="projects">
      <TasksWorkspace
        initialTab="roadmap"
        initialFilters={{}}
      />
    </AppShell>
  );
}
