import TaskBrowser from "@/app/tasks/task-browser";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RevisionPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <TaskBrowser
      title="Revision queue"
      description="Review revision and interview items without losing the original roadmap order."
      initialTaskType="revision"
    />
  );
}
