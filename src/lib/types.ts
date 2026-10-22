export type UserRole = "admin" | "supplier";

export interface SessionState {
  role: UserRole;
  supplierId: string | null;
}

export interface SupplierData {
  id: string;
  name: string;
  phone: string;
  note: string | null;
  color: string;
  isActive: boolean;
}

export interface KitchenData {
  id: string;
  name: string;
  note: string | null;
  color: string;
}

export interface VegetableItemData {
  id: string;
  name: string;
  unit: string;
  basePrice: number;
}

export interface QuoteDetail {
  price: number;
  inStock: boolean;
}

// itemId -> supplierId -> QuoteDetail
export type DateQuotesMap = Record<string, Record<string, QuoteDetail>>;

// kitchenId -> itemId -> quantity
export type KitchenOrdersMap = Record<string, Record<string, number>>;

export interface AllocatedLine {
  kitchenId: string;
  kitchenName: string;
  kitchenColor: string;
  kitchenNote: string;
  itemId: string;
  itemName: string;
  unit: string;
  qty: number;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  supplierColor: string;
  unitPrice: number;
  totalPrice: number;
  savedAmount: number;
  note: string;
  badgeType: "best" | "fallback" | "error";
  unfulfilled: boolean;
}

export interface AllocationResult {
  lines: AllocatedLine[];
  itemCount: number;
  requestedKg: number;
  allocatedKg: number;
  totalCost: number;
  totalSaved: number;
}

export interface OrderBatchSummary {
  id: string;
  date: string;
  totalWeight: number;
  totalCost: number;
  totalSaved: number;
  lines: Array<{
    id: string;
    kitchenId: string;
    kitchenName: string;
    kitchenColor?: string;
    itemId: string;
    itemName: string;
    unit: string;
    supplierId: string;
    supplierName: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    note: string | null;
    isFallback: boolean;
  }>;
}
