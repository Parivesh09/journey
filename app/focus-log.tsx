"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export default function FocusLog() {
  const router = useRouter();
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(minutes);
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      setMessage("Enter whole minutes between 1 and 1440.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: value }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setMessage(body?.error ?? "Could not log the session.");
        return;
      }
      setMinutes("");
      setMessage(`Logged ${value} min of focus.`);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/55 px-4 py-3"
    >
      <label className="text-sm text-slate-300">
        Log focus time (minutes)
        <input
          type="number"
          min={1}
          max={1440}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          disabled={saving}
          className="ml-3 w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={saving || !minutes}
        className="flex items-center gap-2 rounded-lg bg-cyan-400/15 px-4 py-1.5 text-sm font-medium text-cyan-200 transition enabled:hover:bg-cyan-400/25 disabled:opacity-50"
      >
        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
        Save
      </button>
      {message && <span className="text-xs text-slate-400">{message}</span>}
    </form>
  );
}