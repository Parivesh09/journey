"use client";

import { useEffect, useRef } from "react";

export default function BrowserReminderListener() {
  const enabledRef = useRef(false);

  useEffect(() => {
    if (!("Notification" in window)) return;

    const checkEnabled = async () => {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          notificationPreferences?: { browserEnabled?: boolean };
        };
        enabledRef.current = Boolean(data.notificationPreferences?.browserEnabled);
        if (enabledRef.current) void start();
      } catch {
        // The app works without browser reminders; nothing to do here.
      }
    };

    const start = async () => {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }
      await poll();
      const interval = window.setInterval(poll, 60_000);
      return () => window.clearInterval(interval);
    };

    const poll = async () => {
      if (!enabledRef.current || Notification.permission !== "granted") return;
      try {
        const response = await fetch("/api/notifications/pending", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          reminders: Array<{ id: string; title: string; message: string }>;
        };
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

    void checkEnabled();
  }, []);

  return null;
}