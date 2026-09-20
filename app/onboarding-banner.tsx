"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

export default function OnboardingBanner({ show }: { show: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  async function dismiss(goToSettings = false) {
    try {
      await fetch("/api/settings/dismiss-onboarding", { method: "POST" });
    } finally {
      setVisible(false);
      if (goToSettings) router.push("/settings");
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 mx-auto max-w-md px-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.6)]">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Stay on track
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Want reminders for your SDE preparation?
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              You can receive reminders about your daily SDE tasks. Configure
              email, browser, SMS and other channels from Settings.
              Nothing is enabled until you choose it.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => void dismiss(true)}
            className="flex-1 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Set Up Notifications
          </button>
          <button
            type="button"
            onClick={() => void dismiss(false)}
            className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}