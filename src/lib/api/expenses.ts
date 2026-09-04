import { apiClient, ApiResponse } from './client';

export interface ExpenseResponse {
  id: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  date?: string;
}

export interface FetchExpensesParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch list of expenses from backend with optional date range
 */
export async function getExpenses(params?: FetchExpensesParams): Promise<ExpenseResponse[]> {
  const res = await apiClient.get<ApiResponse<ExpenseResponse[]>>('/expenses', {
    params,
  });
  return res.data.data;
}

/**
 * Create a new expense entry
 */
export async function createExpense(data: CreateExpenseInput): Promise<ExpenseResponse> {
  const res = await apiClient.post<ApiResponse<ExpenseResponse>>('/expenses', data);
  return res.data.data;
}

/**
 * Delete an expense by ID
 */
export async function deleteExpense(id: string): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
    `/expenses/${id}`,
  );
  return res.data.data;
}
