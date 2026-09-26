"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, PrimaryButton, FormGroup } from "@/app/components/ui";
import { useCreateStudySessionMutation } from "@/lib/api";
import type { ApiError } from "@/lib/types";

export default function FocusLog() {
  const router = useRouter();
  const [minutes, setMinutes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [createStudySession] = useCreateStudySessionMutation();

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
      await createStudySession({ minutes: value }).unwrap();
      setMinutes("");
      setMessage(`Logged ${value} min of focus.`);
      router.refresh();
    } catch (reason: unknown) {
      const message = reason && typeof reason === "object" && "data" in reason
        ? (reason as { data?: ApiError }).data?.error
        : undefined;
      setMessage(
        typeof message === "string"
          ? message
          : "Could not log the session.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <div className="flex flex-wrap items-end gap-3">
        <FormGroup label="Minutes studied">
          <Input
            required
            type="number"
            min={1}
            max={1440}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            disabled={saving}
          />
        </FormGroup>
        <PrimaryButton type="submit" disabled={saving || !minutes}>
          {saving ? "Saving" : "Save"}
        </PrimaryButton>
      </div>
      {message ? (
        <p className="mt-3 text-sm font-medium text-graphite-muted" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
