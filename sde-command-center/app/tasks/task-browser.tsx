"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, LoaderCircle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueDate: string | null;
  taskType: string | null;
  difficulty: string | null;
  phaseId: string | null;
  phaseTitle: string | null;
  topicId: string | null;
  topicTitle: string | null;
  category: { name: string } | null;
};

type Facets = {
  categories: string[];
  phases: Array<{ phaseId: string | null; phaseTitle: string | null }>;
  topics: Array<{
    topicId: string | null;
    topicTitle: string | null;
    phaseId: string | null;
  }>;
};

type TaskBrowserProps = {
  title: string;
  description: string;
  initialCategory?: string;
  initialTaskType?: string;
};

const emptyFacets: Facets = { categories: [], phases: [], topics: [] };

export default function TaskBrowser({
  title,
  description,
  initialCategory = "",
  initialTaskType = "",
}: TaskBrowserProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [facets, setFacets] = useState<Facets>(emptyFacets);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    q: "",
    category: initialCategory,
    phaseId: "",
    topicId: "",
    taskType: initialTaskType,
    difficulty: "",
    status: "",
    priority: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });

    fetch(`/api/tasks?${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then(
        (data: {
          tasks: Task[];
          facets: Facets;
          total: number;
          totalPages: number;
        }) => {
          setLoading(false);
          setErrorMessage("");
          setTasks(data.tasks);
          setFacets(data.facets);
          setTotal(data.total);
          setTotalPages(Math.max(1, data.totalPages));
        },
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoading(false);
        setErrorMessage("Unable to load roadmap tasks. Please try again.");
      });

    return () => controller.abort();
  }, [filters, page]);

  function updateFilter(name: string, value: string) {
    setPage(1);
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "phaseId" ? { topicId: "" } : {}),
    }));
  }

  async function toggleTask(task: Task) {
    setUpdatingId(task.id);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: task.status !== "COMPLETED" }),
    });
    const data = (await response.json()) as { task: Task };
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? data.task : item)),
    );
    setUpdatingId(null);
  }

  const visibleTopics = facets.topics.filter(
    (topic) => !filters.phaseId || topic.phaseId === filters.phaseId,
  );

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Roadmap workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-slate-400">{description}</p>
        </div>

        <section className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <input
            value={filters.q}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder="Search questions or topics"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          />
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {facets.categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={filters.phaseId}
            onChange={(event) => updateFilter("phaseId", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All phases</option>
            {facets.phases
              .filter((item) => item.phaseId)
              .map((item) => (
                <option key={item.phaseId} value={item.phaseId ?? ""}>
                  {item.phaseTitle}
                </option>
              ))}
          </select>
          <select
            value={filters.topicId}
            onChange={(event) => updateFilter("topicId", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All topics</option>
            {visibleTopics
              .filter((item) => item.topicId)
              .map((item) => (
                <option key={item.topicId} value={item.topicId ?? ""}>
                  {item.topicTitle}
                </option>
              ))}
          </select>
          <select
            value={filters.taskType}
            onChange={(event) => updateFilter("taskType", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All question types</option>
            {[
              "concept",
              "practice",
              "implementation",
              "project",
              "revision",
              "interview",
              "mock",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
          <select
            value={filters.difficulty}
            onChange={(event) => updateFilter("difficulty", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All difficulty</option>
            <option>easy</option>
            <option>medium</option>
            <option>hard</option>
          </select>
          <select
            value={filters.priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <label className="text-xs text-slate-500">
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            />
          </label>
        </section>

        <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
          <span>{total} matching tasks</span>
          <span>Ordered by roadmap sequence</span>
        </div>
        {errorMessage ? (
          <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {errorMessage}
          </p>
        ) : null}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          {loading ? (
            <div className="flex items-center gap-3 p-6 text-slate-400">
              <LoaderCircle className="h-5 w-5 animate-spin" /> Loading
              roadmap...
            </div>
          ) : tasks.length === 0 ? (
            <p className="p-6 text-slate-400">No tasks match these filters.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 sm:p-5"
                >
                  <button
                    type="button"
                    aria-label={
                      task.status === "COMPLETED"
                        ? "Mark task incomplete"
                        : "Mark task complete"
                    }
                    disabled={updatingId === task.id}
                    onClick={() => toggleTask(task)}
                    className="shrink-0 text-cyan-300 disabled:opacity-50"
                  >
                    {updatingId === task.id ? (
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                    ) : task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        task.status === "COMPLETED"
                          ? "truncate text-slate-500 line-through"
                          : "truncate font-medium"
                      }
                    >
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {task.phaseTitle} / {task.topicTitle} •{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "Unscheduled"}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300 sm:inline">
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
