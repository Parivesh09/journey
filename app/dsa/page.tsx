import TaskBrowser from "@/app/tasks/task-browser";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DsaPage() {
  if (!(await isAuthenticated())) redirect("/login");
  return (
    <TaskBrowser
      title="DSA practice"
      description="Follow the DSA phases in sequence and filter by topic, difficulty, type, or date."
      initialCategory="DSA"
    />
  );
}
