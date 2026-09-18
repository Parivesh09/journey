import TaskBrowser from "@/app/tasks/task-browser";

export default function RevisionPage() {
  return (
    <TaskBrowser
      title="Revision queue"
      description="Review revision and interview items without losing the original roadmap order."
      initialTaskType="revision"
    />
  );
}
