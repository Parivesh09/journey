"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
    <form onSubmit={onSubmit} className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[8rem] flex-1 text-[0.72rem] font-semibold text-graphite-2">
          Minutes studied
          <input
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            disabled={saving}
            className="field mt-1"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !minutes}
          className="btn btn-mark"
        >
          {saving ? (
            <span
              aria-hidden
              className="h-1 w-5 animate-pulse rounded-full bg-white"
            />
          ) : null}
          {saving ? "Saving" : "Save"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-[0.75rem] font-medium text-graphite-2" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
