import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { EmailNotificationProvider } from "@/lib/notifications/providers/email/email.provider";
import { LinqNotificationProvider } from "@/lib/notifications/providers/linq/linq.provider";
import type { NotificationPayload } from "@/lib/notifications/notification.types";

const ENV_KEYS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
  "LINQ_ENABLED",
  "LINQ_API_KEY",
  "LINQ_API_BASE_URL",
  "LINQ_WEBHOOK_SECRET",
  "LINQ_TO",
] as const;

let snapshot: Record<string, string | undefined>;

const payload = (metadata: Record<string, unknown> = {}): NotificationPayload => ({
  userId: "user-1",
  title: "Reminder",
  message: "Do the thing",
  channel: "email",
  metadata,
});

beforeEach(() => {
  snapshot = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
});

describe("EmailNotificationProvider", () => {
  it("reports disabled when SMTP is not configured", async () => {
    const result = await new EmailNotificationProvider().send(payload());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("SMTP_NOT_CONFIGURED");
  });

  it("reports a missing recipient without touching the network", async () => {
    process.env.SMTP_HOST = "smtp.example.test";
    const result = await new EmailNotificationProvider().send(payload());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("EMAIL_RECIPIENT_MISSING");
  });
});

describe("LinqNotificationProvider", () => {
  it("reports disabled when LINQ_ENABLED is not set", async () => {
    const result = await new LinqNotificationProvider().send(payload());
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("LINQ_DISABLED");
  });

  it("reports a missing recipient when enabled without a destination", async () => {
    process.env.LINQ_ENABLED = "true";
    const result = await new LinqNotificationProvider().send(
      payload({ to: undefined }),
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("LINQ_RECIPIENT_MISSING");
  });
});
