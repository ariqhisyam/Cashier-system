"use client";
import React from "react";
import { useAdminProducts } from "@/hooks";
import BottomNav from "@/components/BottomNav";
import ProductHeader from "./components/ProductHeader";
import QrisSettingCard from "./components/QrisSettingCard";
import ProductSearchHeader from "./components/ProductSearchHeader";
import AddProductForm from "./components/AddProductForm";
import ProductList from "./components/ProductList";
import ProductPagination from "./components/ProductPagination";

export default function AdminProductsPage() {
  const {
    products,
    page,
    setPage,
    totalPages,
    totalProducts,
    hasNextPage,
    hasPrevPage,
    isPlaceholderData,
    isLoading,
    isError,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    editingId,
    setEditingId,
    showAddForm,
    setShowAddForm,
    handleDelete,
    isDeleting,
  } = useAdminProducts();

  return (
    <div className="page-root">
      <div className="page-content">
        <ProductHeader onRefresh={refetch} />

        <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <QrisSettingCard />

          {/* Search Header */}
          <ProductSearchHeader
            totalProducts={totalProducts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenAddForm={() => setShowAddForm(true)}
          />

          {/* Pagination directly below Search */}
          <ProductPagination
            page={page}
            totalPages={totalPages}
            totalProducts={totalProducts}
            limit={3}
            hasPrevPage={hasPrevPage}
            hasNextPage={hasNextPage}
            onPageChange={setPage}
            isPlaceholderData={isPlaceholderData}
          />

          {showAddForm && (
            <AddProductForm onClose={() => setShowAddForm(false)} />
          )}

          {/* Products List */}
          <ProductList
            products={products}
            isLoading={isLoading}
            isError={isError}
            error={error}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={() => setEditingId(null)}
            onSavedEdit={() => setEditingId(null)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            onRetry={refetch}
          />
        </main>
      </div>

      <BottomNav role="admin" />
    </div>
  );
}
