"use client";

import React, { useState } from "react";
import { SupplierData, VegetableItemData, DateQuotesMap } from "@/lib/types";
import {
  Plus,
  Search,
  Copy,
  Shuffle,
  Trash2,
  LogIn,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

interface TabQuotesProps {
  workingDate: string;
  suppliers: SupplierData[];
  items: VegetableItemData[];
  dayQuotes: DateQuotesMap;
  onUpdateQuote: (
    itemId: string,
    supplierId: string,
    price?: number,
    inStock?: boolean
  ) => Promise<void>;
  onCopyAllYesterday: () => Promise<void>;
  onRandomizeMarket: () => void;
  onEnterSupplierPortal: (supplierId: string) => void;
  onOpenSupplierModal: (supplier: SupplierData | null) => void;
  onDeleteSupplier: (supplier: SupplierData) => void;
  onOpenAddItemModal: () => void;
  onDeleteItem: (item: VegetableItemData) => void;
  onProceedToOrders?: () => void;
}

export function TabQuotes({
  workingDate,
  suppliers,
  items,
  dayQuotes,
  onUpdateQuote,
  onCopyAllYesterday,
  onRandomizeMarket,
  onEnterSupplierPortal,
  onOpenSupplierModal,
  onDeleteSupplier,
  onOpenAddItemModal,
  onDeleteItem,
  onProceedToOrders,
}: TabQuotesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <section className="animate-view space-y-5 pb-24 sm:pb-28 max-w-full overflow-x-hidden">
      {/* Step Header & Supplier Directory */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950">
                Bước 1: Báo Giá & Tình Trạng Hàng Các Nhà Cung Cấp
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Xem giá và tình trạng còn/hết hàng theo ngày:{" "}
              <strong className="text-zinc-800">{workingDate}</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenSupplierModal(null)}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>

        {/* Compact Supplier Chips (Fit Screen, No Blowout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/60 hover:bg-white transition flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: sup.color }}
                />
                <div className="min-w-0">
                  <div className="font-bold text-zinc-950 text-xs truncate">
                    {sup.name}
                  </div>
                  {sup.phone ? (
                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                      {sup.phone}
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-400">Đầu mối rau</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEnterSupplierPortal(sup.id)}
                  className="px-2 py-1 rounded text-[10px] font-semibold bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 transition flex items-center gap-1"
                  title="Vào cổng nhập giá riêng của NCC này"
                >
                  <LogIn className="w-2.5 h-2.5 text-zinc-500" />
                  <span>Cổng NCC</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSupplier(sup)}
                  className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Xóa nhà cung cấp"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item Price Matrix Section */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Controls: Search, Tools & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mặt hàng rau củ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCopyAllYesterday}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
              title="Sao chép toàn bộ bảng giá ngày hôm qua sang hôm nay"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Sao chép hôm qua</span>
              <span className="sm:hidden">Hôm qua</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddItemModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Món</span>
            </button>

            {/* View Mode Toggle: Card vs Table (Hidden on small mobile) */}
            <div className="hidden md:flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "cards"
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Hiển thị dạng thẻ (thân thiện di động)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition ${
                  viewMode === "table"
                    ? "bg-white text-zinc-950 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
                title="Hiển thị dạng bảng ngang"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* --- VIEW MODE 1: MOBILE APP CARDS (100% WIDTH, ZERO HORIZONTAL OVERFLOW) --- */}
        {viewMode === "cards" || typeof window !== "undefined" ? (
          <div className="space-y-3">
            {!filteredItems.length ? (
              <div className="py-10 text-center text-xs text-zinc-400">
                Không tìm thấy mặt hàng rau củ nào.
              </div>
            ) : (
              filteredItems.map((item) => {
                const itemQuotes = dayQuotes[item.id] || {};
                let minPrice = Infinity;
                let cheapestSupplier: SupplierData | null = null;

                suppliers.forEach((s) => {
                  const q = itemQuotes[s.id];
                  if (q && q.inStock && q.price < minPrice) {
                    minPrice = q.price;
                    cheapestSupplier = s;
                  }
                });

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 transition space-y-3 shadow-2xs max-w-full overflow-hidden"
                  >
                    {/* Item Card Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-zinc-950 text-sm truncate">
                            {item.name}
                          </h3>
                          <span className="text-[11px] text-zinc-500 font-mono bg-zinc-100 px-1.5 py-0.2 rounded shrink-0">
                            /{item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cheapestSupplier ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Rẻ nhất: {minPrice.toLocaleString("vi-VN")}đ (
                            {(cheapestSupplier as SupplierData).name})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Hết hàng tất cả NCC
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 transition"
                          title="Xóa mặt hàng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Suppliers Price & In-Stock List for this Item */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {suppliers.map((sup) => {
                        const q = itemQuotes[sup.id] || {
                          price: item.basePrice,
                          inStock: true,
                        };
                        const active = q.inStock;
                        const isCheapest = active && q.price === minPrice;

                        return (
                          <div
                            key={sup.id}
                            className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 ${
                              isCheapest
                                ? "bg-emerald-50/50 border-emerald-300"
                                : !active
                                ? "bg-zinc-50 border-zinc-200 opacity-60"
                                : "bg-white border-zinc-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: sup.color }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-zinc-900 truncate">
                                  {sup.name}
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                  {isCheapest
                                    ? "★ Giá tốt nhất"
                                    : active
                                    ? "Đang cung cấp"
                                    : "Tạm hết hàng"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Quick In-Stock Toggle Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuote(
                                    item.id,
                                    sup.id,
                                    undefined,
                                    !active
                                  )
                                }
                                className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                                  active
                                    ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                {active ? "Còn" : "Hết"}
                              </button>

                              {/* Price Input */}
                              <div className="flex items-center border border-zinc-200 rounded px-1.5 py-0.5 bg-white w-24">
                                <input
                                  type="number"
                                  value={q.price}
                                  onChange={(e) =>
                                    onUpdateQuote(
                                      item.id,
                                      sup.id,
                                      parseFloat(e.target.value) || 0,
                                      undefined
                                    )
                                  }
                                  className="w-full text-xs font-semibold text-right text-zinc-900 focus:outline-none tnum"
                                  step="500"
                                />
                                <span className="text-[10px] text-zinc-400 ml-1">
                                  đ
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
      </div>

      {/* Sticky Bottom Action Bar for Step 1 */}
      {onProceedToOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:p-4 shadow-lg">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-zinc-500 hidden sm:inline">
                Đã kiểm tra báo giá:{" "}
              </span>
              <strong className="text-zinc-950 font-bold">
                {items.length} mặt hàng
              </strong>
              <span className="text-zinc-400 ml-1.5 hidden sm:inline">
                • {suppliers.length} nhà cung cấp
              </span>
            </div>

            <button
              type="button"
              onClick={onProceedToOrders}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Tiến Hành Đặt Hàng (Bước 2)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
