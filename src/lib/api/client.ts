import axios from "axios";

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor to unwrap data and handle error messages cleanly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      "Terjadi kesalahan saat memanggil server";
    return Promise.reject(new Error(Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg));
  }
);
