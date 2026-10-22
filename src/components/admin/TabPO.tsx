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
    <section className="animate-view space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* iOS Header & Cupertino Widget Grid */}
      <div className="ios-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#1C1C1E] tracking-tight">
              Phiếu Đặt Hàng & Gửi Zalo
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              Tối ưu giá rẻ nhất, đóng gói và tách riêng từng bếp cho nhà cung cấp
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-3 py-1.5 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-xs font-semibold text-[#1C1C1E] transition active:scale-95 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sửa số lượng</span>
            </button>
            <button
              type="button"
              onClick={onProceedToReports}
              className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-xs font-bold text-white transition active:scale-95 flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Xem Báo Cáo</span>
            </button>
          </div>
        </div>

        {/* 4 Apple Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <Package className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tổng Tiền Đơn</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {formatVND(allocation.totalCost)}
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <TrendingDown className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tiết Kiệm Được</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#34C759] mt-1 tnum">
              {formatVND(allocation.totalSaved)}
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Tổng Khối Lượng</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {allocation.allocatedKg} kg
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5856D6]" />
              <span>NCC Nhận Đơn</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {allocatedSuppliersCount} NCC
            </div>
          </div>
        </div>
      </div>

      {/* Supplier PO Cards (iOS Inset Grouped) */}
      <div className="space-y-3.5">
        {!allocatedSuppliersCount ? (
          <div className="ios-card p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <p className="text-xs text-[#8E8E93]">
              Chưa có mặt hàng nào được nhập số lượng.
            </p>
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-4 py-2 rounded-2xl bg-[#34C759] text-white text-xs font-bold active:scale-95 transition"
            >
              Quay lại Bước 2 để nhập số lượng
            </button>
          </div>
        ) : (
          Object.values(supGroups).map((g) => {
            const kBlocks = Object.values(g.kitchenBlocks);
            const isAllCopied = copiedSupplierId === `${g.supplierId}-all`;
            const zaloPreview = generateZaloOrderText(
              allocation,
              g.supplierId,
              workingDate,
              null
            );

            return (
              <div key={g.supplierId} className="ios-card overflow-hidden">
                {/* Header & Primary Zalo Copy Button */}
                <div className="p-4 sm:p-5 border-b border-[#3C3C43]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-b from-[#F2F2F7]/50 to-white">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: g.supplierColor }}
                      />
                      <h3 className="font-extrabold text-[#1C1C1E] text-base">
                        {g.supplierName}
                      </h3>
                      {g.supplierPhone && (
                        <a
                          href={`tel:${g.supplierPhone}`}
                          className="inline-flex items-center gap-1 text-[11px] text-[#007AFF] bg-white px-2 py-0.5 rounded-full font-mono border border-black/5"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{g.supplierPhone}</span>
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
                      <span>
                        Tổng: <strong className="text-[#1C1C1E] tnum">{g.totalKg} kg</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Thành tiền:{" "}
                        <strong className="text-[#34C759] font-bold tnum">
                          {formatVND(g.totalCost)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>{kBlocks.length} bếp nhận</span>
                    </div>
                  </div>

                  {/* iOS Style Copy Zalo Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyZalo(g.supplierId)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(52,199,89,0.3)] active:scale-95 shrink-0 ${
                      isAllCopied
                        ? "bg-[#248A3D] text-white"
                        : "bg-[#34C759] hover:bg-[#28CD41] text-white"
                    }`}
                  >
                    {isAllCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã sao chép tin nhắn Zalo!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao Chép Tin Nhắn Zalo ({g.supplierName})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Zalo Message Preview Box (Transparent, Authentic) */}
                <div className="p-4 space-y-3 bg-[#F2F2F7]/50">
                  <div className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
                    Nội dung sẽ sao chép gửi NCC (Không kèm giá tiền):
                  </div>

                  <div className="bg-white rounded-2xl p-3.5 text-xs font-mono text-[#1C1C1E] whitespace-pre-wrap border border-black/5 shadow-2xs leading-relaxed">
                    {zaloPreview}
                  </div>

                  {/* Individual Kitchen Copy Buttons */}
                  {kBlocks.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-[#8E8E93]">Hoặc sao chép riêng từng bếp:</span>
                      {kBlocks.map((kb) => {
                        const isKitchenCopied =
                          copiedSupplierId === `${g.supplierId}-${kb.kitchenId}`;
                        return (
                          <button
                            key={kb.kitchenId}
                            type="button"
                            onClick={() => handleCopyZalo(g.supplierId, kb.kitchenId)}
                            className="px-2.5 py-1 rounded-full bg-white border border-black/10 text-xs font-semibold text-[#1C1C1E] hover:border-[#34C759] transition active:scale-95 flex items-center gap-1 shadow-2xs"
                          >
                            {isKitchenCopied ? (
                              <>
                                <Check className="w-3 h-3 text-[#34C759]" />
                                <span className="text-[#34C759]">Đã chép {kb.kitchenName}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[#8E8E93]" />
                                <span>Chép riêng {kb.kitchenName}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optional Table Detail Toggle */}
      <div className="ios-card p-4 space-y-3">
        <button
          type="button"
          onClick={() => setShowTableDetail(!showTableDetail)}
          className="w-full flex items-center justify-between text-xs font-bold text-[#1C1C1E] transition"
        >
          <span>Xem bảng phân bổ chi tiết ({allocation.lines.length} dòng)</span>
          {showTableDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTableDetail && (
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#3C3C43]/10 bg-[#F2F2F7] text-[11px] font-bold text-[#8E8E93]">
                  <th className="py-2.5 px-3">Bếp</th>
                  <th className="py-2.5 px-3">Mặt hàng</th>
                  <th className="py-2.5 px-3 text-right">SL</th>
                  <th className="py-2.5 px-3">NCC chọn</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3C3C43]/10">
                {allocation.lines.map((l, idx) => (
                  <tr key={idx} className="hover:bg-black/[0.015]">
                    <td className="py-2 px-3 font-bold" style={{ color: l.kitchenColor }}>
                      {l.kitchenName}
                    </td>
                    <td className="py-2 px-3 font-medium text-[#1C1C1E]">{l.itemName}</td>
                    <td className="py-2 px-3 text-right font-bold tnum">{l.qty} {l.unit}</td>
                    <td className="py-2 px-3 text-[#1C1C1E]">{l.supplierName}</td>
                    <td className="py-2 px-3 text-right text-[#8E8E93] tnum">{formatVND(l.unitPrice)}</td>
                    <td className="py-2 px-3 text-right font-bold text-[#34C759] tnum">{formatVND(l.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Button (Step 3 -> Reports) */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToOrders}
          className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white border border-[#3C3C43]/15 hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sửa số lượng</span>
        </button>

        <button
          type="button"
          onClick={onProceedToReports}
          className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base bg-[#1C1C1E] text-white hover:bg-black transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
        >
          <span>Xem Báo Cáo Chi Phí (Bước 4)</span>
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
