import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface AttendanceRecordResponse {
  id: string;
  userId?: string;
  userName: string;
  clockIn: string;
  clockOut?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClockInInput {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
}

export interface ClockOutInput {
  attendanceId?: string;
  notes?: string;
}

export interface FetchAttendancesParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Clock in current employee with GPS coordinates
 */
export async function clockInAttendance(
  data: ClockInInput,
): Promise<AttendanceRecordResponse> {
  const res = await apiClient.post<ApiResponse<AttendanceRecordResponse>>(
    '/attendance/clock-in',
    data,
  );
  return res.data.data;
}

/**
 * Clock out current employee
 */
export async function clockOutAttendance(
  data?: ClockOutInput,
): Promise<AttendanceRecordResponse> {
  const res = await apiClient.post<ApiResponse<AttendanceRecordResponse>>(
    '/attendance/clock-out',
    data || {},
  );
  return res.data.data;
}

/**
 * Get active clock-in for currently logged-in user today
 */
export async function getActiveAttendance(): Promise<AttendanceRecordResponse | null> {
  const res = await apiClient.get<ApiResponse<AttendanceRecordResponse | null>>(
    '/attendance/active',
  );
  return res.data.data;
}

/**
 * Get all attendances with pagination and filters for Admin
 */
export async function getAttendances(
  params?: FetchAttendancesParams,
): Promise<PaginatedResponse<AttendanceRecordResponse>> {
  const res = await apiClient.get<ApiResponse<AttendanceRecordResponse[]>>(
    '/attendance',
    { params },
  );
  return {
    items: res.data.data,
    meta: res.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
  };
}

/**
 * Delete attendance record by ID
 */
export async function deleteAttendance(id: string): Promise<any> {
  const res = await apiClient.delete<ApiResponse<any>>(`/attendance/${id}`);
  return res.data.data;
}
