import { apiClient, ApiResponse } from "./client";
import type { Product } from "@/lib/types";

export interface CreateProductInput {
  name: string;
  price: number;
  stock?: number;
  rawMaterialCost?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  stock?: number;
  rawMaterialCost?: number;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch products with pagination and search from NestJS backend
 */
export async function getProducts(
  params?: FetchProductsParams
): Promise<{ products: Product[]; meta: ProductListMeta }> {
  const res = await apiClient.get<ApiResponse<Product[]>>("/products", {
    params,
  });

  const products = Array.isArray(res.data.data) ? res.data.data : [];
  const responseMeta = res.data.meta;
  const total = responseMeta?.total ?? products.length;
  const page = responseMeta?.page ?? params?.page ?? 1;
  const limit = responseMeta?.limit ?? params?.limit ?? 3;
  const totalPages = responseMeta?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  return {
    products,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<Product> {
  const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}

/**
 * Create a new product
 */
export async function createProduct(data: CreateProductInput): Promise<Product> {
  const res = await apiClient.post<ApiResponse<Product>>("/products", data);
  return res.data.data;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(id: string): Promise<Product> {
  const res = await apiClient.delete<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
}
