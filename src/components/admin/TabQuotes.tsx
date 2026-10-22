"use client";

import React, { useState } from "react";
import { SupplierData, VegetableItemData, DateQuotesMap } from "@/lib/types";
import {
  Plus,
  Search,
  Copy,
  Shuffle,
  Trash2,
  Edit,
  LogIn,
  Phone,
} from "lucide-react";

interface TabQuotesProps {
  workingDate: string;
  suppliers: SupplierData[];
  items: VegetableItemData[];
  dayQuotes: DateQuotesMap;
  onUpdateQuote: (itemId: string, supplierId: string, price?: number, inStock?: boolean) => Promise<void>;
  onCopyAllYesterday: () => Promise<void>;
  onRandomizeMarket: () => void;
  onEnterSupplierPortal: (supplierId: string) => void;
  onOpenSupplierModal: (supplier: SupplierData | null) => void;
  onDeleteSupplier: (supplier: SupplierData) => void;
  onOpenAddItemModal: () => void;
  onDeleteItem: (item: VegetableItemData) => void;
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
}: TabQuotesProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <section className="animate-view space-y-6">
      {/* Supplier Directory Strip (No Star Ratings, Clean Cards) */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">
              Danh Sách Nhà Cung Cấp Rau Củ
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Quản lý thông tin đầu mối giao hàng hoặc bấm &quot;Vào cổng NCC&quot; để
              xem & nhập giá dưới góc nhìn nhà cung cấp
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenSupplierModal(null)}
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 transition flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sup.color }}
                    />
                    <h3 className="font-bold text-zinc-950 text-sm">
                      {sup.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEnterSupplierPortal(sup.id)}
                      className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-400 transition flex items-center gap-1"
                      title="Vào giao diện độc lập của NCC này"
                    >
                      <LogIn className="w-3 h-3 text-zinc-500" />
                      <span>Vào cổng NCC</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSupplierModal(sup)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded"
                      title="Sửa thông tin"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {suppliers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteSupplier(sup)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                        title="Xóa nhà cung cấp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                  {sup.note || "Không có ghi chú"}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-200/70 flex items-center justify-between text-xs text-zinc-600">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  Zalo:{" "}
                  <strong className="text-zinc-900 tnum">{sup.phone}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Price Comparison Matrix (No Max Qty, Clean Cells) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-zinc-950">
                Ma Trận So Sánh Báo Giá Hàng Ngày
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 tnum">
                {workingDate}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Hệ thống tự động đánh dấu{" "}
              <span className="text-emerald-700 font-semibold">Rẻ nhất</span> cho
              nhà cung cấp có đơn giá thấp nhất và đang còn hàng
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mặt hàng..."
                className="pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400 w-44 sm:w-52"
              />
            </div>

            <button
              type="button"
              onClick={onCopyAllYesterday}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Sao chép hôm qua</span>
            </button>

            <button
              type="button"
              onClick={onRandomizeMarket}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Giả lập biến động</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddItemModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Mặt Hàng</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[200px]">Mặt hàng rau củ</th>
                {suppliers.map((s) => (
                  <th
                    key={s.id}
                    className="py-3 px-4 min-w-[210px] border-l border-zinc-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-900">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="normal-case font-bold text-xs">
                          {s.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-normal text-zinc-400">
                        Đơn giá / Trạng thái
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 w-12 text-center border-l border-zinc-200">
                  Xóa
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {!filteredItems.length ? (
                <tr>
                  <td
                    colSpan={suppliers.length + 2}
                    className="py-10 text-center text-zinc-400"
                  >
                    Không tìm thấy mặt hàng rau củ nào.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const itemQuotes = dayQuotes[item.id] || {};
                  let minPrice = Infinity;

                  suppliers.forEach((s) => {
                    const q = itemQuotes[s.id];
                    if (q && q.inStock && q.price < minPrice) {
                      minPrice = q.price;
                    }
                  });

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50">
                      <td className="p-3.5 px-4 align-middle">
                        <div className="font-semibold text-zinc-950 text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Đơn vị: {item.unit}
                        </div>
                      </td>

                      {suppliers.map((sup) => {
                        const q = itemQuotes[sup.id] || {
                          price: item.basePrice,
                          inStock: true,
                        };
                        const active = q.inStock;
                        const isCheapest = active && q.price === minPrice;

                        return (
                          <td
                            key={sup.id}
                            className={`p-3 border-l border-zinc-200 align-middle transition ${
                              isCheapest
                                ? "bg-emerald-50/40"
                                : !active
                                ? "bg-zinc-50/70"
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
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
                                  className={`px-2 py-1 rounded text-[11px] font-semibold border transition shrink-0 ${
                                    active
                                      ? "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                                  }`}
                                >
                                  {active ? "● Còn" : "○ Hết"}
                                </button>
                                {isCheapest && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                                    Rẻ nhất
                                  </span>
                                )}
                              </div>

                              <div className="relative w-28 shrink-0">
                                <input
                                  type="number"
                                  step="500"
                                  min="0"
                                  value={q.price}
                                  onChange={(e) =>
                                    onUpdateQuote(
                                      item.id,
                                      sup.id,
                                      parseFloat(e.target.value) || 0,
                                      undefined
                                    )
                                  }
                                  className={`w-full pl-2 pr-6 py-1 text-right text-xs font-semibold rounded border ${
                                    isCheapest
                                      ? "border-emerald-500 bg-white text-emerald-950"
                                      : "border-zinc-200 bg-white text-zinc-900"
                                  } focus:outline-none focus:border-zinc-900 tnum`}
                                />
                                <span className="absolute right-1.5 top-1 text-[10px] text-zinc-400">
                                  đ
                                </span>
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center border-l border-zinc-200 align-middle">
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item)}
                          className="text-zinc-300 hover:text-rose-600 transition p-1"
                          title="Xóa mặt hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
