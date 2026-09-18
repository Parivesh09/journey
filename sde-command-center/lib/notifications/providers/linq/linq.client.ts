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

    const response = await fetch(`${this.baseUrl}/partner/messages`, {
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

    return (await response.json()) as LinqResponse;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookSecret) {
      return false;
    }

    return signature === `sha256=${this.webhookSecret}`;
  }
}
