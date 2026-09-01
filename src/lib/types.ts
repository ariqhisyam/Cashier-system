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
  cashierId?: string;
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

export interface ShiftReport {
  id: string;
  shiftName: string; // e.g. "Shift Harian"
  closedAt: number; // epoch ms
  closedBy: string; // employee name
  employeeId?: string;
  totalGrossRevenue: number;
  totalCups: number;
  totalTransactions: number;
  totalHpp: number;
  dailySalaryCost: number;
  totalExpenses: number;
  netProfit: number;
  cashRevenue: number;
  qrisRevenue: number;
  cashCups: number;
  qrisCups: number;
  cashCount: number;
  qrisCount: number;
  notes?: string;
}

export interface AppState {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  shiftReports: ShiftReport[];
  qrisImageUrl: string;
  session: "admin" | "karyawan" | null;
  employees: Employee[];
  activeEmployee?: Employee | null;
}
