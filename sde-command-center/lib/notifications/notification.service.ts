import type {
  NotificationPayload,
  NotificationPreference,
  NotificationProvider,
  NotificationResult,
} from "./notification.types";

export class NotificationService {
  constructor(
    private readonly providers: Record<string, NotificationProvider>,
  ) {}

  async send(
    payload: NotificationPayload,
    preferences?: NotificationPreference,
  ): Promise<NotificationResult> {
    const providerName = this.selectProvider(payload.channel, preferences);
    const provider = this.providers[providerName];

    if (!provider) {
      return {
        success: false,
        provider: providerName,
        status: "unavailable",
        errorCode: "PROVIDER_NOT_FOUND",
        errorMessage: "The configured notification provider is not available.",
      };
    }

    return provider.send(payload);
  }

  private selectProvider(
    channel: NotificationPayload["channel"],
    preferences?: NotificationPreference,
  ): string {
    if (preferences?.preferredChannel && channel === "browser") {
      return "browser";
    }

    return channel;
  }
}
