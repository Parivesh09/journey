"use client";

import { useEffect } from "react";

export default function BrowserReminderListener() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    const requestPermission = async () => {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };

    const poll = async () => {
      try {
        const response = await fetch("/api/notifications/pending", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          reminders: Array<{ id: string; title: string; message: string }>;
        };
        if (Notification.permission !== "granted") return;
        data.reminders.forEach((reminder) => {
          new Notification(reminder.title, {
            body: reminder.message,
            tag: `sde-reminder-${reminder.id}`,
          });
        });
      } catch {
        // A closed tab or network interruption should not affect the app.
      }
    };

    void requestPermission();
    void poll();
    const interval = window.setInterval(poll, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  return null;
}
