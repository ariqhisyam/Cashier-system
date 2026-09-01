"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import type { AppState, Product, Transaction, Employee, Expense, ShiftReport } from "./types";

const STORAGE_KEY = "matcha-kyoto-data-v3";
const STORAGE_KEY_V2 = "matcha-kyoto-data-v2"; // used for migration

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Pink Berry",   price: 17000, stock: 50, imageUrl: "/matcha-latte.jpg",    rawMaterialCost: 6419 },
  { id: "2", name: "Matcha",       price: 15000, stock: 50, imageUrl: "/hojicha-latte.jpg",  rawMaterialCost: 5033 },
  { id: "3", name: "Matcha Latte", price: 17000, stock: 50, imageUrl: "/matcha-cake.jpg",    rawMaterialCost: 6540 },
  { id: "4", name: "Seasalt",      price: 20000, stock: 50, imageUrl: "/matcha-ice-cream.jpg", rawMaterialCost: 9423 },
  { id: "5", name: "Coconut",      price: 18000, stock: 50, imageUrl: "/matcha-cookie.jpg",  rawMaterialCost: 7832 },
];

export function generateEmployeeKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MK-${randomPart}`;
}

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Kasir Utama",
    key: "kyoto123",
    createdAt: Date.now() - 86400000 * 7,
    isActive: true,
  },
  {
    id: "emp-2",
    name: "Budi Santoso",
    key: "MK-8842",
    createdAt: Date.now() - 86400000 * 2,
    isActive: true,
  },
];

const INITIAL_STATE: AppState = {
  products: DEFAULT_PRODUCTS,
  transactions: [],
  expenses: [],
  shiftReports: [],
  qrisImageUrl: "",
  session: null,
  employees: DEFAULT_EMPLOYEES,
  activeEmployee: null,
};

type Action =
  | { type: "LOGIN"; payload: { role: "admin" | "karyawan"; employee?: Employee | null } }
  | { type: "LOGOUT" }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string }
  | { type: "SET_QRIS"; payload: string }
  | { type: "ADD_EMPLOYEE"; payload: Employee }
  | { type: "UPDATE_EMPLOYEE"; payload: Employee }
  | { type: "DELETE_EMPLOYEE"; payload: string }
  | { type: "TOGGLE_EMPLOYEE_STATUS"; payload: string }
  | { type: "ADD_EXPENSE"; payload: Expense }
  | { type: "DELETE_EXPENSE"; payload: string }
  | { type: "CLOSE_SHIFT"; payload: ShiftReport }
  | { type: "DELETE_SHIFT_REPORT"; payload: string }
  | { type: "HYDRATE"; payload: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        ...action.payload,
        session: action.payload.session ?? null,
        activeEmployee: action.payload.activeEmployee ?? null,
        products: action.payload.products && action.payload.products.length > 0 ? action.payload.products : DEFAULT_PRODUCTS,
        employees: action.payload.employees && action.payload.employees.length > 0 ? action.payload.employees : DEFAULT_EMPLOYEES,
        expenses: action.payload.expenses ?? [],
        shiftReports: action.payload.shiftReports ?? [],
      };
    case "LOGIN":
      return {
        ...state,
        session: action.payload.role,
        activeEmployee: action.payload.employee || null,
      };
    case "LOGOUT":
      return { ...state, session: null, activeEmployee: null };
    case "ADD_TRANSACTION": {
      // Decrement stock
      const products = state.products.map((p) => {
        const item = action.payload.items.find((i) => i.name === p.name);
        if (!item) return p;
        return { ...p, stock: Math.max(0, p.stock - item.quantity) };
      });
      return {
        ...state,
        products,
        transactions: [action.payload, ...state.transactions],
      };
    }
    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };
    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case "SET_QRIS":
      return { ...state, qrisImageUrl: action.payload };
    case "ADD_EMPLOYEE":
      return { ...state, employees: [action.payload, ...state.employees] };
    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: state.employees.filter((e) => e.id !== action.payload),
      };
    case "TOGGLE_EMPLOYEE_STATUS":
      return {
        ...state,
        employees: state.employees.map((e) =>
          e.id === action.payload ? { ...e, isActive: !e.isActive } : e
        ),
      };
    case "ADD_EXPENSE":
      return { ...state, expenses: [action.payload, ...state.expenses] };
    case "DELETE_EXPENSE":
      return { ...state, expenses: state.expenses.filter((ex) => ex.id !== action.payload) };
    case "CLOSE_SHIFT":
      return {
        ...state,
        shiftReports: [action.payload, ...(state.shiftReports || [])],
        session: null,
        activeEmployee: null,
      };
    case "DELETE_SHIFT_REPORT":
      return {
        ...state,
        shiftReports: (state.shiftReports || []).filter((sr) => sr.id !== action.payload),
      };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Hydrate from localStorage on mount (with v2→v3 migration)
  useEffect(() => {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Migrate from v2: keep employees, transactions, expenses — reset products to new defaults
        const v2raw = localStorage.getItem(STORAGE_KEY_V2);
        if (v2raw) {
          const v2data = JSON.parse(v2raw) as Partial<AppState>;
          const migrated: Partial<AppState> = {
            ...v2data,
            products: DEFAULT_PRODUCTS, // always reset to new menu
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          raw = JSON.stringify(migrated);
        }
      }
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        dispatch({
          type: "HYDRATE",
          payload: {
            products: saved.products ?? DEFAULT_PRODUCTS,
            transactions: saved.transactions ?? [],
            expenses: saved.expenses ?? [],
            shiftReports: saved.shiftReports ?? [],
            qrisImageUrl: saved.qrisImageUrl ?? "",
            employees: saved.employees ?? DEFAULT_EMPLOYEES,
            session: saved.session ?? null,
            activeEmployee: saved.activeEmployee ?? null,
          },
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
