import TaskBrowser from "./task-browser";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <TaskBrowser
      title="All roadmap tasks"
      description="Search, filter, schedule, and complete every item from your imported SDE roadmap."
    />
  );
}
