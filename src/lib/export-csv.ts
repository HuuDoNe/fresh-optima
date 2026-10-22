import { SupplierData, OrderBatchSummary } from "./types";

export function exportReportToCSV(
  monthVal: string,
  suppliers: SupplierData[],
  orders: OrderBatchSummary[]
): void {
  const filtered = orders
    .filter((h) => h.date.startsWith(monthVal))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!filtered.length) {
    throw new Error(`Không có dữ liệu đơn hàng trong tháng ${monthVal}`);
  }

  const supHeaders = suppliers.map((s) => `"${s.name} (VNĐ)"`).join(",");
  let csv = `\uFEFFNgày Đặt Hàng,${supHeaders},Tổng Cộng Ngày (VNĐ)\n`;

  filtered.forEach((o) => {
    const perSup: Record<string, number> = {};
    suppliers.forEach((s) => {
      perSup[s.id] = 0;
    });
    let total = 0;
    o.lines.forEach((l) => {
      perSup[l.supplierId] = (perSup[l.supplierId] || 0) + l.totalPrice;
      total += l.totalPrice;
    });
    const supCols = suppliers.map((s) => perSup[s.id] || 0).join(",");
    csv += `${o.date},${supCols},${total}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bao_Cao_Chi_Phi_NCC_${monthVal}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
