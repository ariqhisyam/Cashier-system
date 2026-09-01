import { apiClient, ApiResponse } from "./client";

export interface QrisSettingResponse {
  imageUrl: string;
}

export interface GeofenceSetting {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isEnabled: boolean;
  addressName?: string;
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

/**
 * Fetch outlet geofencing settings from backend
 */
export async function getGeofenceSetting(): Promise<GeofenceSetting> {
  const res = await apiClient.get<ApiResponse<GeofenceSetting>>("/settings/geofence");
  return res.data.data;
}

/**
 * Save outlet geofencing settings in backend
 */
export async function updateGeofenceSetting(
  data: GeofenceSetting
): Promise<GeofenceSetting> {
  const res = await apiClient.post<ApiResponse<GeofenceSetting>>(
    "/settings/geofence",
    data
  );
  return res.data.data;
}
