import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQrisSetting, updateQrisSetting } from "@/lib/api/settings";

export const QRIS_KEYS = {
  all: ["settings", "qris"] as const,
};

/**
 * Hook to fetch active QRIS image URL
 */
export function useQris(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QRIS_KEYS.all,
    queryFn: getQrisSetting,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to update QRIS image URL in settings
 */
export function useUpdateQris() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageUrl: string) => updateQrisSetting(imageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QRIS_KEYS.all });
    },
  });
}
