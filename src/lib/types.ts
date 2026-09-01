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
  paymentMethod: "cash" | "qris";
  cashPaid?: number;       // for cash payments
  changeAmount?: number;   // for cash payments
  qrisProofUrl?: string;   // for qris payments (base64 data URL)
}

export interface Employee {
  id: string;
  name: string;
  key: string;
  createdAt: number;
  isActive: boolean;
  monthlySalary?: number; // optional, default 0
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: number; // epoch ms
}

export interface AppState {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  qrisImageUrl: string;
  session: "admin" | "karyawan" | null;
  employees: Employee[];
  activeEmployee?: Employee | null;
}
