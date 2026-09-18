export class LinqApiError extends Error {
  constructor(
    public readonly statusCode?: number,
    message?: string,
    public readonly code?: string,
  ) {
    super(message ?? "Linq API request failed.");
    this.name = "LinqApiError";
  }
}
