import { AllocationResult } from "./types";

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
  const byKitchen: Record<
    string,
    {
      kitchenName: string;
      kitchenNote: string;
      list: typeof items;
      subTotal: number;
    }
  > = {};

  items.forEach((it) => {
    if (!byKitchen[it.kitchenId]) {
      byKitchen[it.kitchenId] = {
        kitchenName: it.kitchenName,
        kitchenNote: it.kitchenNote,
        list: [],
        subTotal: 0,
      };
    }
    byKitchen[it.kitchenId].list.push(it);
    byKitchen[it.kitchenId].subTotal += it.totalPrice;
  });

  let total = 0;
  let msg = `PHIẾU ĐẶT HÀNG RAU CỦ (${dateStr})\nKính gửi NCC: ${supName}\n(Lưu ý: Đóng gói và giao riêng từng bếp, không gộp chung)\n====================\n`;

  Object.values(byKitchen).forEach((kb) => {
    msg += `\n📌 ĐƠN RIÊNG: ${kb.kitchenName.toUpperCase()}${
      kb.kitchenNote ? ` (${kb.kitchenNote})` : ""
    }\n`;
    kb.list.forEach((it, idx) => {
      msg += `  ${idx + 1}. ${it.itemName}: ${it.qty} ${
        it.unit
      } x ${it.unitPrice.toLocaleString("vi-VN")}đ = ${it.totalPrice.toLocaleString(
        "vi-VN"
      )}đ\n`;
    });
    msg += `  -> Cộng ${kb.kitchenName}: ${kb.subTotal.toLocaleString(
      "vi-VN"
    )} VNĐ\n`;
    total += kb.subTotal;
  });

  msg += `\n====================\nTỔNG CỘNG: ${total.toLocaleString("vi-VN")} VNĐ`;
  return msg;
}
