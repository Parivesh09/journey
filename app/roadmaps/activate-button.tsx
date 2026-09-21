"use client";

import { useState } from "react";

type Props = {
  templateId: string;
};

export default function ActivateButton({ templateId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);
    try {
const res = await fetch("/api/roadmaps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roadmapId: templateId }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Failed to activate roadmap");
      }
      // Optimistically mark as activated
      setActivated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (activated) {
    return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber/20 text-amber">Activated</span>;
  }

  return (
    <form onSubmit={handleActivate} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-colors
          bg-amber hover:bg-amber/80 text-white hover:text-bone disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.897-8.625m13.897 8.625h5.418" />
            </svg>
            <span>Activating...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.314 2.137c1.098.334 2.155.513 3.276.585a11.955 11.955 0 018.618 1.504A11.915 11.915 0 0021.422 18.184a11.917 11.917 0 01-7.09 6.181c1.802.322 3.536.507 5.032.507" />
            </svg>
            <span>Activate</span>
          </>
        )}
      </button>
      {error && (
        <span className="text-red-500 text-sm mt-1 block">{error}</span>
      )}
    </form>
  );
}