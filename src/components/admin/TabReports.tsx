"use client";

import React, { useState } from "react";
import { SupplierData, OrderBatchSummary } from "@/lib/types";
import { formatVND } from "@/lib/optimizer";
import { exportReportToCSV } from "@/lib/export-csv";
import {
  History,
  Download,
  Trash2,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3,
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
  const [inspectedDate, setInspectedDate] = useState<string | null>(
    history.some((h) => h.date === yesterdayISO)
      ? yesterdayISO
      : history.length > 0
      ? history[0].date
      : null
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

  const inspectedRecord = history.find((h) => h.date === inspectedDate);

  return (
    <section className="animate-view space-y-3 pb-24 max-w-full">
      {/* 1. Header & Month Selector */}
      <div className="ios-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#5856D6]" />
            <h2 className="text-sm font-extrabold text-[#1C1C1E] tracking-tight">
              Báo Cáo Chi Phí
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 bg-[#F2F2F7] border border-black/5 rounded-full px-2 py-0.5">
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="text-xs font-bold text-[#1C1C1E] bg-transparent focus:outline-none tnum cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="p-1 px-2 rounded-full bg-[#1C1C1E] text-white text-[11px] font-bold transition active:scale-95 flex items-center gap-1 shadow-2xs"
              title="Xuất file Excel"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* 2. Month Total Card */}
        <div className="bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] text-white p-3.5 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-medium text-white/70">
            Tổng Chi Phí Tháng {monthFilter}
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight tnum text-white">
            {formatVND(grandMonthTotal)}
          </div>
          <div className="text-[11px] text-white/60 pt-0.5">
            {ordersInMonth.length} ngày có đơn hàng chốt
          </div>
        </div>

        {/* Suppliers Month Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar -mx-1 px-1">
          {suppliers.map((s) => {
            const amt = monthSupTotals[s.id] || 0;
            return (
              <div
                key={s.id}
                className="bg-[#F2F2F7] rounded-xl px-2.5 py-1.5 shrink-0 border border-black/5 space-y-0.5 min-w-[95px]"
              >
                <div className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[11px] font-bold text-[#1C1C1E] truncate">
                    {s.name}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-[#34C759] tnum">
                  {formatVND(amt)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. History Days List (iOS Inset Grouped) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93] px-1">
          Lịch Sử Đơn Hàng Theo Ngày
        </div>

        <div className="ios-card overflow-hidden divide-y divide-[#3C3C43]/8">
          {!ordersInMonth.length ? (
            <div className="py-8 text-center text-xs text-[#8E8E93]">
              Chưa có đơn hàng nào trong tháng {monthFilter}.
            </div>
          ) : (
            ordersInMonth.map((dayOrder) => {
              const isInspected = inspectedDate === dayOrder.date;
              const isToday = dayOrder.date === workingDate;
              const isYesterday = dayOrder.date === yesterdayISO;

              return (
                <div key={dayOrder.id} className="transition">
                  {/* Day Row Header */}
                  <div
                    onClick={() =>
                      setInspectedDate(isInspected ? null : dayOrder.date)
                    }
                    className="px-3.5 py-3 flex items-center justify-between gap-2 hover:bg-black/[0.015] active:bg-black/[0.03] cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm text-[#1C1C1E] tnum">
                          {dayOrder.date}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#1C1C1E] text-white">
                            Hôm nay
                          </span>
                        )}
                        {isYesterday && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#FF9500]/15 text-[#FF9500]">
                            Hôm trước
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#8E8E93] mt-0.5">
                        {dayOrder.lines.length} dòng đơn
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-extrabold text-[#34C759] tnum">
                        {formatVND(dayOrder.totalCost)}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#767680]/12 flex items-center justify-center text-[#1C1C1E]">
                        {isInspected ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Day Inspection Details */}
                  {isInspected && (
                    <div className="px-3.5 pb-3.5 pt-1 bg-[#F2F2F7]/50 space-y-2.5 border-t border-[#3C3C43]/5">
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onReloadDateToOrders(dayOrder.date)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#1C1C1E] text-white text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Nạp vào Đặt Hàng</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteHistoryDay(dayOrder.date)}
                          className="p-1.5 rounded-xl text-[#FF3B30] hover:bg-[#FF3B30]/10 transition flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa ngày này</span>
                        </button>
                      </div>

                      {/* Items breakdown list */}
                      <div className="bg-white rounded-xl overflow-hidden divide-y divide-[#3C3C43]/5 border border-black/5 shadow-2xs">
                        {dayOrder.lines.map((l, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: l.kitchenColor }}
                                />
                                <span className="font-semibold text-[#1C1C1E] truncate">
                                  {l.kitchenName}: {l.itemName}
                                </span>
                              </div>
                              <div className="text-[10px] text-[#8E8E93]">
                                {l.supplierName}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-bold text-[#1C1C1E] tnum">
                                {l.qty} {l.unit}
                              </div>
                              <div className="text-[10px] text-[#34C759] font-semibold tnum">
                                {formatVND(l.totalPrice)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
