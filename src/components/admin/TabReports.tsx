"use client";

import React, { useState } from "react";
import { SupplierData, OrderBatchSummary } from "@/lib/types";
import { formatVND } from "@/lib/optimizer";
import { exportReportToCSV } from "@/lib/export-csv";
import {
  History,
  Download,
  Receipt,
  Trash2,
  Eye,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface TabReportsProps {
  workingDate: string;
  suppliers: SupplierData[];
  history: OrderBatchSummary[];
  onReloadDateToOrders: (dateStr: string) => void;
  onDeleteHistoryDay: (dateStr: string) => void;
  onNotify: (msg: string, type?: "default" | "warn") => void;
}

export function TabReports({
  workingDate,
  suppliers,
  history,
  onReloadDateToOrders,
  onDeleteHistoryDay,
  onNotify,
}: TabReportsProps) {
  const [monthFilter, setMonthFilter] = useState(workingDate.slice(0, 7));

  function shiftDateISO(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  }

  const yesterdayISO = shiftDateISO(workingDate, -1);
  const [inspectedDate, setInspectedDate] = useState<string>(
    history.some((h) => h.date === yesterdayISO)
      ? yesterdayISO
      : history.length > 0
      ? history[0].date
      : yesterdayISO
  );

  const ordersInMonth = history
    .filter((h) => h.date.startsWith(monthFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Compute monthly totals per supplier
  const monthSupTotals: Record<string, number> = {};
  suppliers.forEach((s) => {
    monthSupTotals[s.id] = 0;
  });
  let grandMonthTotal = 0;

  ordersInMonth.forEach((dayOrder) => {
    dayOrder.lines.forEach((line) => {
      monthSupTotals[line.supplierId] =
        (monthSupTotals[line.supplierId] || 0) + line.totalPrice;
      grandMonthTotal += line.totalPrice;
    });
  });

  const handleExportCSV = () => {
    try {
      exportReportToCSV(monthFilter, suppliers, history);
      onNotify(`Đã xuất báo cáo chi phí tháng ${monthFilter} ra file CSV`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi khi xuất file";
      onNotify(msg, "warn");
    }
  };

  const handleQuickYesterday = () => {
    setInspectedDate(yesterdayISO);
    const el = document.getElementById("history-day-inspector");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    onNotify(`Đang xem lại chi tiết lịch sử hôm trước (${yesterdayISO})`);
  };

  // Inspected Day detail data
  const inspectedRecord = history.find((h) => h.date === inspectedDate);
  const inspectedSupSummary: Record<
    string,
    { supplierName: string; total: number; count: number }
  > = {};
  let inspectedDayTotal = 0;

  if (inspectedRecord) {
    inspectedRecord.lines.forEach((l) => {
      if (!inspectedSupSummary[l.supplierId]) {
        inspectedSupSummary[l.supplierId] = {
          supplierName: l.supplierName,
          total: 0,
          count: 0,
        };
      }
      inspectedSupSummary[l.supplierId].total += l.totalPrice;
      inspectedSupSummary[l.supplierId].count += 1;
      inspectedDayTotal += l.totalPrice;
    });
  }

  return (
    <section className="animate-view space-y-6">
      {/* Top Control Bar: Filter by Month & Quick View Yesterday */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-950">
            Báo Cáo Chi Phí Theo Ngày & Tổng Tiền Từng Nhà Cung Cấp
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Theo dõi số tiền thanh toán cho từng nhà cung cấp mỗi ngày và tra cứu
            lại lịch sử đơn hôm trước
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleQuickYesterday}
            className="px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Xem lịch sử hôm trước</span>
          </button>

          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-zinc-500">Tháng:</span>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs font-semibold text-zinc-900 bg-transparent focus:outline-none tnum cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Summary Totals per Supplier for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 text-white p-4 rounded-xl shadow-2xs">
          <span className="text-xs font-medium text-zinc-400">
            Tổng chi phí tháng {monthFilter}
          </span>
          <div className="text-xl font-bold mt-1 tnum">
            {formatVND(grandMonthTotal)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            {ordersInMonth.length} ngày có đơn hàng đã chốt
          </span>
        </div>

        {suppliers.map((s) => {
          const supTotal = monthSupTotals[s.id] || 0;
          return (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs font-semibold text-zinc-700 truncate">
                  {s.name}
                </span>
              </div>
              <div className="text-xl font-bold text-zinc-950 mt-1 tnum">
                {formatVND(supTotal)}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block tnum">
                Zalo: {s.phone}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Table: Ngày & Tổng Tiền Của Các Nhà Cung Cấp */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">
              Bảng Tổng Hợp Chi Phí Theo Ngày & Nhà Cung Cấp
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Bấm vào dòng ngày bất kỳ hoặc nút &quot;Xem lại đơn&quot; để xem chi
              tiết lịch sử ngày đó
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-5">Ngày đặt hàng</th>
                {suppliers.map((s) => (
                  <th key={s.id} className="py-3 px-5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-zinc-800 normal-case font-bold text-xs">
                        {s.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-5 text-right text-zinc-900">
                  Tổng cộng ngày
                </th>
                <th className="py-3 px-5 text-center">Lịch sử</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 text-xs">
              {!ordersInMonth.length ? (
                <tr>
                  <td
                    colSpan={suppliers.length + 3}
                    className="py-10 text-center text-zinc-400"
                  >
                    Chưa có dữ liệu đơn hàng trong tháng {monthFilter}.
                  </td>
                </tr>
              ) : (
                ordersInMonth.map((dayOrder) => {
                  const perSup: Record<string, number> = {};
                  suppliers.forEach((s) => {
                    perSup[s.id] = 0;
                  });
                  let rowTotal = 0;

                  dayOrder.lines.forEach((l) => {
                    perSup[l.supplierId] =
                      (perSup[l.supplierId] || 0) + l.totalPrice;
                    rowTotal += l.totalPrice;
                  });

                  const isSelected = inspectedDate === dayOrder.date;
                  const isYesterday = dayOrder.date === yesterdayISO;
                  const isToday = dayOrder.date === workingDate;

                  return (
                    <tr
                      key={dayOrder.id}
                      onClick={() => setInspectedDate(dayOrder.date)}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-emerald-50/70" : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="py-3.5 px-5 font-semibold text-zinc-900 tnum">
                        <div className="flex items-center gap-2">
                          <span>{dayOrder.date}</span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 text-white">
                              Hôm nay
                            </span>
                          )}
                          {isYesterday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              Hôm trước
                            </span>
                          )}
                        </div>
                      </td>

                      {suppliers.map((s) => {
                        const amt = perSup[s.id] || 0;
                        return (
                          <td
                            key={s.id}
                            className={`py-3.5 px-5 text-right font-semibold tnum ${
                              amt > 0 ? "text-zinc-900" : "text-zinc-300"
                            }`}
                          >
                            {amt > 0 ? formatVND(amt) : "0 ₫"}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-5 text-right font-bold text-emerald-700 tnum">
                        {formatVND(rowTotal)}
                      </td>

                      <td
                        className="py-3.5 px-5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectedDate(dayOrder.date)}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition flex items-center gap-1 ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem lại đơn</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteHistoryDay(dayOrder.date)}
                            className="text-zinc-400 hover:text-rose-600 p-1 rounded transition"
                            title={`Xóa ngày ${dayOrder.date}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {ordersInMonth.length > 0 && (
              <tfoot className="bg-zinc-50 border-t-2 border-zinc-200 font-bold text-xs">
                <tr>
                  <td className="py-3.5 px-5 text-zinc-900">
                    TỔNG CỘNG THÁNG {monthFilter}
                  </td>
                  {suppliers.map((s) => (
                    <td
                      key={s.id}
                      className="py-3.5 px-5 text-right text-zinc-900 tnum"
                    >
                      {formatVND(monthSupTotals[s.id] || 0)}
                    </td>
                  ))}
                  <td className="py-3.5 px-5 text-right text-emerald-700 text-sm tnum">
                    {formatVND(grandMonthTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Historical Day Inspector Panel (Xem lại lịch sử của hôm trước / ngày được chọn) */}
      <div
        id="history-day-inspector"
        className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-950">
                  Chi Tiết Lịch Sử Đơn Hàng Ngày:
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-600 text-white tnum">
                  {inspectedDate}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Xem lại chi tiết các bếp đã đặt hoặc nạp lại về ngày làm việc để
                chỉnh sửa
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setInspectedDate(shiftDateISO(inspectedDate, -1))}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Ngày trước</span>
            </button>

            <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-2 py-1">
              <Calendar className="w-3 h-3 text-zinc-400 mr-1.5" />
              <input
                type="date"
                value={inspectedDate}
                onChange={(e) => setInspectedDate(e.target.value)}
                className="text-xs font-semibold text-zinc-800 tnum focus:outline-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => setInspectedDate(shiftDateISO(inspectedDate, 1))}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1"
            >
              <span>Ngày sau</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => onReloadDateToOrders(inspectedDate)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở ngày này ở mục Đặt hàng</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {!inspectedRecord || !inspectedRecord.lines.length ? (
            <div className="py-8 text-center space-y-2">
              <div className="text-xs text-zinc-400">
                Không có lịch sử đơn hàng đã chốt vào ngày{" "}
                <strong className="text-zinc-700">{inspectedDate}</strong>.
              </div>
              <button
                type="button"
                onClick={() => onReloadDateToOrders(inspectedDate)}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700"
              >
                Chuyển sang ngày {inspectedDate} để tạo đơn mới
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Supplier Totals for Inspected Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">
                    Tổng tiền ngày {inspectedDate}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 tnum">
                    {formatVND(inspectedDayTotal)}
                  </span>
                </div>

                {Object.values(inspectedSupSummary).map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between"
                  >
                    <span className="text-xs font-semibold text-zinc-700 truncate mr-2">
                      {s.supplierName}
                    </span>
                    <span className="text-sm font-bold text-zinc-900 tnum shrink-0">
                      {formatVND(s.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Lines of Inspected Day */}
              <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase">
                      <th className="py-2.5 px-4">Bếp đặt</th>
                      <th className="py-2.5 px-4">Mặt hàng</th>
                      <th className="py-2.5 px-4">Nhà cung cấp</th>
                      <th className="py-2.5 px-4 text-right">Số lượng</th>
                      <th className="py-2.5 px-4 text-right">Đơn giá</th>
                      <th className="py-2.5 px-4 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {inspectedRecord.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-zinc-50">
                        <td className="py-2.5 px-4">
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                            style={{
                              backgroundColor: l.kitchenColor || "#059669",
                            }}
                          >
                            {l.kitchenName || "Bếp"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-zinc-900">
                          {l.itemName}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-700">
                          {l.supplierName}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold tnum">
                          {l.qty} {l.unit || "kg"}
                        </td>
                        <td className="py-2.5 px-4 text-right text-zinc-600 tnum">
                          {formatVND(l.unitPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-700 tnum">
                          {formatVND(l.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
