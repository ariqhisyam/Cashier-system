import { apiClient, ApiResponse } from "./client";
import type { User, UserRole } from "@/lib/types";

export interface CreateUserInput {
  name: string;
  key: string;
  role?: UserRole;
  monthlySalary?: number;
  isActive?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  key?: string;
  role?: UserRole;
  monthlySalary?: number;
  isActive?: boolean;
}

export interface UserListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Fetch users with pagination, search, and role filter from NestJS backend
 */
export async function getUsers(
  params?: FetchUsersParams
): Promise<{ users: User[]; meta: UserListMeta }> {
  const res = await apiClient.get<ApiResponse<User[]>>("/users", {
    params,
  });

  const users = Array.isArray(res.data.data) ? res.data.data : [];
  const responseMeta = res.data.meta;
  const total = responseMeta?.total ?? users.length;
  const page = responseMeta?.page ?? params?.page ?? 1;
  const limit = responseMeta?.limit ?? params?.limit ?? 5;
  const totalPages = responseMeta?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  return {
    users,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}

/**
 * Create a new user / staff
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  const res = await apiClient.post<ApiResponse<User>>("/users", data);
  return res.data.data;
}

/**
 * Update an existing user / staff
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
  return res.data.data;
}

/**
 * Delete a user / staff (soft delete)
 */
export async function deleteUser(id: string): Promise<User> {
  const res = await apiClient.delete<ApiResponse<User>>(`/users/${id}`);
  return res.data.data;
}
