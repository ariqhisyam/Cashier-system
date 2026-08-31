export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
  rawMaterialCost: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  items: ReceiptItem[];
  total: number;
  timestamp: number; // epoch ms
  cashierName?: string;
}

export interface Employee {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  isActive: boolean;
}

export interface AppState {
  products: Product[];
  transactions: Transaction[];
  qrisImageUrl: string;
  session: "admin" | "karyawan" | null;
  employees: Employee[];
  activeEmployee?: Employee | null;
}
