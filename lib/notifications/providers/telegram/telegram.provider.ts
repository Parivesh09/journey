import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "@/lib/notifications/notification.types";

export class TelegramNotificationProvider implements NotificationProvider {
  async send(notification: NotificationPayload): Promise<NotificationResult> {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return {
        success: false,
        provider: "telegram",
        status: "disabled",
        errorCode: "TELEGRAM_NOT_CONFIGURED",
        errorMessage: "Telegram notifications are not configured.",
      };
    }

    if (!notification.metadata?.telegramChatId) {
      return {
        success: false,
        provider: "telegram",
        status: "failed",
        errorCode: "TELEGRAM_CHAT_ID_MISSING",
        errorMessage: "No Telegram chat link is configured for this account.",
      };
    }

    return {
      success: true,
      provider: "telegram",
      status: "queued",
      providerMessageId: `telegram-${notification.metadata.telegramChatId}-${Date.now()}`,
    };
  }
}
