import TaskBrowser from "@/app/tasks/task-browser";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function StudyPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <TaskBrowser
      title="Study plan"
      description="Use the roadmap sequence as your daily study queue and narrow it to the work you can do today."
    />
  );
}
