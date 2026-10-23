"use client";

import React, { useState } from "react";
import {
  KitchenData,
  VegetableItemData,
  SupplierData,
  DateQuotesMap,
  KitchenOrdersMap,
} from "@/lib/types";
import { formatVND } from "@/lib/optimizer";
import {
  Plus,
  Minus,
  Search,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface TabOrdersProps {
  workingDate: string;
  kitchens: KitchenData[];
  items: VegetableItemData[];
  suppliers: SupplierData[];
  dayQuotes: DateQuotesMap;
  kitchenOrders: KitchenOrdersMap;
  activeKitchenId: string;
  lockedKitchenId?: string | null;
  onSelectKitchen: (id: string) => void;
  onUpdateKitchenQty: (itemId: string, qty: number) => void;
  onClearCurrentKitchenOrder: () => void;
  onFillSampleOrders: () => void;
  onOpenKitchenModal: (kitchen: KitchenData | null) => void;
  onCommitOrders: () => Promise<void>;
  onNotify: (msg: string, type?: "default" | "warn") => void;
  onProceedToPo: () => void;
  onBackToQuotes: () => void;
}

export function TabOrders({
  workingDate,
  kitchens,
  items,
  suppliers,
  dayQuotes,
  kitchenOrders,
  activeKitchenId,
  lockedKitchenId = null,
  onSelectKitchen,
  onUpdateKitchenQty,
  onClearCurrentKitchenOrder,
  onFillSampleOrders,
  onOpenKitchenModal,
  onCommitOrders,
  onNotify,
  onProceedToPo,
  onBackToQuotes,
}: TabOrdersProps) {
  const [itemSearch, setItemSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "ordered">("all");
  const [committing, setCommitting] = useState(false);

  const effectiveKitchenId = lockedKitchenId || activeKitchenId;
  const displayedKitchens = lockedKitchenId
    ? kitchens.filter((k) => k.id === lockedKitchenId)
    : kitchens;

  const activeKitchen =
    kitchens.find((k) => k.id === effectiveKitchenId) || kitchens[0] || {
      id: "k1",
      name: "Bếp A",
      note: "",
      color: "#059669",
    };

  const curOrders = kitchenOrders[activeKitchen.id] || {};

  const filteredItems = items.filter((it) => {
    if (!it.name.toLowerCase().includes(itemSearch.toLowerCase().trim()))
      return false;
    if (filterMode === "ordered" && !(parseFloat(String(curOrders[it.id])) > 0))
      return false;
    return true;
  });

  // Calculate totals across all kitchens
  let totalAllKg = 0;
  let totalAllItemsCount = 0;
  Object.values(kitchenOrders).forEach((ko) => {
    Object.values(ko).forEach((val) => {
      const n = parseFloat(String(val)) || 0;
      if (n > 0) {
        totalAllKg += n;
        totalAllItemsCount++;
      }
    });
  });

  // Calculate totals for active kitchen
  let curKitchenKg = 0;
  let curKitchenItemsCount = 0;
  Object.values(curOrders).forEach((val) => {
    const n = parseFloat(String(val)) || 0;
    if (n > 0) {
      curKitchenKg += n;
      curKitchenItemsCount++;
    }
  });

  const handleCommitAndProceed = async () => {
    const requiredKg = lockedKitchenId ? curKitchenKg : totalAllKg;
    if (requiredKg <= 0) {
      onNotify("Vui lòng nhập số lượng cho ít nhất 1 mặt hàng", "warn");
      return;
    }

    setCommitting(true);
    try {
      await onCommitOrders();
      onNotify("Đã chốt đơn thành công!");
      onProceedToPo();
    } catch {
      onNotify("Lỗi khi lưu đơn hàng", "warn");
      onProceedToPo();
    } finally {
      setCommitting(false);
    }
  };

  return (
    <section className="animate-view space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* iOS Segmented Kitchen Selector */}
      <div className="ios-card p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#1C1C1E] tracking-tight">
              {lockedKitchenId ? `Đặt Hàng - ${activeKitchen.name}` : "Đặt Hàng Từng Bếp"}
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {lockedKitchenId
                ? `Nhập số lượng thực phẩm đặt cho ${activeKitchen.name}`
                : "Chọn bếp để lên số lượng riêng biệt, không gộp chung"}
            </p>
          </div>

          {!lockedKitchenId && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onFillSampleOrders}
                className="px-2.5 py-1.5 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] text-xs font-semibold transition active:scale-95 flex items-center gap-1"
                title="Điền mẫu"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF9500]" />
                <span className="hidden sm:inline">Điền mẫu</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenKitchenModal(null)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-[#34C759] hover:bg-[#28CD41] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thêm Bếp</span>
              </button>
            </div>
          )}
        </div>

        {/* Cupertino Segmented Tabs for Kitchens */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {displayedKitchens.map((k) => {
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
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 active:scale-95 ${
                  isSelected
                    ? "bg-[#1C1C1E] text-white shadow-sm"
                    : "bg-[#767680]/12 text-[#1C1C1E] hover:bg-[#767680]/20"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: k.color }}
                />
                <span>{k.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tnum ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#8E8E93]"
                  }`}
                >
                  {cnt} món · {kg}kg
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Order List for Selected Kitchen */}
      <div className="space-y-3">
        {/* Controls: Active Kitchen title, search, and filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeKitchen.color }}
            />
            <h3 className="font-extrabold text-sm text-[#1C1C1E]">
              {activeKitchen.name}
            </h3>
            {activeKitchen.note && (
              <span className="text-xs text-[#8E8E93] truncate max-w-[140px]">
                ({activeKitchen.note})
              </span>
            )}
            <span className="text-xs text-[#248A3D] font-bold bg-[#34C759]/15 px-2 py-0.5 rounded-full ml-1">
              {curKitchenItemsCount} món · {curKitchenKg}kg
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E8E93]" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Tìm món..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#3C3C43]/15 rounded-full focus:outline-none focus:border-[#34C759] shadow-2xs"
              />
            </div>

            {/* iOS Filter Pill */}
            <div className="flex items-center bg-[#767680]/12 p-0.5 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-full transition ${
                  filterMode === "all"
                    ? "bg-white text-[#1C1C1E] font-bold shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("ordered")}
                className={`px-2.5 py-1 rounded-full transition ${
                  filterMode === "ordered"
                    ? "bg-white text-[#1C1C1E] font-bold shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Đã đặt ({curKitchenItemsCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onClearCurrentKitchenOrder}
              className="p-1.5 rounded-full bg-white border border-[#3C3C43]/15 text-[#8E8E93] hover:text-[#FF3B30] transition"
              title="Xóa hết đơn bếp này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Product Items: iOS Inset Grouped Rows */}
        <div className="ios-card overflow-hidden divide-y divide-[#3C3C43]/10">
          {!filteredItems.length ? (
            <div className="py-12 text-center text-xs text-[#8E8E93]">
              Không có mặt hàng nào phù hợp bộ lọc.
            </div>
          ) : (
            filteredItems.map((item) => {
              const qty = curOrders[item.id] || 0;
              const hasQty = qty > 0;

              // Find cheapest in-stock supplier for preview
              const itemQuotes = dayQuotes[item.id] || {};
              let minPrice = Infinity;
              let bestSupName = "";
              suppliers.forEach((s) => {
                const q = itemQuotes[s.id];
                if (q && q.inStock && q.price < minPrice) {
                  minPrice = q.price;
                  bestSupName = s.name;
                }
              });

              return (
                <div
                  key={item.id}
                  className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    hasQty ? "bg-[#34C759]/[0.04]" : "hover:bg-black/[0.015]"
                  }`}
                >
                  {/* Left: Item Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C1C1E] text-sm">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-[#8E8E93] font-mono bg-[#767680]/10 px-2 py-0.5 rounded-full">
                        /{item.unit}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-2">
                      {bestSupName ? (
                        <span>
                          Dự kiến:{" "}
                          <strong className="text-[#34C759] font-bold">
                            {formatVND(minPrice)}
                          </strong>{" "}
                          ({bestSupName})
                        </span>
                      ) : (
                        <span className="text-[#FF3B30]">Hết hàng</span>
                      )}
                    </div>
                  </div>

                  {/* Right: iOS Stepper Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 5)}
                        className="px-2 py-1 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] text-[11px] font-bold transition active:scale-95"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 10)}
                        className="px-2 py-1 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] text-[11px] font-bold transition active:scale-95"
                      >
                        +10
                      </button>
                    </div>

                    {/* Authentic iOS Stepper */}
                    <div className="flex items-center bg-[#F2F2F7] rounded-xl border border-black/5 p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateKitchenQty(item.id, Math.max(0, qty - 1))
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1C1C1E] hover:bg-white active:scale-90 transition font-bold"
                        title="Giảm 1kg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={qty === 0 ? "" : qty}
                        onChange={(e) =>
                          onUpdateKitchenQty(
                            item.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="w-12 h-8 text-center text-xs font-bold text-[#1C1C1E] focus:outline-none tnum bg-transparent"
                      />

                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1C1C1E] hover:bg-white active:scale-90 transition font-bold"
                        title="Tăng 1kg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs text-[#8E8E93] font-medium w-6">
                      {item.unit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* iOS Floating Action Button (Step 2 -> Step 3) */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToQuotes}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white border border-[#3C3C43]/15 hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Xem Báo Giá (B1)</span>
        </button>

        <button
          type="button"
          disabled={committing || totalAllKg <= 0}
          onClick={handleCommitAndProceed}
          className={`w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base transition flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(52,199,89,0.35)] active:scale-98 ${
            totalAllKg > 0
              ? "bg-[#34C759] hover:bg-[#28CD41] text-white cursor-pointer"
              : "bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed shadow-none"
          }`}
        >
          {committing ? (
            <span>Đang tối ưu phân bổ...</span>
          ) : (
            <>
              <span>Chốt Đơn (Tạo Phiếu Zalo Bước 3)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}
