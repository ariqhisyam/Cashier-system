import { useMutation } from "@tanstack/react-query";
import { uploadToStorage, StorageUploadResponse } from "@/lib/api/storage";

export interface UploadStoragePayload {
  file: File;
  folder?: string;
}

/**
 * Custom mutation hook for uploading images to Supabase Object Storage
 */
export function useUploadStorage() {
  return useMutation<StorageUploadResponse, Error, UploadStoragePayload>({
    mutationFn: ({ file, folder = "products" }) => uploadToStorage(file, folder),
  });
}
