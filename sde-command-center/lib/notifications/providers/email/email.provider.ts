import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "@/lib/notifications/notification.types";

export class EmailNotificationProvider implements NotificationProvider {
  async send(notification: NotificationPayload): Promise<NotificationResult> {
    if (!process.env.SMTP_HOST) {
      return {
        success: false,
        provider: "email",
        status: "disabled",
        errorCode: "SMTP_NOT_CONFIGURED",
        errorMessage: "Email notification provider is not configured.",
      };
    }

    return {
      success: true,
      provider: "email",
      status: "queued",
      providerMessageId: `email-${notification.userId}-${Date.now()}`,
    };
  }
}
