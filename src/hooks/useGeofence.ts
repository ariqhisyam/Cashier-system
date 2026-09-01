import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGeofenceSetting,
  updateGeofenceSetting,
  GeofenceSetting,
} from "@/lib/api/settings";

export const GEOFENCE_KEYS = {
  all: ["settings", "geofence"] as const,
};

/**
 * Hook to fetch outlet geofencing settings from backend
 */
export function useGeofence(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: GEOFENCE_KEYS.all,
    queryFn: getGeofenceSetting,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update outlet geofencing settings
 */
export function useUpdateGeofence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeofenceSetting) => updateGeofenceSetting(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(GEOFENCE_KEYS.all, updated);
      queryClient.invalidateQueries({ queryKey: GEOFENCE_KEYS.all });
    },
  });
}
