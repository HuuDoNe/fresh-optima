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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
} from "lucide-react";

interface TabPOProps {
  workingDate: string;
  kitchens: KitchenData[];
  items: VegetableItemData[];
  suppliers: SupplierData[];
  dayQuotes: DateQuotesMap;
  kitchenOrders: KitchenOrdersMap;
  lockedKitchenId?: string | null;
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
  lockedKitchenId = null,
  onNotify,
  onBackToOrders,
  onProceedToReports,
}: TabPOProps) {
  // Key for tracking which button was just copied: `${supplierId}-${kitchenId}`
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showTableDetail, setShowTableDetail] = useState(false);

  // Accordion state: which kitchen cards are expanded
  const [expandedKitchens, setExpandedKitchens] = useState<Record<string, boolean>>(() => {
    if (lockedKitchenId) {
      return { [lockedKitchenId]: true };
    }
    return {};
  });

  // View mode: "by_kitchen" (default) vs "by_supplier"
  const [viewMode, setViewMode] = useState<"by_kitchen" | "by_supplier">("by_kitchen");

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
      const copyId = `${supplierId}-${specificKitchenId || "all"}`;
      setCopiedKey(copyId);
      setTimeout(() => setCopiedKey(null), 2500);

      const sup = suppliers.find((s) => s.id === supplierId);
      const k = kitchens.find((kItem) => kItem.id === specificKitchenId);
      onNotify(
        specificKitchenId
          ? `Đã sao chép đơn ${k ? k.name : "bếp"} gửi ${sup ? sup.name : "NCC"}`
          : `Đã sao chép toàn bộ đơn Zalo gửi ${sup ? sup.name : "NCC"}`
      );
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      const copyId = `${supplierId}-${specificKitchenId || "all"}`;
      setCopiedKey(copyId);
      setTimeout(() => setCopiedKey(null), 2500);
      onNotify("Đã sao chép phiếu đặt hàng Zalo");
    }
  };

  const toggleKitchenExpand = (kitchenId: string) => {
    setExpandedKitchens((prev) => ({
      ...prev,
      [kitchenId]: !prev[kitchenId],
    }));
  };

  const validLines = allocation.lines.filter((l) => !l.unfulfilled);

  // Group by kitchen
  const kitchenGroups: Record<
    string,
    {
      kitchenId: string;
      kitchenName: string;
      kitchenColor: string;
      kitchenNote: string;
      totalKg: number;
      totalCost: number;
      supplierBlocks: Record<
        string,
        {
          supplierId: string;
          supplierName: string;
          supplierPhone: string;
          supplierColor: string;
          items: typeof validLines;
          subKg: number;
          subCost: number;
        }
      >;
    }
  > = {};

  validLines.forEach((l) => {
    if (!kitchenGroups[l.kitchenId]) {
      kitchenGroups[l.kitchenId] = {
        kitchenId: l.kitchenId,
        kitchenName: l.kitchenName,
        kitchenColor: l.kitchenColor,
        kitchenNote: l.kitchenNote,
        totalKg: 0,
        totalCost: 0,
        supplierBlocks: {},
      };
    }
    const kg = kitchenGroups[l.kitchenId];
    if (!kg.supplierBlocks[l.supplierId]) {
      kg.supplierBlocks[l.supplierId] = {
        supplierId: l.supplierId,
        supplierName: l.supplierName,
        supplierPhone: l.supplierPhone,
        supplierColor: l.supplierColor,
        items: [],
        subKg: 0,
        subCost: 0,
      };
    }
    kg.supplierBlocks[l.supplierId].items.push(l);
    kg.supplierBlocks[l.supplierId].subKg += l.qty;
    kg.supplierBlocks[l.supplierId].subCost += l.totalPrice;
    kg.totalKg += l.qty;
    kg.totalCost += l.totalPrice;
  });

  const allKitchenList = Object.values(kitchenGroups);
  const kitchenList = lockedKitchenId
    ? allKitchenList.filter((k) => k.kitchenId === lockedKitchenId)
    : allKitchenList;

  const currentKitchenGroup = lockedKitchenId ? kitchenGroups[lockedKitchenId] : null;

  // Group by supplier
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

  const displayTotalCost = currentKitchenGroup
    ? currentKitchenGroup.totalCost
    : allocation.totalCost;
  const displayTotalKg = currentKitchenGroup
    ? currentKitchenGroup.totalKg
    : allocation.allocatedKg;
  const displaySuppliersCount = currentKitchenGroup
    ? Object.keys(currentKitchenGroup.supplierBlocks).length
    : allocatedSuppliersCount;

  return (
    <section className="animate-view space-y-3 pb-24 max-w-full">
      {/* 1. Header & Compact 2x2 Metrics Card */}
      <div className="ios-card p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Send className="w-4 h-4 text-[#34C759] shrink-0" />
            <h2 className="text-sm font-extrabold text-[#1C1C1E] tracking-tight truncate">
              {lockedKitchenId
                ? `Phiếu Zalo - ${currentKitchenGroup?.kitchenName || "Bếp Ăn"}`
                : "Phiếu Đặt Hàng & Gửi Zalo"}
            </h2>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onBackToOrders}
              className="px-2 py-1 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[11px] font-semibold text-[#1C1C1E] transition active:scale-95 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Sửa đơn</span>
            </button>
            {!lockedKitchenId && (
              <button
                type="button"
                onClick={onProceedToReports}
                className="px-2 py-1 rounded-full bg-[#1C1C1E] text-[11px] font-bold text-white transition active:scale-95 flex items-center gap-1"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Báo Cáo</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Compact Metric Cells (2x2 Grid) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5">
            <div className="text-[#8E8E93] text-[10px] font-semibold">Tổng Tiền</div>
            <div className="text-sm font-extrabold text-[#1C1C1E] mt-0.5 tnum truncate">
              {formatVND(displayTotalCost)}
            </div>
          </div>
          <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5">
            <div className="text-[#8E8E93] text-[10px] font-semibold">Khối Lượng</div>
            <div className="text-sm font-extrabold text-[#1C1C1E] mt-0.5 tnum">
              {displayTotalKg} kg
            </div>
          </div>
          <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5">
            <div className="text-[#8E8E93] text-[10px] font-semibold">
              {lockedKitchenId ? "Tổng Món" : "Tiết Kiệm"}
            </div>
            <div className="text-sm font-extrabold text-[#34C759] mt-0.5 tnum truncate">
              {lockedKitchenId
                ? `${
                    currentKitchenGroup
                      ? Object.values(currentKitchenGroup.supplierBlocks).reduce(
                          (acc, sb) => acc + sb.items.length,
                          0
                        )
                      : 0
                  } món`
                : formatVND(allocation.totalSaved)}
            </div>
          </div>
          <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5">
            <div className="text-[#8E8E93] text-[10px] font-semibold">
              {lockedKitchenId ? "Số NCC" : "Số Bếp"}
            </div>
            <div className="text-sm font-extrabold text-[#007AFF] mt-0.5 tnum">
              {lockedKitchenId
                ? `${displaySuppliersCount} NCC`
                : `${kitchenList.length} Bếp`}
            </div>
          </div>
        </div>

        {/* View Mode Switcher (Admin only) */}
        {!lockedKitchenId && (
          <div className="flex items-center justify-between pt-1 border-t border-[#3C3C43]/8">
            <span className="text-[11px] text-[#8E8E93] font-medium">Chế độ xem:</span>
            <div className="inline-flex bg-[#767680]/12 p-0.5 rounded-full text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("by_kitchen")}
                className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                  viewMode === "by_kitchen"
                    ? "bg-white text-[#1C1C1E] shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Từng Bếp
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by_supplier")}
                className={`px-2.5 py-0.5 rounded-full font-bold transition ${
                  viewMode === "by_supplier"
                    ? "bg-white text-[#1C1C1E] shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Theo NCC
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Kitchen Groups Accordions */}
      {viewMode === "by_kitchen" && (
        <div className="space-y-2.5">
          {kitchenList.length === 0 ? (
            <div className="ios-card p-8 text-center space-y-2">
              <p className="text-xs text-[#8E8E93]">
                Chưa có mặt hàng nào được nhập số lượng.
              </p>
              <button
                type="button"
                onClick={onBackToOrders}
                className="px-3.5 py-1.5 rounded-xl bg-[#34C759] text-white text-xs font-bold active:scale-95 transition"
              >
                Nhập số lượng ở Bước 2
              </button>
            </div>
          ) : (
            kitchenList.map((kg, kIdx) => {
              const isExpanded =
                expandedKitchens[kg.kitchenId] !== undefined
                  ? expandedKitchens[kg.kitchenId]
                  : kIdx === 0;
              const supBlocks = Object.values(kg.supplierBlocks);

              return (
                <div
                  key={kg.kitchenId}
                  className="ios-card overflow-hidden transition-all duration-200"
                >
                  {/* Clickable Kitchen Header */}
                  <button
                    type="button"
                    onClick={() => toggleKitchenExpand(kg.kitchenId)}
                    className="w-full p-3 flex items-center justify-between gap-2 text-left hover:bg-black/[0.015] active:bg-black/[0.03] transition select-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: kg.kitchenColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-xs sm:text-sm text-[#1C1C1E]">
                            {kg.kitchenName}
                          </h3>
                          <span className="text-[10px] font-bold text-[#248A3D] bg-[#34C759]/15 px-1.5 py-0.2 rounded-full">
                            {kg.totalKg} kg
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-extrabold text-[#34C759] tnum">
                        {formatVND(kg.totalCost)}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-[#767680]/12 flex items-center justify-center text-[#1C1C1E]">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content: SUPPLIER PO CARDS */}
                  {isExpanded && (
                    <div className="p-2.5 space-y-2 border-t border-[#3C3C43]/8 bg-[#F2F2F7]/50">
                      {supBlocks.map((sb) => {
                        const isCopied =
                          copiedKey === `${sb.supplierId}-${kg.kitchenId}`;
                        const zaloText = generateZaloOrderText(
                          allocation,
                          sb.supplierId,
                          workingDate,
                          kg.kitchenId
                        );

                        return (
                          <div
                            key={sb.supplierId}
                            className="bg-white rounded-xl border border-black/5 shadow-2xs overflow-hidden"
                          >
                            {/* Card Top: Supplier Name + Direct Copy Button */}
                            <div className="p-2.5 flex items-center justify-between gap-2 border-b border-[#3C3C43]/8">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: sb.supplierColor }}
                                  />
                                  <span className="font-extrabold text-xs text-[#1C1C1E] truncate">
                                    {sb.supplierName}
                                  </span>
                                  {sb.supplierPhone && (
                                    <a
                                      href={`tel:${sb.supplierPhone}`}
                                      className="text-[10px] text-[#007AFF] font-mono flex items-center"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#8E8E93] mt-0.5">
                                  {sb.items.length} món · {sb.subKg} kg
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCopyZalo(sb.supplierId, kg.kitchenId)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all duration-150 flex items-center gap-1 shadow-2xs active:scale-95 shrink-0 select-none cursor-pointer ${
                                  isCopied
                                    ? "bg-[#248A3D] text-white"
                                    : "bg-[#34C759] hover:bg-[#28CD41] text-white"
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Đã sao chép!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Sao chép Zalo</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Zalo Message Preview */}
                            <div className="p-2.5 bg-[#F2F2F7]/40 space-y-1.5">
                              <div className="bg-white rounded-lg p-2 text-[11px] font-mono text-[#1C1C1E] whitespace-pre-wrap border border-black/5 shadow-2xs leading-relaxed">
                                {zaloText}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. Supplier Groups View (Optional) */}
      {viewMode === "by_supplier" && (
        <div className="space-y-2.5">
          {allocatedSuppliersCount === 0 ? (
            <div className="ios-card p-8 text-center text-xs text-[#8E8E93]">
              Chưa có đơn hàng nào được nhập số lượng.
            </div>
          ) : (
            Object.values(supGroups).map((g) => {
              const kBlocks = Object.values(g.kitchenBlocks);
              const isAllCopied = copiedKey === `${g.supplierId}-all`;
              const zaloPreview = generateZaloOrderText(
                allocation,
                g.supplierId,
                workingDate,
                null
              );

              return (
                <div key={g.supplierId} className="ios-card overflow-hidden">
                  <div className="p-3 border-b border-[#3C3C43]/8 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: g.supplierColor }}
                        />
                        <h3 className="font-extrabold text-xs text-[#1C1C1E] truncate">
                          {g.supplierName}
                        </h3>
                      </div>
                      <div className="text-[10px] text-[#8E8E93] mt-0.5">
                        Tổng: <strong className="text-[#1C1C1E]">{g.totalKg} kg</strong> · {kBlocks.length} bếp
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyZalo(g.supplierId, null)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all duration-150 flex items-center gap-1 shadow-2xs active:scale-95 shrink-0 ${
                        isAllCopied
                          ? "bg-[#248A3D] text-white"
                          : "bg-[#34C759] hover:bg-[#28CD41] text-white"
                      }`}
                    >
                      {isAllCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép toàn bộ</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#F2F2F7]/50">
                    <div className="bg-white rounded-lg p-2 text-[11px] font-mono text-[#1C1C1E] whitespace-pre-wrap border border-black/5 shadow-2xs leading-relaxed">
                      {zaloPreview}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Optional Table Detail Toggle (Admin Only) */}
      {!lockedKitchenId && (
        <div className="ios-card p-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowTableDetail(!showTableDetail)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#1C1C1E] transition"
          >
            <span>Bảng phân bổ chi tiết ({allocation.lines.length} dòng)</span>
            {showTableDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTableDetail && (
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-[#3C3C43]/10 bg-[#F2F2F7] text-[#8E8E93] font-bold">
                    <th className="py-2 px-2">Bếp</th>
                    <th className="py-2 px-2">Món</th>
                    <th className="py-2 px-2 text-right">SL</th>
                    <th className="py-2 px-2">NCC</th>
                    <th className="py-2 px-2 text-right">Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3C3C43]/8">
                  {allocation.lines.map((l, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.015]">
                      <td className="py-1.5 px-2 font-bold" style={{ color: l.kitchenColor }}>
                        {l.kitchenName}
                      </td>
                      <td className="py-1.5 px-2 font-medium text-[#1C1C1E]">{l.itemName}</td>
                      <td className="py-1.5 px-2 text-right font-bold tnum">{l.qty} {l.unit}</td>
                      <td className="py-1.5 px-2 text-[#1C1C1E]">{l.supplierName}</td>
                      <td className="py-1.5 px-2 text-right font-bold text-[#34C759] tnum">{formatVND(l.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Bottom Action Buttons */}
      <div className="pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToOrders}
          className="flex-1 py-3 px-3 rounded-2xl bg-white border border-[#3C3C43]/15 hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs active:scale-98"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sửa số lượng đặt</span>
        </button>

        {!lockedKitchenId && (
          <button
            type="button"
            onClick={onProceedToReports}
            className="flex-1 py-3 px-3 rounded-2xl font-bold text-xs bg-[#1C1C1E] text-white hover:bg-black transition flex items-center justify-center gap-1 shadow-xs active:scale-98"
          >
            <span>Báo Cáo (B4)</span>
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
}
