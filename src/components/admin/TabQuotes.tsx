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
  Tag,
  Check,
} from "lucide-react";
import { IosSwitch } from "@/components/common/IosSwitch";

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
    <section className="animate-view space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* iOS Segmented Supplier Selector */}
      <div className="ios-card p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#1C1C1E] tracking-tight">
              Báo Giá Nhà Cung Cấp
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Chọn NCC để xem và điều chỉnh báo giá sản phẩm
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onCopyAllYesterday}
              className="px-2.5 py-1.5 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] text-xs font-semibold transition active:scale-95 flex items-center gap-1"
              title="Sao chép toàn bộ giá từ ngày hôm trước"
            >
              <Copy className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span className="hidden sm:inline">Sao chép hôm qua</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSupplierModal(null)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-[#34C759] hover:bg-[#28CD41] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm NCC</span>
            </button>
          </div>
        </div>

        {/* Cupertino Segmented Tabs for Suppliers */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {suppliers.map((sup) => {
            const isSelected = sup.id === activeSupplier?.id;
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
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-150 flex items-center gap-2 shrink-0 active:scale-95 ${
                  isSelected
                    ? "bg-[#1C1C1E] text-white shadow-sm"
                    : "bg-[#767680]/12 text-[#1C1C1E] hover:bg-[#767680]/20"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: sup.color }}
                />
                <span>{sup.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tnum ${
                    isSelected ? "bg-white/20 text-white" : "bg-black/5 text-[#8E8E93]"
                  }`}
                >
                  {inStockCount}/{items.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Supplier Products List (iOS Inset Grouped) */}
      {activeSupplier && (
        <div className="space-y-3">
          {/* Supplier Info Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-[#1C1C1E]">
                  {activeSupplier.name}
                </span>
                {activeSupplier.phone && (
                  <a
                    href={`tel:${activeSupplier.phone}`}
                    className="text-xs text-[#007AFF] font-mono flex items-center gap-1"
                  >
                    <Phone className="w-2.5 h-2.5" />
                    <span>{activeSupplier.phone}</span>
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEnterSupplierPortal(activeSupplier.id)}
                  className="px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                  title="Cổng NCC"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Cổng NCC</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteSupplier(activeSupplier)}
                  className="p-1 rounded-full text-[#8E8E93] hover:text-[#FF3B30] transition"
                  title="Xóa NCC"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* iOS Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E8E93]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm sản phẩm..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#3C3C43]/15 rounded-full focus:outline-none focus:border-[#34C759] shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={onOpenAddItemModal}
                className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Món</span>
              </button>
            </div>
          </div>

          {/* iOS Inset Grouped Product Rows */}
          <div className="ios-card overflow-hidden divide-y divide-[#3C3C43]/10">
            {!filteredItems.length ? (
              <div className="py-12 text-center text-xs text-[#8E8E93]">
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
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.015] transition"
                  >
                    {/* Left: Product Name & Unit */}
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-4 h-4 text-[#8E8E93] shrink-0" />
                        <span className="font-bold text-[#1C1C1E] text-sm truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-[#8E8E93] font-mono bg-[#767680]/10 px-2 py-0.5 rounded-full shrink-0">
                          /{item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 rounded text-[#8E8E93] hover:text-[#FF3B30] sm:hidden transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Right: iOS Switch (Còn/Hết) & Price Input */}
                    <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0">
                      {/* Authentic Cupertino Green Toggle Slider */}
                      <IosSwitch
                        checked={inStock}
                        onChange={(val) =>
                          onUpdateQuote(
                            item.id,
                            activeSupplier.id,
                            undefined,
                            val
                          )
                        }
                      />

                      {/* Price Pill */}
                      <div className="flex items-center bg-[#F2F2F7] rounded-xl px-2.5 py-1 border border-black/5 focus-within:border-[#34C759] focus-within:bg-white shadow-2xs">
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
                          className="w-20 sm:w-24 text-right text-xs font-bold text-[#1C1C1E] focus:outline-none tnum"
                        />
                        <span className="text-xs text-[#8E8E93] font-semibold ml-1">
                          đ/{item.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 rounded text-[#8E8E93] hover:text-[#FF3B30] hidden sm:block transition"
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

      {/* iOS Floating Action Button (Step 1 -> Step 2) */}
      {onProceedToOrders && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onProceedToOrders}
            className="w-full bg-[#34C759] hover:bg-[#28CD41] active:scale-98 text-white font-bold text-sm sm:text-base py-3.5 px-5 rounded-2xl shadow-[0_4px_16px_rgba(52,199,89,0.35)] flex items-center justify-center gap-2 transition"
          >
            <span>Tiến Hành Đặt Hàng (Bước 2)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
