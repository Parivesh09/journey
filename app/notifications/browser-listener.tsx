"use client";

import { useEffect, useRef, useState } from "react";
import {
  useGetSessionQuery,
  useGetPendingNotificationsQuery,
} from "@/lib/api";

export default function BrowserReminderListener() {
  const { data: sessionData } = useGetSessionQuery();
  const enabledRef = useRef(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const { data: pendingData } = useGetPendingNotificationsQuery(undefined, {
    skip: !enabledRef.current || !permissionGranted,
    pollingInterval: 60_000,
  });

  useEffect(() => {
    if (!("Notification" in window)) return;

    const browserEnabled = Boolean(
      sessionData?.notificationPreferences?.browserEnabled,
    );
    enabledRef.current = browserEnabled;

    if (browserEnabled && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        setPermissionGranted(permission === "granted");
      });
    } else {
      setPermissionGranted(Notification.permission === "granted");
    }
  }, [sessionData]);

  useEffect(() => {
    if (!enabledRef.current || !permissionGranted) return;
    if (!pendingData?.reminders) return;

    pendingData.reminders.forEach((reminder: { id: string; title: string; message: string }) => {
      new Notification(reminder.title, {
        body: reminder.message,
        tag: `sde-reminder-${reminder.id}`,
      });
    });
  }, [pendingData, permissionGranted]);

  return null;
}