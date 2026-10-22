import {
  KitchenData,
  VegetableItemData,
  SupplierData,
  DateQuotesMap,
  KitchenOrdersMap,
  AllocatedLine,
  AllocationResult,
} from "./types";

/**
 * Core Allocation Engine:
 * - Evaluates each kitchen's order strictly separately (Bếp A, Bếp B, Bếp C never merge items together).
 * - Finds the cheapest supplier currently inStock.
 * - If the cheapest supplier is out of stock, automatically falls back to the next cheapest in-stock supplier.
 * - If all suppliers are out of stock, marks as unfulfilled.
 */
export function runPerKitchenAllocation(
  kitchens: KitchenData[],
  items: VegetableItemData[],
  suppliers: SupplierData[],
  dayQuotes: DateQuotesMap,
  kitchenOrders: KitchenOrdersMap,
  filterKitchenId: string | null = null
): AllocationResult {
  const allLines: AllocatedLine[] = [];

  kitchens.forEach((kitchen) => {
    const kOrders = kitchenOrders[kitchen.id] || {};

    items.forEach((item) => {
      const needQty = parseFloat(String(kOrders[item.id])) || 0;
      if (needQty <= 0) return;

      const itemQuotes = dayQuotes[item.id] || {};
      const candidates = suppliers
        .map((sup) => {
          const q = itemQuotes[sup.id] || { price: item.basePrice, inStock: false };
          return {
            supplierId: sup.id,
            supplierName: sup.name,
            supplierPhone: sup.phone,
            supplierColor: sup.color,
            price: q.price,
            inStock: Boolean(q.inStock),
          };
        })
        .sort((a, b) => a.price - b.price);

      const highestPrice = candidates.reduce((m, c) => Math.max(m, c.price), 0);
      const outOfStockCheaper: string[] = [];
      let chosen: (typeof candidates)[0] | null = null;

      for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].inStock) {
          chosen = candidates[i];
          break;
        } else {
          outOfStockCheaper.push(candidates[i].supplierName);
        }
      }

      if (chosen) {
        const isFallback = outOfStockCheaper.length > 0;
        allLines.push({
          kitchenId: kitchen.id,
          kitchenName: kitchen.name,
          kitchenColor: kitchen.color,
          kitchenNote: kitchen.note || "",
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          qty: needQty,
          supplierId: chosen.supplierId,
          supplierName: chosen.supplierName,
          supplierPhone: chosen.supplierPhone,
          supplierColor: chosen.supplierColor,
          unitPrice: chosen.price,
          totalPrice: needQty * chosen.price,
          savedAmount: Math.max(0, needQty * (highestPrice - chosen.price)),
          note: isFallback
            ? `${outOfStockCheaper[0]} hết hàng → Đổi sang NCC rẻ kế tiếp`
            : "Đơn giá rẻ nhất",
          badgeType: isFallback ? "fallback" : "best",
          unfulfilled: false,
        });
      } else {
        allLines.push({
          kitchenId: kitchen.id,
          kitchenName: kitchen.name,
          kitchenColor: kitchen.color,
          kitchenNote: kitchen.note || "",
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          qty: needQty,
          supplierId: "NONE",
          supplierName: "Tất cả NCC hết hàng",
          supplierPhone: "-",
          supplierColor: "#E11D48",
          unitPrice: 0,
          totalPrice: 0,
          savedAmount: 0,
          note: "Tất cả các NCC đều báo hết mặt hàng này",
          badgeType: "error",
          unfulfilled: true,
        });
      }
    });
  });

  const scopedLines = filterKitchenId
    ? allLines.filter((l) => l.kitchenId === filterKitchenId)
    : allLines;

  let requestedKg = 0;
  let allocatedKg = 0;
  let totalCost = 0;
  let totalSaved = 0;
  let itemCount = 0;

  const targetKitchens = filterKitchenId
    ? kitchens.filter((k) => k.id === filterKitchenId)
    : kitchens;

  targetKitchens.forEach((k) => {
    const ko = kitchenOrders[k.id] || {};
    items.forEach((it) => {
      const q = parseFloat(String(ko[it.id])) || 0;
      if (q > 0) {
        itemCount++;
        requestedKg += q;
      }
    });
  });

  scopedLines.forEach((l) => {
    if (!l.unfulfilled) {
      allocatedKg += l.qty;
      totalCost += l.totalPrice;
      totalSaved += l.savedAmount;
    }
  });

  return {
    lines: scopedLines,
    itemCount,
    requestedKg,
    allocatedKg,
    totalCost,
    totalSaved,
  };
}

export function formatVND(val: number): string {
  return Math.round(val || 0).toLocaleString("vi-VN") + " ₫";
}
