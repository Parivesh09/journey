import type { Metadata } from "next";
import AppShell from "@/app/components/shell";
import TasksWorkspace from "@/app/tasks/tasks-workspace";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "DSA",
  description: "Data Structures and Algorithms practice workspace",
};

export default async function DsaPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <AppShell active="dsa">
      <TasksWorkspace
        initialTab="roadmap"
        initialFilters={{ category: "DSA" }}
      />
    </AppShell>
  );
}
