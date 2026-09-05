import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  submitShiftReport,
  getShiftReports,
  CreateTransactionInput,
  FetchTransactionsParams,
  TransactionResponse,
  CloseShiftInput,
  ShiftReportResponse,
  deleteTransactionApi,
  deleteShiftReportApi,
} from '@/lib/api/transactions';
import { PRODUCT_KEYS } from './useProducts';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (params?: FetchTransactionsParams) => [...TRANSACTION_KEYS.lists(), params] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
};

export const SHIFT_REPORT_KEYS = {
  all: ['shift-reports'] as const,
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
 * Hook to query all shift reports from backend
 */
export function useShiftReports(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: SHIFT_REPORT_KEYS.all,
    queryFn: () => getShiftReports(),
    enabled: options?.enabled ?? true,
    refetchInterval: 15000,
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
 * Hook to submit a shift close report to backend and trigger Telegram alert
 */
export function useCloseShiftReport() {
  const queryClient = useQueryClient();

  return useMutation<ShiftReportResponse, Error, CloseShiftInput>({
    mutationFn: (data: CloseShiftInput) => submitShiftReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFT_REPORT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
    },
  });
}

/**
 * Hook to delete a specific transaction on backend and restore product stocks
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; message: string }, Error, string>({
    mutationFn: (id: string) => deleteTransactionApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all });
    },
  });
}

/**
 * Hook to delete a specific shift report on backend
 */
export function useDeleteShiftReport() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; message: string }, Error, string>({
    mutationFn: (id: string) => deleteShiftReportApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIFT_REPORT_KEYS.all });
    },
  });
}
