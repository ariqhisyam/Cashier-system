import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface CreateTransactionItemInput {
  productId: string;
  quantity: number;
}

export interface CreateTransactionInput {
  items: CreateTransactionItemInput[];
  paymentMethod: 'CASH' | 'QRIS';
  cashPaid?: number;
  qrisProofUrl?: string;
}

export interface TransactionItemResponse {
  id: string;
  transactionId: string;
  productId?: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  rawMaterialCost: number;
}

export interface TransactionResponse {
  id: string;
  total: number;
  cashierId?: string;
  cashierName: string;
  paymentMethod: 'CASH' | 'QRIS';
  cashPaid?: number;
  changeAmount?: number;
  qrisProofUrl?: string;
  createdAt: string;
  updatedAt: string;
  items: TransactionItemResponse[];
}

export interface FetchTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  cashierId?: string;
  paymentMethod?: 'CASH' | 'QRIS';
  startDate?: string;
  endDate?: string;
}

/**
 * Creates a new transaction and decrements product stock on database
 */
export async function createTransaction(
  data: CreateTransactionInput,
): Promise<TransactionResponse> {
  const res = await apiClient.post<ApiResponse<TransactionResponse>>(
    '/transactions',
    data,
  );
  return res.data.data;
}

/**
 * Fetches transactions with pagination and filters
 */
export async function getTransactions(
  params?: FetchTransactionsParams,
): Promise<PaginatedResponse<TransactionResponse>> {
  const res = await apiClient.get<ApiResponse<TransactionResponse[]>>(
    '/transactions',
    { params },
  );
  return {
    items: res.data.data,
    meta: res.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
}

/**
 * Fetches single transaction with items by ID
 */
export async function getTransactionById(
  id: string,
): Promise<TransactionResponse> {
  const res = await apiClient.get<ApiResponse<TransactionResponse>>(
    `/transactions/${id}`,
  );
  return res.data.data;
}

export interface CloseShiftInput {
  shiftName: string;
  totalGrossRevenue: number;
  totalCups: number;
  totalTransactions: number;
  cashRevenue: number;
  qrisRevenue: number;
  cashCups: number;
  qrisCups: number;
  totalHpp: number;
  dailySalaryCost?: number;
  totalExpenses?: number;
  netProfit: number;
  notes?: string;
}

export interface ShiftReportResponse {
  id: string;
  shiftName: string;
  closedBy: string;
  employeeId?: string;
  totalGrossRevenue: number;
  totalCups: number;
  totalTransactions: number;
  totalHpp: number;
  dailySalaryCost: number;
  totalExpenses: number;
  netProfit: number;
  cashRevenue: number;
  qrisRevenue: number;
  cashCups: number;
  qrisCups: number;
  cashCount: number;
  qrisCount: number;
  notes?: string;
  closedAt: string;
  createdAt: string;
}

/**
 * Submits shift close report to backend and dispatches Telegram notification
 */
export async function submitCloseShift(data: CloseShiftInput): Promise<ShiftReportResponse> {
  const res = await apiClient.post<ApiResponse<ShiftReportResponse>>(
    '/transactions/close-shift',
    data,
  );
  return res.data.data;
}

/**
 * Fetches all shift reports from database
 */
export async function getShiftReports(): Promise<ShiftReportResponse[]> {
  const res = await apiClient.get<ApiResponse<ShiftReportResponse[]>>(
    '/transactions/shift-reports',
  );
  return res.data.data;
}
