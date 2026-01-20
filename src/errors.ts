export class FuelFinderApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  /**
   * Create an error that includes HTTP status and parsed response details.
   * @param message Human-readable error message.
   * @param status HTTP status code (0 for transport errors).
   * @param details Parsed response body or underlying error.
   */
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, FuelFinderApiError.prototype);
  }
}
