import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  clockInAttendance,
  clockOutAttendance,
  getActiveAttendance,
  getAttendances,
  deleteAttendance,
  ClockInInput,
  ClockOutInput,
  FetchAttendancesParams,
  AttendanceRecordResponse,
} from '@/lib/api/attendance';

export const ATTENDANCE_KEYS = {
  all: ['attendance'] as const,
  active: () => [...ATTENDANCE_KEYS.all, 'active'] as const,
  lists: () => [...ATTENDANCE_KEYS.all, 'list'] as const,
  list: (params?: FetchAttendancesParams) => [...ATTENDANCE_KEYS.lists(), params] as const,
};

/**
 * Hook to retrieve currently active attendance session for logged in cashier
 */
export function useActiveAttendance(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.active(),
    queryFn: getActiveAttendance,
    staleTime: 1000 * 30, // 30 seconds
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to clock-in with GPS location
 */
export function useClockInAttendance() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceRecordResponse, Error, ClockInInput>({
    mutationFn: (data: ClockInInput) => clockInAttendance(data),
    onSuccess: (active) => {
      queryClient.setQueryData(ATTENDANCE_KEYS.active(), active);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
    },
  });
}

/**
 * Hook to clock-out
 */
export function useClockOutAttendance() {
  const queryClient = useQueryClient();

  return useMutation<AttendanceRecordResponse, Error, ClockOutInput | undefined>({
    mutationFn: (data?: ClockOutInput) => clockOutAttendance(data),
    onSuccess: () => {
      queryClient.setQueryData(ATTENDANCE_KEYS.active(), null);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
    },
  });
}

/**
 * Hook to fetch attendance history list for Admin
 */
export function useAttendances(params?: FetchAttendancesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ATTENDANCE_KEYS.list(params),
    queryFn: () => getAttendances(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to delete attendance record
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.all });
    },
  });
}
