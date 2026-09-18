import type {
  NotificationPayload,
  NotificationProvider,
  NotificationResult,
} from "@/lib/notifications/notification.types";
import nodemailer from "nodemailer";

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

    const recipient = notification.metadata?.email;
    if (typeof recipient !== "string" || !recipient) {
      return {
        success: false,
        provider: "email",
        status: "failed",
        errorCode: "EMAIL_RECIPIENT_MISSING",
        errorMessage: "No email address was provided for this reminder.",
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            }
          : undefined,
      });
      const result = await transporter.sendMail({
        from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
        to: recipient,
        subject: notification.title,
        text: notification.message,
      });

      return {
        success: true,
        provider: "email",
        status: "sent",
        providerMessageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        provider: "email",
        status: "failed",
        errorCode: "SMTP_SEND_FAILED",
        errorMessage:
          error instanceof Error ? error.message : "SMTP send failed.",
      };
    }
  }
}
