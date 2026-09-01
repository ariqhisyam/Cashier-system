import { useState, useRef, ChangeEvent } from "react";
import { useQris, useUpdateQris } from "./useQris";
import { useUploadStorage } from "./useStorage";

export function useQrisCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedToast, setSavedToast] = useState(false);

  const { data: qrisUrl = "/qris.jpg" } = useQris();
  const updateQrisMutation = useUpdateQris();
  const uploadStorageMutation = useUploadStorage();

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadStorageMutation.mutateAsync({ file, folder: "qris" });
      updateQrisMutation.mutate(res.url, {
        onSuccess: () => {
          setSavedToast(true);
          setTimeout(() => setSavedToast(false), 2500);
        },
        onError: (err: any) => {
          alert(`Gagal menyimpan QRIS: ${err.message}`);
        },
      });
    } catch (err: any) {
      alert(`Gagal mengupload QRIS ke Supabase Storage: ${err.message}`);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  const isBusy = uploadStorageMutation.isPending || updateQrisMutation.isPending;

  return {
    qrisUrl,
    fileInputRef,
    savedToast,
    isBusy,
    triggerFileInput,
    handleFileUpload,
  };
}
