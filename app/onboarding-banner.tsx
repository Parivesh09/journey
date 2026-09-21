"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing } from "lucide-react";
import { Stamp } from "@/app/components/ui";

export default function OnboardingBanner({ show }: { show: boolean }) {
  const router = useRouter();
  const [visible, setVisible] = useState(show);

  if (!visible) return null;

  async function dismiss(goToSettings = false, enrollRoadmapRoute?: string) {
    try {
      await fetch("/api/settings/dismiss-onboarding", { method: "POST" });
    } finally {
      setVisible(false);
      if (enrollRoadmapRoute) router.push(enrollRoadmapRoute);
      else if (goToSettings) router.push("/settings");
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-lg px-4">
      <div className="sheet p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <BellRing
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-ink"
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[0.95rem] font-semibold tracking-tight text-graphite">
                Nothing on today&rsquo;s list yet
              </h2>
              <Stamp tone="amber">Get started</Stamp>
            </div>
            <p className="mt-1.5 text-[0.8125rem] leading-5 text-graphite-2">
              Enroll a roadmap to populate your daily tasks, or set up
              reminders from Settings. Nothing appears until you do.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void dismiss(false, "/roadmaps")}
            className="btn btn-mark flex-1"
          >
            Enroll a roadmap
          </button>
          <button
            type="button"
            onClick={() => void dismiss(true)}
            className="btn btn-line flex-1"
          >
            Set up notifications
          </button>
        </div>
      </div>
    </div>
  );
}
