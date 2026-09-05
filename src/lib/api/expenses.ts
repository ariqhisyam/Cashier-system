import { apiClient, ApiResponse } from "./client";

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  timestamp: number;
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  timestamp?: number;
}

/**
 * Fetch all operational expenses from backend
 */
export async function getExpensesApi(): Promise<ExpenseItem[]> {
  const response = await apiClient.get<ApiResponse<ExpenseItem[]>>("/settings/expenses");
  return response.data.data || [];
}

/**
 * Add a new operational expense to backend
 */
export async function createExpenseApi(input: CreateExpenseInput): Promise<ExpenseItem[]> {
  const response = await apiClient.post<ApiResponse<ExpenseItem[]>>("/settings/expenses", input);
  return response.data.data || [];
}

/**
 * Delete an operational expense by ID
 */
export async function deleteExpenseApi(id: string): Promise<ExpenseItem[]> {
  const response = await apiClient.delete<ApiResponse<ExpenseItem[]>>(`/settings/expenses/${id}`);
  return response.data.data || [];
}
