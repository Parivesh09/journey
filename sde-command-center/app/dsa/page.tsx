import TaskBrowser from "@/app/tasks/task-browser";

export default function DsaPage() {
  return (
    <TaskBrowser
      title="DSA practice"
      description="Follow the DSA phases in sequence and filter by topic, difficulty, type, or date."
      initialCategory="DSA"
    />
  );
}
