import { useState, useRef, ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import type { Product } from "@/lib/types";
import { useUpdateProduct } from "./useProducts";
import { useUploadStorage } from "./useStorage";

export interface EditProductFormValues {
  name: string;
  price: number;
  stock: number;
  rawMaterialCost: number;
}

export function useEditProductRow(product: Product, options?: { onSaved?: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState(product.imageUrl || "");
  const [uploadedUrl, setUploadedUrl] = useState<string>(product.imageUrl || "");

  const updateProductMutation = useUpdateProduct();
  const uploadStorageMutation = useUploadStorage();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProductFormValues>({
    defaultValues: {
      name: product.name,
      price: product.price,
      stock: product.stock,
      rawMaterialCost: product.rawMaterialCost,
    },
  });

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadStorageMutation.mutateAsync({ file, folder: "products" });
      setUploadedUrl(res.url);
      setImagePreview(res.url);
    } catch (err: any) {
      alert(`Gagal mengupload gambar ke Supabase Storage: ${err.message}`);
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  const onSubmit = (data: EditProductFormValues) => {
    const finalImageUrl = uploadedUrl || product.imageUrl;

    updateProductMutation.mutate(
      {
        id: product.id,
        data: {
          name: data.name,
          price: Number(data.price),
          stock: Number(data.stock),
          rawMaterialCost: Number(data.rawMaterialCost),
          imageUrl: finalImageUrl,
        },
      },
      {
        onSuccess: () => {
          if (options?.onSaved) options.onSaved();
        },
        onError: (err: any) => {
          alert(`Gagal memperbarui menu: ${err.message}`);
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
    triggerFileInput,
    handleImageUpload,
    onSubmit: handleSubmit(onSubmit),
    isUploading: uploadStorageMutation.isPending,
    isUpdating: updateProductMutation.isPending,
  };
}
