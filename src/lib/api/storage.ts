import { apiClient, ApiResponse } from "./client";

export interface StorageUploadResponse {
  url: string;
  path: string;
  bucket: string;
  filename: string;
}

/**
 * Upload a file directly to Supabase Object Storage bucket (Cashier-system-img) via NestJS backend
 */
export async function uploadToStorage(file: File, folder = "products"): Promise<StorageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await apiClient.post<ApiResponse<StorageUploadResponse>>(
    `/storage/upload?folder=${encodeURIComponent(folder)}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data.data;
}
