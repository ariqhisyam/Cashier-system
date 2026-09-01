import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  CreateTransactionInput,
  FetchTransactionsParams,
  TransactionResponse,
} from '@/lib/api/transactions';
import { PRODUCT_KEYS } from './useProducts';

export const TRANSACTION_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_KEYS.all, 'list'] as const,
  list: (params?: FetchTransactionsParams) => [...TRANSACTION_KEYS.lists(), params] as const,
  details: () => [...TRANSACTION_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_KEYS.details(), id] as const,
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
