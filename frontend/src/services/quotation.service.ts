import { apiClient } from "./api-client";
import type {
  Quotation,
  QuotationListResponse,
  QuotationFilterParams,
  CreateQuotationInput,
  Customer,
  Product,
} from "@/types/quotation.types";
import type { TransitionPayload, TransitionHistoryEntry } from "@/types/approval.types";

export const quotationService = {
  /**
   * Fetch paginated and filtered list of quotations
   */
  async getQuotations(filters: QuotationFilterParams = {}): Promise<QuotationListResponse> {
    return apiClient<QuotationListResponse>("/api/quotations", {
      params: {
        search: filters.search,
        status: filters.status && filters.status !== "ALL" ? filters.status : undefined,
        riskLevel: filters.riskLevel && filters.riskLevel !== "ALL" ? filters.riskLevel : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 10,
      },
    });
  },

  /**
   * Get single quotation details with line items, customer, and approvals
   */
  async getQuotationById(id: string): Promise<Quotation> {
    return apiClient<Quotation>(`/api/quotations/${encodeURIComponent(id)}`);
  },

  /**
   * Create a new quotation
   */
  async createQuotation(data: CreateQuotationInput): Promise<Quotation> {
    return apiClient<Quotation>("/api/quotations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a draft quotation
   */
  async updateQuotation(id: string, data: Partial<CreateQuotationInput>): Promise<Quotation> {
    return apiClient<Quotation>(`/api/quotations/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a draft quotation
   */
  async deleteQuotation(id: string): Promise<void> {
    return apiClient<void>(`/api/quotations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  /**
   * Duplicate a quotation
   */
  async duplicateQuotation(id: string): Promise<Quotation> {
    return apiClient<Quotation>(`/api/quotations/${encodeURIComponent(id)}/duplicate`, {
      method: "POST",
    });
  },

  /**
   * Execute state machine transition via backend
   */
  async transitionQuotation(id: string, payload: TransitionPayload): Promise<{ success: boolean; newState: string }> {
    return apiClient<{ success: boolean; newState: string }>(`/api/quotations/${encodeURIComponent(id)}/transition`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get state machine transition history
   */
  async getQuotationHistory(id: string): Promise<TransitionHistoryEntry[]> {
    return apiClient<TransitionHistoryEntry[]>(`/api/quotations/${encodeURIComponent(id)}/history`);
  },

  /**
   * Fetch customer catalog for autocomplete
   */
  async getCustomers(search?: string): Promise<Customer[]> {
    return apiClient<Customer[]>("/api/customers", {
      params: { search },
    });
  },

  /**
   * Fetch product catalog for quotation line item builder
   */
  async getProducts(search?: string, categoryId?: string): Promise<Product[]> {
    return apiClient<Product[]>("/api/products", {
      params: { search, categoryId },
    });
  },
};
