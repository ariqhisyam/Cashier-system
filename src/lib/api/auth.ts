import { apiClient, ApiResponse } from "./client";
import type { UserRole } from "../types";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface LoginParams {
  key: string;
  role?: UserRole;
}

/**
 * Key-based login sending access key and optional expected role to backend.
 * Backend sets JWT in HttpOnly cookie and returns safe AuthUser profile.
 */
export async function loginAuth(params: LoginParams): Promise<AuthUser> {
  const res = await apiClient.post<ApiResponse<AuthUser>>("/auth/login", {
    key: params.key.trim(),
    role: params.role,
  });
  return res.data.data;
}

/**
 * Fetches current authenticated user profile using automatic HttpOnly cookie.
 */
export async function getMeAuth(): Promise<AuthUser> {
  const res = await apiClient.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data.data;
}

/**
 * Logs out and clears HttpOnly cookie in backend.
 */
export async function logoutAuth(): Promise<void> {
  await apiClient.post<ApiResponse<null>>("/auth/logout");
}
