import { AllocationResult } from "./types";

function formatDateVN(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function generateZaloOrderText(
  res: AllocationResult,
  supplierId: string,
  dateStr: string,
  specificKitchenId: string | null = null
): string {
  let items = res.lines.filter(
    (l) => l.supplierId === supplierId && !l.unfulfilled
  );
  if (specificKitchenId) {
    items = items.filter((l) => l.kitchenId === specificKitchenId);
  }
  if (!items.length) return "";

  const supName = items[0].supplierName;
  const dateFormatted = formatDateVN(dateStr);

  // If copying for a specific kitchen
  if (specificKitchenId) {
    const kName = items[0].kitchenName;
    let msg = `ĐẶT HÀNG ${supName.toUpperCase()} (${kName.toUpperCase()}) ${dateFormatted}\n`;
    items.forEach((it) => {
      msg += `- ${it.itemName}: ${it.qty} ${it.unit}\n`;
    });
    return msg.trim();
  }

  // Group by kitchen
  const byKitchen: Record<
    string,
    {
      kitchenName: string;
      list: typeof items;
    }
  > = {};

  items.forEach((it) => {
    if (!byKitchen[it.kitchenId]) {
      byKitchen[it.kitchenId] = {
        kitchenName: it.kitchenName,
        list: [],
      };
    }
    byKitchen[it.kitchenId].list.push(it);
  });

  const kitchenKeys = Object.keys(byKitchen);

  // If only 1 kitchen exists in this order
  if (kitchenKeys.length === 1) {
    const kb = byKitchen[kitchenKeys[0]];
    let msg = `ĐẶT HÀNG ${supName.toUpperCase()} ${dateFormatted}\n`;
    kb.list.forEach((it) => {
      msg += `- ${it.itemName}: ${it.qty} ${it.unit}\n`;
    });
    return msg.trim();
  }

  // If multiple kitchens exist, list items under each kitchen header (NO prices, pure quantity)
  let msg = `ĐẶT HÀNG ${supName.toUpperCase()} ${dateFormatted}\n`;
  kitchenKeys.forEach((kId) => {
    const kb = byKitchen[kId];
    msg += `\n${kb.kitchenName.toUpperCase()}:\n`;
    kb.list.forEach((it) => {
      msg += `- ${it.itemName}: ${it.qty} ${it.unit}\n`;
    });
  });

  return msg.trim();
}
