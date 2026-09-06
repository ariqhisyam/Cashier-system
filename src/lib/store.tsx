"use client";
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { AppState, Product, Transaction, Employee, Expense, ShiftReport, AttendanceRecord, OutletLocation } from "./types";

/**
 * Daily salary formula: Monthly salary / 30 days (per business spec)
 */
export function calculateDailySalary(monthlySalary?: number | null): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  return Math.round(monthlySalary / 30);
}

/**
 * Weekly salary formula: Monthly salary / 4 weeks (per business spec)
 */
export function calculateWeeklySalary(monthlySalary?: number | null): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  return Math.round(monthlySalary / 4);
}

const STORAGE_KEY = "matcha-kyoto-data-v3";
const STORAGE_KEY_V2 = "matcha-kyoto-data-v2"; // used for migration

const DEFAULT_PRODUCTS: Product[] = [];

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

export const DEFAULT_OUTLET_LOCATION: OutletLocation = {
  latitude: -0.026330,
  longitude: 109.342503,
  radiusMeters: 100,
  isEnabled: true,
  addressName: "Outlet 4rq Cashier - Pontianak",
};

const INITIAL_STATE: AppState = {
  products: DEFAULT_PRODUCTS,
  transactions: [],
  expenses: [],
  shiftReports: [],
  attendanceRecords: [],
  outletLocation: DEFAULT_OUTLET_LOCATION,
  qrisImageUrl: "/qris.jpg",
  session: null,
  employees: DEFAULT_EMPLOYEES,
  activeEmployee: null,
};

type Action =
  | { type: "LOGIN"; payload: { role: "admin" | "karyawan"; employee?: Employee | null } }
  | { type: "LOGOUT" }
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: string }
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
  | { type: "SET_OUTLET_LOCATION"; payload: OutletLocation }
  | { type: "RECORD_CLOCK_IN"; payload: AttendanceRecord }
  | { type: "RECORD_CLOCK_OUT"; payload: { employeeId: string; clockOut: number } }
  | { type: "DELETE_ATTENDANCE_RECORD"; payload: string }
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
        attendanceRecords: action.payload.attendanceRecords ?? [],
        outletLocation: action.payload.outletLocation ?? DEFAULT_OUTLET_LOCATION,
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
    case "DELETE_TRANSACTION": {
      const txToDelete = state.transactions.find((t) => t.id === action.payload);
      const products = txToDelete
        ? state.products.map((p) => {
            const item = txToDelete.items.find((i) => i.name === p.name);
            if (!item) return p;
            return { ...p, stock: p.stock + item.quantity };
          })
        : state.products;
      return {
        ...state,
        products,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
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
      };
    case "DELETE_SHIFT_REPORT":
      return {
        ...state,
        shiftReports: (state.shiftReports || []).filter((sr) => sr.id !== action.payload),
      };
    case "SET_OUTLET_LOCATION":
      return {
        ...state,
        outletLocation: action.payload,
      };
    case "RECORD_CLOCK_IN":
      return {
        ...state,
        attendanceRecords: [action.payload, ...(state.attendanceRecords || [])],
      };
    case "RECORD_CLOCK_OUT": {
      const records = (state.attendanceRecords || []).map((rec) => {
        if (rec.employeeId === action.payload.employeeId && !rec.clockOut) {
          return { ...rec, clockOut: action.payload.clockOut };
        }
        return rec;
      });
      return {
        ...state,
        attendanceRecords: records,
      };
    }
    case "DELETE_ATTENDANCE_RECORD":
      return {
        ...state,
        attendanceRecords: (state.attendanceRecords || []).filter((r) => r.id !== action.payload),
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
  const isHydratedRef = useRef(false);

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
            attendanceRecords: saved.attendanceRecords ?? [],
            outletLocation: saved.outletLocation ?? DEFAULT_OUTLET_LOCATION,
            qrisImageUrl: saved.qrisImageUrl || "/qris.jpg",
            employees: saved.employees ?? DEFAULT_EMPLOYEES,
            session: saved.session ?? null,
            activeEmployee: saved.activeEmployee ?? null,
          },
        });
      }
    } catch {
      // ignore
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  // Persist to localStorage on state change ONLY after hydration is complete
  useEffect(() => {
    if (!isHydratedRef.current) return;
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
  const isNegative = amount < 0;
  const absFormatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  return isNegative ? `-${absFormatted}` : absFormatted;
}

/**
 * Returns YYYY-MM-DD in Asia/Jakarta (WIB) timezone
 */
export function getWibDateString(dateOrTs: number | string | Date = new Date()): string {
  const d = new Date(dateOrTs);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Checks if two timestamps/dates fall on the exact same day in WIB (Asia/Jakarta)
 */
export function isSameDayWib(
  dateOrTs1: number | string | Date,
  dateOrTs2: number | string | Date = new Date()
): boolean {
  return getWibDateString(dateOrTs1) === getWibDateString(dateOrTs2);
}

/**
 * Checks if a timestamp/date falls within the current Monday-Sunday week in WIB
 */
export function isSameWeekWib(
  dateOrTs: number | string | Date,
  ref: number | string | Date = new Date()
): boolean {
  const d = new Date(dateOrTs);
  const nowWibStr = getWibDateString(ref);
  const [year, month, day] = nowWibStr.split("-").map(Number);
  const nowWib = new Date(year, month - 1, day);

  const dayOfWeek = (nowWib.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const startOfWeek = new Date(nowWib);
  startOfWeek.setDate(nowWib.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const targetWibStr = getWibDateString(d);
  const [tYear, tMonth, tDay] = targetWibStr.split("-").map(Number);
  const targetWib = new Date(tYear, tMonth - 1, tDay);

  return targetWib >= startOfWeek && targetWib < endOfWeek;
}

/**
 * Checks if a timestamp/date falls within the current month in WIB
 */
export function isSameMonthWib(
  dateOrTs: number | string | Date,
  ref: number | string | Date = new Date()
): boolean {
  const d1 = new Date(dateOrTs);
  const d2 = new Date(ref);
  const f1 = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(d1);
  const f2 = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(d2);
  return f1 === f2;
}

