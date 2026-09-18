import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "@/lib/notifications/notification.types";
import { LinqApiError } from "./linq.errors";
import { LinqClient } from "./linq.client";

export class LinqNotificationProvider implements NotificationProvider {
  constructor(
    private readonly client = new LinqClient(
      process.env.LINQ_API_KEY ?? "",
      process.env.LINQ_API_BASE_URL ?? "",
      process.env.LINQ_WEBHOOK_SECRET ?? "",
    ),
  ) {}

  async send(notification: NotificationPayload): Promise<NotificationResult> {
    if (!process.env.LINQ_ENABLED || process.env.LINQ_ENABLED === "false") {
      return {
        success: false,
        provider: "linq",
        status: "disabled",
        errorCode: "LINQ_DISABLED",
        errorMessage: "Linq provider is disabled.",
      };
    }

    try {
      const response = await this.client.send({
        to: [process.env.LINQ_TO ?? ""],
        message: {
          preferred_service: "SMS",
          parts: [
            {
              type: "text",
              value: `${notification.title}\n${notification.message}`,
            },
          ],
        },
      });

      if (!response.success) {
        return {
          success: false,
          provider: "linq",
          status: response.status ?? "failed",
          errorCode: response.error?.code ?? "LINQ_REQUEST_FAILED",
          errorMessage: response.error?.message ?? response.message,
        };
      }

      return {
        success: true,
        provider: "linq",
        status: response.status ?? "queued",
        providerMessageId: response.id,
      };
    } catch (error) {
      const message =
        error instanceof LinqApiError ? error.message : "Unknown error";
      return {
        success: false,
        provider: "linq",
        status: "failed",
        errorCode: "LINQ_API_ERROR",
        errorMessage: message,
      };
    }
  }
}
