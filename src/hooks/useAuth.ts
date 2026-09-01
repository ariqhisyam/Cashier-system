"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { loginAuth, getMeAuth, logoutAuth, AuthUser, LoginParams } from "@/lib/api/auth";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export const AUTH_KEYS = {
  me: ["auth", "me"] as const,
};

const USER_PROFILE_STORAGE_KEY = "matcha_auth_profile_v1";
const AUTH_TOKEN_STORAGE_KEY = "matcha_access_token";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_PROFILE_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Hook to retrieve current authenticated user from HttpOnly cookie
 * with instant local profile hydration on page refresh
 */
export function useCurrentUser() {
  const { dispatch } = useStore();

  const query = useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: async () => {
      try {
        const user = await getMeAuth();
        setStoredAuthUser(user);
        return user;
      } catch (err) {
        setStoredAuthToken(null);
        setStoredAuthUser(null);
        throw err;
      }
    },
    initialData: () => getStoredAuthUser() ?? undefined,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync user profile with local store context
  useEffect(() => {
    if (query.data) {
      setStoredAuthUser(query.data);
      if (query.data.role === "ADMIN") {
        dispatch({ type: "LOGIN", payload: { role: "admin" } });
      } else if (query.data.role === "KARYAWAN") {
        dispatch({
          type: "LOGIN",
          payload: {
            role: "karyawan",
            employee: {
              id: query.data.id,
              name: query.data.name,
              key: "",
              role: "KARYAWAN",
              isActive: true,
              createdAt: Date.now(),
            },
          },
        });
      }
    } else if (query.isError) {
      setStoredAuthToken(null);
      setStoredAuthUser(null);
      dispatch({ type: "LOGOUT" });
    }
  }, [query.data, query.isError, dispatch]);

  const effectiveUser = query.data ?? getStoredAuthUser();

  return {
    user: effectiveUser,
    isLoading: query.isLoading && !effectiveUser,
    isAuthenticated: !!effectiveUser,
    isError: query.isError && !effectiveUser,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to perform key-based login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: (params: LoginParams) => loginAuth(params),
    onSuccess: (user: AuthUser) => {
      if (user.token) {
        setStoredAuthToken(user.token);
      }
      setStoredAuthUser(user);
      queryClient.setQueryData(AUTH_KEYS.me, user);
      if (user.role === "ADMIN") {
        dispatch({ type: "LOGIN", payload: { role: "admin" } });
        router.replace("/admin");
      } else if (user.role === "KARYAWAN") {
        dispatch({
          type: "LOGIN",
          payload: {
            role: "karyawan",
            employee: {
              id: user.id,
              name: user.name,
              key: "",
              role: "KARYAWAN",
              isActive: true,
              createdAt: Date.now(),
            },
          },
        });
        router.replace("/karyawan");
      }
    },
  });
}

/**
 * Hook to perform logout and clear authentication cookie
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: () => logoutAuth(),
    onSuccess: () => {
      setStoredAuthToken(null);
      setStoredAuthUser(null);
      queryClient.setQueryData(AUTH_KEYS.me, null);
      queryClient.clear();
      dispatch({ type: "LOGOUT" });
      router.replace("/");
    },
    onError: () => {
      // Even if network fails, force frontend logout
      setStoredAuthToken(null);
      setStoredAuthUser(null);
      queryClient.setQueryData(AUTH_KEYS.me, null);
      dispatch({ type: "LOGOUT" });
      router.replace("/");
    },
  });
}

/**
 * Route protection hook to enforce authentication and strict RBAC
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      router.replace("/unauthorized");
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, router]);

  return {
    user,
    isLoading,
    isAuthorized: !!user && (!allowedRoles || allowedRoles.includes(user.role)),
  };
}
