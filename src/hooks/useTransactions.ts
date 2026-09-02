import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  submitCloseShift,
  getShiftReports,
  CreateTransactionInput,
  FetchTransactionsParams,
  TransactionResponse,
  CloseShiftInput,
  ShiftReportResponse,
} from '@/lib/api/transactions';
import { PRODUCT_KEYS } from './useProducts';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (params?: FetchTransactionsParams) => [...TRANSACTION_KEYS.lists(), params] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
  shifts: () => [...TRANSACTION_KEYS.all, 'shifts'] as const,
};

/**
 * Hook to query transactions list
 */
export function useTransactions(params?: FetchTransactionsParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.list(params),
    queryFn: () => getTransactions(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to query single transaction by ID
 */
export function useTransaction(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.detail(id),
    queryFn: () => getTransactionById(id),
    enabled: !!id && (options?.enabled ?? true),
  });
}

/**
 * Hook to query shift reports list
 */
export function useShiftReports(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: TRANSACTION_KEYS.shifts(),
    queryFn: () => getShiftReports(),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to create transaction on backend and refresh product stocks
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation<TransactionResponse, Error, CreateTransactionInput>({
    mutationFn: (data: CreateTransactionInput) => createTransaction(data),
    onSuccess: () => {
      // Invalidate both products and transactions so live stock updates everywhere
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
    },
  });
}

/**
 * Hook to submit shift close report to backend & trigger Telegram notification
 */
export function useSubmitCloseShift() {
  const queryClient = useQueryClient();

  return useMutation<ShiftReportResponse, Error, CloseShiftInput>({
    mutationFn: (data: CloseShiftInput) => submitCloseShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.shifts() });
    },
  });
}
