"use client";

import React, { useState } from "react";
import { SupplierData, VegetableItemData, DateQuotesMap } from "@/lib/types";
import {
  Edit3,
  Plus,
  LogOut,
  Copy,
  CheckCheck,
  Search,
  CheckCircle2,
  Phone,
  MapPin,
} from "lucide-react";

interface SupplierPortalProps {
  supplier: SupplierData;
  workingDate: string;
  items: VegetableItemData[];
  dayQuotes: DateQuotesMap;
  onUpdateQuote: (itemId: string, price?: number, inStock?: boolean) => Promise<void>;
  onCopyYesterday: () => Promise<void>;
  onSetAllInStock: () => Promise<void>;
  onOpenSelfProfileModal: () => void;
  onOpenAddItemModal: () => void;
  onExitSupplierMode: () => void;
  onNotify: (msg: string) => void;
}

export function SupplierPortal({
  supplier,
  workingDate,
  items,
  dayQuotes,
  onUpdateQuote,
  onCopyYesterday,
  onSetAllInStock,
  onOpenSelfProfileModal,
  onOpenAddItemModal,
  onExitSupplierMode,
  onNotify,
}: SupplierPortalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter((it) =>
    it.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  let inStockCount = 0;
  let outStockCount = 0;
  items.forEach((it) => {
    const q = dayQuotes[it.id]?.[supplier.id];
    if (q && q.inStock) inStockCount++;
    else outStockCount++;
  });

  return (
    <section className="animate-view space-y-6">
      {/* Supplier Top Identity Banner */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Cổng Nhà Cung Cấp Độc Lập
            </span>
            <span className="text-xs text-zinc-400">•</span>
            <span className="text-xs font-medium text-zinc-500">
              Ngày báo giá:{" "}
              <strong className="text-zinc-900 tnum">{workingDate}</strong>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
            {supplier.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              Zalo nhận đơn:{" "}
              <strong className="text-zinc-900 tnum">{supplier.phone}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              Ghi chú:{" "}
              <span className="text-zinc-800">
                {supplier.note || "Chưa có ghi chú"}
              </span>
            </span>
          </div>
        </div>

        {/* Permitted Supplier Actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSelfProfileModal}
            className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition flex items-center gap-2"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Sửa tên & thông tin NCC</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddItemModal}
            className="px-3.5 py-2 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thêm mặt hàng mới</span>
          </button>

          <button
            type="button"
            onClick={onExitSupplierMode}
            className="px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium transition flex items-center gap-1.5"
            title="Quay lại quyền Quản lý thu mua"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát cổng NCC</span>
          </button>
        </div>
      </div>

      {/* Supplier KPI & Quick Utility Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-7 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-[11px] font-medium text-zinc-500">
              Tổng mặt hàng
            </span>
            <div className="text-xl font-bold text-zinc-950 mt-0.5 tnum">
              {items.length} mặt hàng
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-[11px] font-medium text-emerald-700">
              Đang còn hàng
            </span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5 tnum">
              {inStockCount} món
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <span className="text-[11px] font-medium text-rose-700">
              Đang báo hết hàng
            </span>
            <div className="text-xl font-bold text-rose-600 mt-0.5 tnum">
              {outStockCount} món
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCopyYesterday}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sao chép giá hôm qua</span>
          </button>

          <button
            type="button"
            onClick={onSetAllInStock}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium transition flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Báo còn hàng tất cả</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onNotify("Đã lưu và đồng bộ bảng báo giá lên hệ thống thu mua!")
            }
            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lưu báo giá</span>
          </button>
        </div>
      </div>

      {/* Supplier Exclusive Quote Table (Strictly 4 columns: STT, Mặt hàng, Trạng thái, Đơn giá) */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-950">
              Bảng Cập Nhật Báo Giá Hàng Ngày
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Chỉ hiển thị và chỉnh sửa dữ liệu của riêng nhà cung cấp đang đăng nhập
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mặt hàng rau củ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:bg-white focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-5 w-14">#</th>
                <th className="py-3 px-5">Mặt hàng rau củ</th>
                <th className="py-3 px-5 text-center w-52">Trạng thái hàng</th>
                <th className="py-3 px-5 text-right w-60">Đơn giá chào (VNĐ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {!filteredItems.length ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-zinc-400 text-xs"
                  >
                    Không tìm thấy mặt hàng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const q = dayQuotes[item.id]?.[supplier.id] || {
                    price: item.basePrice,
                    inStock: true,
                  };
                  const active = q.inStock;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-50/80 transition ${
                        !active ? "bg-rose-50/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-5 text-xs font-mono text-zinc-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-zinc-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Đơn vị tính: {item.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => onUpdateQuote(item.id, undefined, !active)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              active ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          />
                          <span>{active ? "Còn hàng" : "Báo hết hàng"}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center justify-end relative">
                          <input
                            type="number"
                            step="500"
                            min="0"
                            value={q.price}
                            onChange={(e) =>
                              onUpdateQuote(
                                item.id,
                                parseFloat(e.target.value) || 0,
                                undefined
                              )
                            }
                            className="w-40 pl-3 pr-12 py-1.5 text-right text-sm font-semibold rounded-lg border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900 tnum"
                          />
                          <span className="absolute right-3 text-xs text-zinc-400 pointer-events-none">
                            đ/{item.unit}
                          </span>
                        </div>
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
