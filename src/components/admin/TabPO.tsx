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
  Copy,
  Check,
  ArrowLeft,
  BarChart3,
  Phone,
  ShieldCheck,
  TrendingDown,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface TabPOProps {
  workingDate: string;
  kitchens: KitchenData[];
  items: VegetableItemData[];
  suppliers: SupplierData[];
  dayQuotes: DateQuotesMap;
  kitchenOrders: KitchenOrdersMap;
  onNotify: (msg: string, type?: "default" | "warn") => void;
  onBackToOrders: () => void;
  onProceedToReports: () => void;
}

export function TabPO({
  workingDate,
  kitchens,
  items,
  suppliers,
  dayQuotes,
  kitchenOrders,
  onNotify,
  onBackToOrders,
  onProceedToReports,
}: TabPOProps) {
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);
  const [showTableDetail, setShowTableDetail] = useState(false);

  // Run allocation engine for all kitchens
  const allocation = runPerKitchenAllocation(
    kitchens,
    items,
    suppliers,
    dayQuotes,
    kitchenOrders,
    null
  );

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
      setCopiedSupplierId(`${supplierId}-${specificKitchenId || "all"}`);
      setTimeout(() => setCopiedSupplierId(null), 2500);
      const sup = suppliers.find((s) => s.id === supplierId);
      onNotify(
        specificKitchenId
          ? `Đã sao chép đơn riêng bếp cho ${sup ? sup.name : "NCC"}`
          : `Đã sao chép toàn bộ đơn Zalo gửi ${sup ? sup.name : "NCC"}`
      );
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedSupplierId(`${supplierId}-${specificKitchenId || "all"}`);
      setTimeout(() => setCopiedSupplierId(null), 2500);
      onNotify("Đã sao chép phiếu đặt hàng Zalo");
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

  const allocatedSuppliersCount = Object.keys(supGroups).length;

  return (
    <section className="animate-view space-y-5 pb-24 sm:pb-28">
      {/* Step Header */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                ✓
              </span>
              <h2 className="text-sm sm:text-base font-bold text-zinc-950">
                Bước 3: Phiếu Đặt Hàng & Gửi Zalo
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Đơn hàng đã được tối ưu giá rẻ nhất, đóng gói và tách riêng từng bếp cho nhà cung cấp giao đúng nơi.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sửa số lượng</span>
            </button>
            <button
              type="button"
              onClick={onProceedToReports}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Xem Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tổng Tiền Đơn</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-950 mt-1 tnum">
              {formatVND(allocation.totalCost)}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Cho ngày: {workingDate}
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tiết Kiệm Được</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 mt-1 tnum">
              {formatVND(allocation.totalSaved)}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              So với giá sàn thị trường
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <Layers className="w-3.5 h-3.5 text-zinc-600" />
              <span>Tổng Khối Lượng</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-950 mt-1 tnum">
              {allocation.allocatedKg} kg
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {allocation.itemCount} dòng mặt hàng
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200/80">
            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>NCC Nhận Đơn</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-zinc-950 mt-1 tnum">
              {allocatedSuppliersCount} Nhà cung cấp
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              Tối ưu phân chia tự động
            </div>
          </div>
        </div>
      </div>

      {/* Supplier PO Cards List (Split by Kitchen inside) */}
      <div className="space-y-4">
        {!allocatedSuppliersCount ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <p className="text-xs text-zinc-500">
              Chưa có đơn hàng nào được nhập số lượng.
            </p>
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
            >
              Quay lại Bước 2 để nhập số lượng
            </button>
          </div>
        ) : (
          Object.values(supGroups).map((g) => {
            const kBlocks = Object.values(g.kitchenBlocks);
            const isAllCopied = copiedSupplierId === `${g.supplierId}-all`;

            return (
              <div
                key={g.supplierId}
                className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden"
              >
                {/* Supplier Header & Primary Zalo Copy Button */}
                <div className="p-4 sm:p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-gradient-to-r from-zinc-50/50 to-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: g.supplierColor }}
                      />
                      <h3 className="font-bold text-zinc-950 text-sm sm:text-base">
                        {g.supplierName}
                      </h3>
                      {g.supplierPhone && (
                        <a
                          href={`tel:${g.supplierPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-emerald-700 bg-zinc-100 px-2 py-0.5 rounded font-mono"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{g.supplierPhone}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>
                        Tổng đơn: <strong className="text-zinc-900 tnum">{g.totalKg} kg</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Thành tiền:{" "}
                        <strong className="text-emerald-700 font-bold tnum">
                          {formatVND(g.totalCost)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{kBlocks.length} bếp nhận hàng</span>
                    </div>
                  </div>

                  {/* Big Touch-Friendly Copy Zalo Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyZalo(g.supplierId)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs shrink-0 ${
                      isAllCopied
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98"
                    }`}
                  >
                    {isAllCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã chép tin Zalo!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao Chép Tin Nhắn Zalo ({g.supplierName})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Per-Kitchen Sections */}
                <div className="p-4 sm:p-5 space-y-3.5 bg-zinc-50/40">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Đóng gói & Giao riêng theo từng bếp (Không gộp chung):
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {kBlocks.map((kb) => {
                      const isKitchenCopied =
                        copiedSupplierId === `${g.supplierId}-${kb.kitchenId}`;

                      return (
                        <div
                          key={kb.kitchenId}
                          className="bg-white rounded-xl border border-zinc-200 p-3.5 space-y-2.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: kb.kitchenColor }}
                              />
                              <span className="font-bold text-xs text-zinc-900">
                                {kb.kitchenName}
                              </span>
                              {kb.kitchenNote && (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                                  ({kb.kitchenNote})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyZalo(g.supplierId, kb.kitchenId)}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-zinc-600 hover:text-emerald-700 bg-zinc-50 border border-zinc-200 hover:border-emerald-300 transition flex items-center gap-1"
                              title="Chỉ sao chép đơn của bếp này"
                            >
                              {isKitchenCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                  <span>Chép riêng</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            {kb.items.map((it, iIdx) => (
                              <div
                                key={iIdx}
                                className="flex items-center justify-between py-1 border-b border-zinc-50 last:border-0"
                              >
                                <div>
                                  <span className="font-medium text-zinc-900">
                                    {it.itemName}
                                  </span>
                                  <span className="text-zinc-400 text-[11px] ml-1.5">
                                    ({it.qty} {it.unit} × {formatVND(it.unitPrice)})
                                  </span>
                                </div>
                                <div className="font-bold text-zinc-900 tnum">
                                  {formatVND(it.totalPrice)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs font-semibold">
                            <span className="text-zinc-500">
                              Cộng {kb.kitchenName} ({kb.subKg} kg):
                            </span>
                            <span className="text-emerald-700 font-bold tnum">
                              {formatVND(kb.subCost)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optional Detailed Line-by-Line Table Toggle */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-2xs space-y-3">
        <button
          type="button"
          onClick={() => setShowTableDetail(!showTableDetail)}
          className="w-full flex items-center justify-between text-xs font-bold text-zinc-800 hover:text-zinc-950 transition"
        >
          <span>Xem bảng phân bổ chi tiết từng dòng mặt hàng ({allocation.lines.length} dòng)</span>
          {showTableDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTableDetail && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-500">
                  <th className="py-2.5 px-3">Bếp</th>
                  <th className="py-2.5 px-3">Mặt hàng</th>
                  <th className="py-2.5 px-3 text-right">SL</th>
                  <th className="py-2.5 px-3">NCC chọn</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  <th className="py-2.5 px-3">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {allocation.lines.map((l, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50">
                    <td className="py-2 px-3 font-semibold" style={{ color: l.kitchenColor }}>
                      {l.kitchenName}
                    </td>
                    <td className="py-2 px-3 font-medium text-zinc-900">{l.itemName}</td>
                    <td className="py-2 px-3 text-right font-bold tnum">{l.qty} {l.unit}</td>
                    <td className="py-2 px-3 text-zinc-800">{l.supplierName}</td>
                    <td className="py-2 px-3 text-right text-zinc-600 tnum">{formatVND(l.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700 tnum">{formatVND(l.totalPrice)}</td>
                    <td className="py-2 px-3 text-[11px] text-zinc-500">{l.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar for Step 3 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-zinc-500 hidden sm:inline">Tổng chi phí đặt hàng: </span>
            <span className="font-bold text-base text-zinc-950 tnum">
              {formatVND(allocation.totalCost)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold ml-2 hidden sm:inline">
              (Tiết kiệm {formatVND(allocation.totalSaved)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sửa số lượng</span>
            </button>

            <button
              type="button"
              onClick={onProceedToReports}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Xem Báo Cáo Chi Phí (Bước 4)</span>
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
