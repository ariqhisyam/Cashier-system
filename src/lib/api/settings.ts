import { apiClient, ApiResponse } from "./client";

export interface QrisSettingResponse {
  imageUrl: string;
}

/**
 * Fetch active QRIS Image URL from backend
 */
export async function getQrisSetting(): Promise<string> {
  const res = await apiClient.get<ApiResponse<QrisSettingResponse>>("/settings/qris");
  return res.data.data.imageUrl;
}

/**
 * Update QRIS Image URL in backend
 */
export async function updateQrisSetting(imageUrl: string): Promise<any> {
  const res = await apiClient.post<ApiResponse<any>>("/settings/qris", { imageUrl });
  return res.data.data;
}
