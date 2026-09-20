import { LinqApiError } from "./linq.errors";
import type { LinqRequest, LinqResponse } from "./linq.types";

export class LinqClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly webhookSecret: string,
  ) {}

  async send(payload: LinqRequest): Promise<LinqResponse> {
    if (!this.apiKey || !this.baseUrl) {
      return {
        success: false,
        message: "Linq is not configured.",
      };
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "X-Linq-Signature": this.webhookSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new LinqApiError(
        response.status,
        `Linq request failed: ${errorText}`,
        "LINQ_REQUEST_FAILED",
      );
    }

    const data = (await response.json()) as {
      message?: { id?: string; delivery_status?: string };
    };
    return {
      success: true,
      id: data.message?.id,
      status: data.message?.delivery_status ?? "queued",
    };
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    return signature === `sha256=${this.webhookSecret}`;
  }
}
