import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "@/lib/notifications/notification.types";

export class BrowserNotificationProvider implements NotificationProvider {
  async send(notification: NotificationPayload): Promise<NotificationResult> {
    if (typeof window === "undefined") {
      return {
        success: false,
        provider: "browser",
        status: "skipped",
        errorCode: "SERVER_CONTEXT",
        errorMessage: "Browser notifications require a browser runtime.",
      };
    }

    const permission = Notification.permission;
    if (permission !== "granted") {
      return {
        success: false,
        provider: "browser",
        status: "denied",
        errorCode: "NOTIFICATION_PERMISSION_DENIED",
        errorMessage: "Browser permission was not granted.",
      };
    }

    new Notification(notification.title, {
      body: notification.message,
      tag: notification.metadata?.tag as string | undefined,
    });

    return {
      success: true,
      provider: "browser",
      status: "sent",
    };
  }
}
