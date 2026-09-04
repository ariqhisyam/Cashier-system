import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  getExpenses,
  createExpense,
  deleteExpense,
  FetchExpensesParams,
  CreateExpenseInput,
  ExpenseResponse,
} from '@/lib/api/expenses';

export const EXPENSE_KEYS = {
  all: ['expenses'] as const,
  lists: () => [...EXPENSE_KEYS.all, 'list'] as const,
  list: (params?: FetchExpensesParams) => [...EXPENSE_KEYS.lists(), params] as const,
};

/**
 * Hook to fetch expenses list from backend
 */
export function useExpenses(params?: FetchExpensesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: EXPENSE_KEYS.list(params),
    queryFn: () => getExpenses(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to create a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponse, Error, CreateExpenseInput>({
    mutationFn: (data: CreateExpenseInput) => createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}

/**
 * Hook to delete an expense by ID
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}
