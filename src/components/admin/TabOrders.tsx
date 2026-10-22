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
  CheckCircle2,
  Utensils,
  Layers,
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

  const activeKitchen =
    kitchens.find((k) => k.id === activeKitchenId) || kitchens[0] || {
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
    if (totalAllKg <= 0) {
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
    <section className="animate-view space-y-5 pb-24 sm:pb-28 max-w-full overflow-x-hidden">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950">
                Bước 2: Đặt Hàng Từng Bếp (Tối Ưu Riêng Biệt)
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Chọn bếp bên dưới để lên số lượng. Đặt bếp nào sẽ tối ưu riêng bếp đó, tuyệt đối không gộp cộng dồn.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onFillSampleOrders}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition flex items-center gap-1.5"
              title="Điền dữ liệu mẫu kiểm thử nhanh"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Điền mẫu</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenKitchenModal(null)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Bếp</span>
            </button>
          </div>
        </div>

        {/* Touch-Friendly Kitchen Selector Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Chọn bếp để lên đơn:
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-xs ring-2 ring-zinc-900/10"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
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
      </div>

      {/* Item Order Entry List for Current Kitchen */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Active Kitchen Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: activeKitchen.color }}
            />
            <h3 className="font-bold text-zinc-950 text-sm">
              Đơn hàng: {activeKitchen.name}
            </h3>
            {activeKitchen.note && (
              <span className="text-xs text-zinc-400">
                ({activeKitchen.note})
              </span>
            )}
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md ml-1">
              {curKitchenItemsCount} món · {curKitchenKg}kg
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Tìm món..."
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400 w-36 sm:w-44"
              />
            </div>

            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterMode === "all"
                    ? "bg-white text-zinc-950 font-bold shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("ordered")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterMode === "ordered"
                    ? "bg-white text-zinc-950 font-bold shadow-2xs"
                    : "text-zinc-600"
                }`}
              >
                Đã đặt ({curKitchenItemsCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onClearCurrentKitchenOrder}
              className="p-1.5 rounded-lg border border-zinc-200 hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition"
              title="Xóa hết số lượng của bếp này"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* List of Item Cards for This Kitchen */}
        <div className="space-y-2.5">
          {!filteredItems.length ? (
            <div className="py-10 text-center text-xs text-zinc-400">
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
                  className={`p-3 sm:p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasQty
                      ? "bg-emerald-50/30 border-emerald-300 shadow-2xs"
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {/* Item Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-950 text-sm">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.2 rounded">
                        /{item.unit}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-2">
                      {bestSupName ? (
                        <span>
                          Dự kiến:{" "}
                          <strong className="text-emerald-700">
                            {formatVND(minPrice)}
                          </strong>{" "}
                          ({bestSupName})
                        </span>
                      ) : (
                        <span className="text-rose-600">
                          Hết hàng toàn bộ NCC
                        </span>
                      )}
                      {hasQty && (
                        <span className="text-zinc-900 font-semibold">
                          • Thành tiền: {formatVND(qty * (minPrice < Infinity ? minPrice : item.basePrice))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper Controls (Touch Optimized) */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 5)}
                        className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 10)}
                        className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold transition"
                      >
                        +10
                      </button>
                    </div>

                    {/* Stepper with - and + */}
                    <div className="flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateKitchenQty(item.id, Math.max(0, qty - 1))
                        }
                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition active:bg-zinc-200"
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
                        className="w-14 h-8 text-center text-xs font-bold text-zinc-950 focus:outline-none tnum border-x border-zinc-200"
                      />

                      <button
                        type="button"
                        onClick={() => onUpdateKitchenQty(item.id, qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition active:bg-zinc-200"
                        title="Tăng 1kg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs text-zinc-400 font-medium w-6">
                      {item.unit}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Step 2 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToQuotes}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5"
              title="Quay lại Bước 1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Xem Báo Giá (B1)</span>
            </button>

            <div className="text-xs">
              <span className="text-zinc-500 hidden sm:inline">Tổng các bếp: </span>
              <strong className="text-zinc-950 font-bold tnum">
                {totalAllItemsCount} món · {totalAllKg} kg
              </strong>
            </div>
          </div>

          <button
            type="button"
            disabled={committing || totalAllKg <= 0}
            onClick={handleCommitAndProceed}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm ${
              totalAllKg > 0
                ? "bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            }`}
          >
            {committing ? (
              <span>Đang tính toán tối ưu...</span>
            ) : (
              <>
                <span>Chốt Đơn (Tạo Phiếu Zalo Bước 3)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
