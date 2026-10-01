"use client";

export function SettingsMessages({
  message,
  error,
}: {
  message: string;
  error: string;
}) {
  return (
    <>
      {message && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </>
  );
}