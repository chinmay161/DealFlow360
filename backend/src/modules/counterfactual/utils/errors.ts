/**
 * Counterfactual Engine — Domain Errors
 */

export class CounterfactualError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CounterfactualError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QuotationNotFoundError extends CounterfactualError {
  constructor(quotationId: string) {
    super(`Quotation with ID "${quotationId}" was not found.`, 404, { quotationId });
    this.name = "QuotationNotFoundError";
  }
}

export class InvalidSimulationError extends CounterfactualError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 422, details);
    this.name = "InvalidSimulationError";
  }
}
