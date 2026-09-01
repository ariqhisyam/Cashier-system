import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useCreateProduct } from "./useProducts";
import { useUploadStorage } from "./useStorage";

export interface ProductFormValues {
  name: string;
  price: number;
  stock: number;
  rawMaterialCost: number;
}

export function useAddProductForm(options?: { onClose?: () => void; onSuccess?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");

  const createProductMutation = useCreateProduct();
  const uploadStorageMutation = useUploadStorage();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      price: 0,
      stock: 50,
      rawMaterialCost: 0,
    },
  });

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    try {
      const res = await uploadStorageMutation.mutateAsync({ file, folder: "products" });
      setUploadedUrl(res.url);
      setImagePreview(res.url);
    } catch (err: any) {
      setImageError(`Gagal upload ke storage: ${err.message}`);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  const onSubmit = (data: ProductFormValues) => {
    if (!uploadedUrl) {
      setImageError("Foto menu wajib diunggah ke Supabase Object Storage!");
      return;
    }

    createProductMutation.mutate(
      {
        name: data.name,
        price: Number(data.price),
        stock: Number(data.stock) || 0,
        rawMaterialCost: Number(data.rawMaterialCost) || 0,
        imageUrl: uploadedUrl,
      },
      {
        onSuccess: () => {
          reset();
          setUploadedUrl("");
          setImagePreview("");
          setImageError("");
          if (options?.onSuccess) options.onSuccess();
          if (options?.onClose) options.onClose();
        },
        onError: (err: any) => {
          alert(`Gagal menambah menu: ${err.message}`);
        },
      }
    );
  };

  return {
    register,
    errors,
    fileInputRef,
    imagePreview,
    uploadedUrl,
    imageError,
    triggerFileInput,
    handleImageUpload,
    onSubmit: handleSubmit(onSubmit),
    isUploading: uploadStorageMutation.isPending,
    isCreating: createProductMutation.isPending,
  };
}
