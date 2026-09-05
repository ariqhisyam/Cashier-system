"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExpensesApi,
  createExpenseApi,
  deleteExpenseApi,
  CreateExpenseInput,
  ExpenseItem,
} from "@/lib/api/expenses";

export const EXPENSE_KEYS = {
  all: ["expenses"] as const,
  list: () => [...EXPENSE_KEYS.all, "list"] as const,
};

/**
 * Hook to fetch all operational expenses
 */
export function useExpensesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: EXPENSE_KEYS.list(),
    queryFn: getExpensesApi,
    staleTime: 1000 * 30, // 30 seconds
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to add a new operational expense
 */
export function useCreateExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpenseApi(input),
    onSuccess: (data) => {
      queryClient.setQueryData(EXPENSE_KEYS.list(), data);
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}

/**
 * Hook to delete an operational expense
 */
export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteExpenseApi(id),
    onSuccess: (data) => {
      queryClient.setQueryData(EXPENSE_KEYS.list(), data);
      queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
    },
  });
}
