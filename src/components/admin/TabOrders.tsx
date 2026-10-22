"use client";

import React, { useState } from "react";
import {
  KitchenData,
  VegetableItemData,
  SupplierData,
  DateQuotesMap,
  KitchenOrdersMap,
} from "@/lib/types";
import { runPerKitchenAllocation, formatVND } from "@/lib/optimizer";
import { generateZaloOrderText } from "@/lib/zalo";
import {
  Plus,
  Edit,
  Sparkles,
  Search,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

interface TabOrdersProps {
  workingDate: string;
  kitchens: KitchenData[];
  items: VegetableItemData[];
  suppliers: SupplierData[];
  dayQuotes: DateQuotesMap;
  kitchenOrders: KitchenOrdersMap;
  activeKitchenId: string;
  onSelectKitchen: (id: string) => void;
  onUpdateKitchenQty: (itemId: string, qty: number) => void;
  onClearCurrentKitchenOrder: () => void;
  onFillSampleOrders: () => void;
  onOpenKitchenModal: (kitchen: KitchenData | null) => void;
  onCommitOrders: () => Promise<void>;
  onNotify: (msg: string, type?: "default" | "warn") => void;
}

export function TabOrders({
  workingDate,
  kitchens,
  items,
  suppliers,
  dayQuotes,
  kitchenOrders,
  activeKitchenId,
  onSelectKitchen,
  onUpdateKitchenQty,
  onClearCurrentKitchenOrder,
  onFillSampleOrders,
  onOpenKitchenModal,
  onCommitOrders,
  onNotify,
}: TabOrdersProps) {
  const [itemSearch, setItemSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "ordered">("all");
  const [viewAllKitchens, setViewAllKitchens] = useState(false);
  const [committing, setCommitting] = useState(false);

  const activeKitchen =
    kitchens.find((k) => k.id === activeKitchenId) || kitchens[0] || {
      id: "k1",
      name: "Bếp A",
      note: "",
      color: "#059669",
    };

  // Run allocation engine
  const filterId = viewAllKitchens ? null : activeKitchen.id;
  const allocation = runPerKitchenAllocation(
    kitchens,
    items,
    suppliers,
    dayQuotes,
    kitchenOrders,
    filterId
  );

  // Left column items filtering
  const curOrders = kitchenOrders[activeKitchen.id] || {};
  const filteredItems = items.filter((it) => {
    if (!it.name.toLowerCase().includes(itemSearch.toLowerCase().trim()))
      return false;
    if (filterMode === "ordered" && !(parseFloat(String(curOrders[it.id])) > 0))
      return false;
    return true;
  });

  const handleCopyZalo = async (
    supplierId: string,
    specificKitchenId: string | null = null
  ) => {
    const text = generateZaloOrderText(
      allocation,
      supplierId,
      workingDate,
      specificKitchenId
    );
    if (!text) {
      onNotify("Không có mặt hàng nào của NCC này để sao chép", "warn");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      const sup = suppliers.find((s) => s.id === supplierId);
      onNotify(`Đã sao chép phiếu đặt hàng gửi ${sup ? sup.name : "NCC"}`);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      onNotify("Đã sao chép phiếu đặt hàng Zalo");
    }
  };

  const handleCommit = async () => {
    setCommitting(true);
    try {
      await onCommitOrders();
    } finally {
      setCommitting(false);
    }
  };

  // Build supplier PO cards data
  const validLines = allocation.lines.filter((l) => !l.unfulfilled);
  const supGroups: Record<
    string,
    {
      supplierId: string;
      supplierName: string;
      supplierPhone: string;
      supplierColor: string;
      kitchenBlocks: Record<
        string,
        {
          kitchenId: string;
          kitchenName: string;
          kitchenColor: string;
          kitchenNote: string;
          items: typeof validLines;
          subKg: number;
          subCost: number;
        }
      >;
      totalKg: number;
      totalCost: number;
    }
  > = {};

  validLines.forEach((l) => {
    if (!supGroups[l.supplierId]) {
      supGroups[l.supplierId] = {
        supplierId: l.supplierId,
        supplierName: l.supplierName,
        supplierPhone: l.supplierPhone,
        supplierColor: l.supplierColor,
        kitchenBlocks: {},
        totalKg: 0,
        totalCost: 0,
      };
    }
    const g = supGroups[l.supplierId];
    if (!g.kitchenBlocks[l.kitchenId]) {
      g.kitchenBlocks[l.kitchenId] = {
        kitchenId: l.kitchenId,
        kitchenName: l.kitchenName,
        kitchenColor: l.kitchenColor,
        kitchenNote: l.kitchenNote,
        items: [],
        subKg: 0,
        subCost: 0,
      };
    }
    g.kitchenBlocks[l.kitchenId].items.push(l);
    g.kitchenBlocks[l.kitchenId].subKg += l.qty;
    g.kitchenBlocks[l.kitchenId].subCost += l.totalPrice;
    g.totalKg += l.qty;
    g.totalCost += l.totalPrice;
  });

  return (
    <section className="animate-view space-y-6">
      {/* Top Kitchen Selector & Workflow Bar */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              1. Chọn Bếp Để Lên Đơn Riêng:
            </span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              Đặt bếp nào tối ưu riêng bếp đó — Tuyệt đối không gộp cộng dồn mặt
              hàng giữa các bếp
            </span>
          </div>

          {/* Kitchen Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {kitchens.map((k) => {
              const isSelected = k.id === activeKitchen.id;
              const ko = kitchenOrders[k.id] || {};
              let cnt = 0;
              let kg = 0;
              Object.values(ko).forEach((v) => {
                const n = parseFloat(String(v)) || 0;
                if (n > 0) {
                  cnt++;
                  kg += n;
                }
              });

              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onSelectKitchen(k.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition flex items-center gap-2 ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: k.color }}
                  />
                  <span>{k.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] tnum ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {cnt} món · {kg}kg
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenKitchenModal(null)}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thêm Bếp</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenKitchenModal(activeKitchen)}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Sửa Bếp Đang Chọn</span>
          </button>

          <button
            type="button"
            onClick={onFillSampleOrders}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Nạp đơn mẫu (Bếp A, B, C)</span>
          </button>
        </div>
      </div>

      {/* Split View: Left (Kitchen Order Input) & Right (Per-Kitchen Optimal Allocation & PO Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 Cols): Nhập số lượng rau củ riêng cho Bếp đang chọn */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-zinc-200 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeKitchen.color }}
                />
                <h3 className="text-sm font-bold text-zinc-950">
                  Đơn Đặt Hàng Riêng: {activeKitchen.name}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {activeKitchen.note ||
                  `Nhập số lượng mặt hàng cần mua riêng cho ${activeKitchen.name}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearCurrentKitchenOrder}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Xóa đơn bếp này</span>
            </button>
          </div>

          {/* Filter bar inside Left Column */}
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2">
            <div className="relative flex-grow">
              <Search className="w-3 h-3 absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Tìm rau củ..."
                className="w-full pl-7 pr-2.5 py-1 text-xs bg-white border border-zinc-200 rounded-md focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div className="inline-flex rounded-md bg-zinc-200/70 p-0.5 text-[11px] font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded transition ${
                  filterMode === "all"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("ordered")}
                className={`px-2.5 py-1 rounded transition ${
                  filterMode === "ordered"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Đang đặt
              </button>
            </div>
          </div>

          {/* Item Quantity Inputs List */}
          <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto p-2.5 space-y-1">
            {!filteredItems.length ? (
              <div className="py-10 text-center text-xs text-zinc-400">
                Không có mặt hàng nào phù hợp bộ lọc của {activeKitchen.name}.
              </div>
            ) : (
              filteredItems.map((item) => {
                const qty = parseFloat(String(curOrders[item.id])) || 0;
                let bestPrice = Infinity;
                let bestSupName = "";

                suppliers.forEach((s) => {
                  const q = dayQuotes[item.id]?.[s.id];
                  if (q && q.inStock && q.price < bestPrice) {
                    bestPrice = q.price;
                    bestSupName = s.name;
                  }
                });

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-3 transition ${
                      qty > 0
                        ? "bg-emerald-50/50 border border-emerald-200"
                        : "hover:bg-zinc-50 border border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 text-xs sm:text-sm">
                          {item.name}
                        </span>
                        {qty > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            {activeKitchen.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {bestPrice < Infinity ? (
                          <>
                            Giá tốt nhất:{" "}
                            <strong className="text-emerald-700 tnum">
                              {formatVND(bestPrice)}/{item.unit}
                            </strong>{" "}
                            ({bestSupName})
                          </>
                        ) : (
                          <span className="text-rose-600 font-medium">
                            Tất cả NCC hết hàng
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateKitchenQty(item.id, Math.max(0, qty - 5))
                        }
                        className="w-7 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold"
                      >
                        -
                      </button>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) =>
                            onUpdateKitchenQty(
                              item.id,
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className={`w-20 pl-2 pr-7 py-1 text-right text-xs sm:text-sm font-bold rounded-md border ${
                            qty > 0
                              ? "border-emerald-600 bg-white text-zinc-950"
                              : "border-zinc-200 bg-zinc-50 text-zinc-500"
                          } focus:outline-none focus:border-zinc-900 tnum`}
                        />
                        <span className="absolute right-2 top-1.5 text-[10px] text-zinc-400 pointer-events-none">
                          {item.unit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 5)}
                        className="w-7 h-7 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (7 Cols): Kết quả tối ưu riêng cho Bếp & Phiếu đặt hàng từng Nhà cung cấp */}
        <div className="lg:col-span-7 space-y-6">
          {/* Optimal Allocation Table (Separate per Kitchen) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-950">
                    {viewAllKitchens
                      ? "Bảng Phân Bổ Tối Ưu (Tất Cả Bếp - Tách Dòng)"
                      : `Bảng Phân Bổ NCC Tối Ưu Cho Riêng ${activeKitchen.name}`}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tự động chọn NCC rẻ nhất còn hàng; nếu NCC rẻ nhất hết hàng sẽ
                  chuyển sang NCC rẻ kế tiếp
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewAllKitchens(!viewAllKitchens)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition"
                >
                  {viewAllKitchens
                    ? `Chỉ xem ${activeKitchen.name}`
                    : "Xem tất cả bếp (Tách dòng)"}
                </button>

                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={committing || !validLines.length}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {committing ? "Đang lưu..." : "Chốt Đơn Lưu Báo Cáo"}
                  </span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Bếp</th>
                    <th className="py-2.5 px-4">Mặt hàng</th>
                    <th className="py-2.5 px-3 text-right">SL đặt</th>
                    <th className="py-2.5 px-4">NCC được chọn</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-4 text-right">Thành tiền</th>
                    <th className="py-2.5 px-4">Lý do phân bổ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs">
                  {!allocation.lines.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-zinc-400"
                      >
                        Chưa có mặt hàng nào được đặt cho phạm vi đang chọn.
                      </td>
                    </tr>
                  ) : (
                    allocation.lines.map((l, idx) => {
                      const badgeStyles = {
                        best: "bg-emerald-50 text-emerald-800 border-emerald-200",
                        fallback: "bg-amber-50 text-amber-800 border-amber-200",
                        error: "bg-rose-50 text-rose-800 border-rose-200",
                      };

                      return (
                        <tr key={idx} className="hover:bg-zinc-50/80">
                          <td className="py-2.5 px-4">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white"
                              style={{ backgroundColor: l.kitchenColor }}
                            >
                              {l.kitchenName}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-zinc-900">
                            {l.itemName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-zinc-900 tnum">
                            {l.qty} {l.unit}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-1.5 font-medium text-zinc-800">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: l.supplierColor }}
                              />
                              <span>{l.supplierName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-600 tnum">
                            {l.unfulfilled ? "-" : formatVND(l.unitPrice)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-emerald-700 tnum">
                            {l.unfulfilled ? "-" : formatVND(l.totalPrice)}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${
                                badgeStyles[l.badgeType]
                              }`}
                            >
                              {l.note}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Purchase Order Cards (Phiếu Đặt Hàng Từng NCC - Tách Riêng Từng Bếp) */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs p-4 sm:p-5 space-y-4">
            <div className="border-b border-zinc-100 pb-3.5">
              <h3 className="text-sm font-bold text-zinc-950">
                Phiếu Đặt Hàng Gửi Từng Nhà Cung Cấp (Tách Riêng Từng Bếp)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Mỗi bếp được lập thành khối đơn riêng biệt để nhà cung cấp cân
                đóng gói giao đúng cổng/bếp, tuyệt đối không gộp chung
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!Object.keys(supGroups).length ? (
                <div className="col-span-full py-8 text-center text-xs text-zinc-400">
                  Nhập số lượng mặt hàng bên trái để hệ thống tự động tạo Phiếu
                  Đặt Hàng Nhà Cung Cấp.
                </div>
              ) : (
                Object.values(supGroups).map((g) => {
                  const kBlocks = Object.values(g.kitchenBlocks);

                  return (
                    <div
                      key={g.supplierId}
                      className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-3">
                        {/* Supplier Card Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: g.supplierColor }}
                            />
                            <div>
                              <h4 className="text-xs font-bold text-zinc-950">
                                {g.supplierName}
                              </h4>
                              <span className="text-[11px] text-zinc-500 tnum">
                                Zalo: {g.supplierPhone}
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-zinc-200 text-zinc-700">
                            {kBlocks.length} đơn bếp riêng
                          </span>
                        </div>

                        {/* Separate Kitchen Blocks inside Supplier Card */}
                        <div className="space-y-2.5">
                          {kBlocks.map((kb) => (
                            <div
                              key={kb.kitchenId}
                              className="bg-white rounded-lg border border-zinc-200 p-3"
                            >
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                                    style={{
                                      backgroundColor: kb.kitchenColor,
                                    }}
                                  >
                                    ĐƠN RIÊNG: {kb.kitchenName}
                                  </span>
                                  <span className="text-[11px] text-zinc-400 tnum">
                                    {kb.items.length} món ({kb.subKg}kg)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyZalo(g.supplierId, kb.kitchenId)
                                  }
                                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy riêng {kb.kitchenName}</span>
                                </button>
                              </div>

                              <div className="space-y-1 text-xs">
                                {kb.items.map((it, iIdx) => (
                                  <div
                                    key={iIdx}
                                    className="flex items-center justify-between text-zinc-700"
                                  >
                                    <span>{it.itemName}</span>
                                    <span className="font-semibold text-zinc-900 tnum">
                                      {it.qty} {it.unit} ×{" "}
                                      {it.unitPrice.toLocaleString("vi-VN")}đ ={" "}
                                      {it.totalPrice.toLocaleString("vi-VN")}đ
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                                <span className="text-zinc-400">
                                  Cộng riêng {kb.kitchenName}:
                                </span>
                                <span className="font-bold text-zinc-900 tnum">
                                  {formatVND(kb.subCost)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-2.5 border-t border-zinc-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            Tổng thanh toán NCC ({g.totalKg} kg):
                          </span>
                          <span className="font-bold text-sm text-emerald-700 tnum">
                            {formatVND(g.totalCost)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyZalo(g.supplierId, null)}
                          className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            Copy phiếu Zalo gửi {g.supplierName} (Toàn bộ)
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
