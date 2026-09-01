import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useProducts, useDeleteProduct } from "./useProducts";

const PAGE_SIZE = 3;

export function useAdminProducts() {
  const { state } = useStore();
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Guard session
  useEffect(() => {
    if (state.session !== "admin") {
      router.replace("/");
    }
  }, [state.session, router]);

  // Reset to page 1 when search query changes
  function handleSearchChange(query: string) {
    setSearchQuery(query);
    setPage(1);
  }

  const {
    data: productsData,
    isLoading,
    isError,
    error,
    refetch,
    isPlaceholderData,
  } = useProducts(
    { page, limit: PAGE_SIZE, search: searchQuery, sortBy: "createdAt", sortOrder: "desc" },
    { enabled: state.session === "admin" }
  );

  const deleteProductMutation = useDeleteProduct();
  const products = productsData?.products || [];
  const meta = productsData?.meta || {
    total: products.length,
    page,
    limit: PAGE_SIZE,
    totalPages: 1,
  };

  function handleDelete(id: string, name: string) {
    if (confirm(`Yakin ingin menghapus menu "${name}"?`)) {
      deleteProductMutation.mutate(id, {
        onSuccess: () => {
          if (products.length === 1 && page > 1) {
            setPage((prev) => prev - 1);
          }
        },
        onError: (err: any) => {
          alert(`Gagal menghapus menu: ${err.message}`);
        },
      });
    }
  }

  return {
    products,
    meta,
    page,
    setPage,
    totalPages: meta.totalPages,
    totalProducts: meta.total,
    hasNextPage: page < meta.totalPages,
    hasPrevPage: page > 1,
    isPlaceholderData,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    searchQuery,
    setSearchQuery: handleSearchChange,
    editingId,
    setEditingId,
    showAddForm,
    setShowAddForm,
    handleDelete,
    isDeleting: deleteProductMutation.isPending,
    isAuthorized: state.session === "admin",
  };
}
