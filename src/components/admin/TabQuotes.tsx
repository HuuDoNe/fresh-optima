"use client";

import React, { useState } from "react";
import { SupplierData, VegetableItemData, DateQuotesMap } from "@/lib/types";
import {
  Plus,
  Search,
  Copy,
  Trash2,
  LogIn,
  Phone,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Tag,
  Check,
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
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers[0]?.id || ""
  );
  const [searchTerm, setSearchTerm] = useState("");

  const activeSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <section className="animate-view space-y-5 pb-24 sm:pb-28 max-w-full overflow-x-hidden">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-900 text-white text-[11px] font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950">
                Bước 1: Xem Báo Giá Theo Nhà Cung Cấp
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Nhấn vào tên nhà cung cấp để xem bảng giá, tình trạng còn/hết hàng ngày:{" "}
              <strong className="text-zinc-800">{workingDate}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onCopyAllYesterday}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
              title="Sao chép toàn bộ giá từ ngày hôm trước"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Sao chép hôm qua</span>
              <span className="sm:hidden">Hôm qua</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenSupplierModal(null)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm NCC</span>
            </button>
          </div>
        </div>

        {/* 1. SUPPLIER SELECTION TABS: Click Supplier to reveal their price list */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Chọn Nhà Cung Cấp Để Xem Báo Giá:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {suppliers.map((sup) => {
              const isSelected = sup.id === activeSupplier?.id;
              // Count how many items in stock for this supplier
              let inStockCount = 0;
              items.forEach((it) => {
                const q = dayQuotes[it.id]?.[sup.id];
                if (q?.inStock) inStockCount++;
              });

              return (
                <button
                  key={sup.id}
                  type="button"
                  onClick={() => setSelectedSupplierId(sup.id)}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 shadow-2xs cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-900/10 scale-102"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: sup.color }}
                  />
                  <span>{sup.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] tnum ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {inStockCount}/{items.length} món còn
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. ACTIVE SUPPLIER DETAILS & PRODUCT LIST */}
      {activeSupplier && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-4">
          {/* Supplier Header & Search Box */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeSupplier.color }}
                />
                <div>
                  <h3 className="font-bold text-zinc-950 text-sm sm:text-base">
                    Báo Giá: {activeSupplier.name}
                  </h3>
                  {activeSupplier.phone && (
                    <a
                      href={`tel:${activeSupplier.phone}`}
                      className="text-xs text-zinc-400 hover:text-emerald-700 flex items-center gap-1 font-mono"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{activeSupplier.phone}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEnterSupplierPortal(activeSupplier.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1"
                  title="Vào giao diện độc lập của nhà cung cấp này"
                >
                  <LogIn className="w-3 h-3 text-emerald-600" />
                  <span className="hidden sm:inline">Cổng NCC</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSupplier(activeSupplier)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Xóa nhà cung cấp này"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Search & Add Item */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
                />
              </div>

              <button
                type="button"
                onClick={onOpenAddItemModal}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Món</span>
              </button>
            </div>
          </div>

          {/* Product Items List: Product | Status (Còn/Hết) | Price */}
          <div className="space-y-2.5">
            {!filteredItems.length ? (
              <div className="py-10 text-center text-xs text-zinc-400">
                Không tìm thấy sản phẩm nào.
              </div>
            ) : (
              filteredItems.map((item) => {
                const q = dayQuotes[item.id]?.[activeSupplier.id] || {
                  price: item.basePrice,
                  inStock: true,
                };
                const inStock = q.inStock;

                return (
                  <div
                    key={item.id}
                    className={`p-3 sm:p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      inStock
                        ? "bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs"
                        : "bg-zinc-50 border-zinc-200 opacity-70"
                    }`}
                  >
                    {/* Left: Product Name & Unit */}
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-bold text-zinc-950 text-sm truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono bg-zinc-100 px-1.5 py-0.2 rounded shrink-0">
                          /{item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 rounded text-zinc-300 hover:text-rose-600 sm:hidden transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Right: Status (Còn / Hết) & Price Input */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Trạng thái (Còn / Hết) Toggle Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuote(
                            item.id,
                            activeSupplier.id,
                            undefined,
                            !inStock
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          inStock
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {inStock ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Còn hàng</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                            <span>Hết hàng</span>
                          </>
                        )}
                      </button>

                      {/* Giá sản phẩm (Unit Price Input) */}
                      <div className="flex items-center border border-zinc-300 rounded-lg px-2 py-1 bg-white focus-within:border-zinc-500 shadow-2xs">
                        <span className="text-[11px] text-zinc-400 mr-1.5 hidden sm:inline">
                          Đơn giá:
                        </span>
                        <input
                          type="number"
                          step="500"
                          value={q.price}
                          onChange={(e) =>
                            onUpdateQuote(
                              item.id,
                              activeSupplier.id,
                              parseFloat(e.target.value) || 0,
                              undefined
                            )
                          }
                          className="w-20 sm:w-24 text-right text-xs font-bold text-zinc-950 focus:outline-none tnum"
                        />
                        <span className="text-xs text-zinc-500 font-semibold ml-1">
                          đ/{item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 rounded text-zinc-300 hover:text-rose-600 hidden sm:block transition"
                        title="Xóa món này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar for Step 1 */}
      {onProceedToOrders && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:p-4 shadow-lg">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-zinc-500 hidden sm:inline">
                Đang xem báo giá:{" "}
              </span>
              <strong className="text-zinc-950 font-bold">
                {activeSupplier ? activeSupplier.name : "Nhà cung cấp"}
              </strong>
              <span className="text-zinc-400 ml-1.5 hidden sm:inline">
                • {items.length} sản phẩm
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
