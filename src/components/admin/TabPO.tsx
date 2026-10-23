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
  Utensils,
  Store,
  MessageSquare,
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

  // View mode: "by_kitchen" (Tách theo từng bếp) vs "by_supplier" (Tổng hợp theo NCC)
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

  // ========================================================
  // 1. DATA GROUPED BY KITCHEN FIRST (Theo yêu cầu: Tách thành từng bếp, click vào bếp sẽ hiện ra đơn hàng để copy của từng NCC)
  // ========================================================
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

  // ========================================================
  // 2. DATA GROUPED BY SUPPLIER (Dùng cho chế độ xem tổng hợp)
  // ========================================================
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
    <section className="animate-view space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* Step Header & Metrics Widget Grid */}
      <div className="ios-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-[#1C1C1E] tracking-tight">
              {lockedKitchenId
                ? `Phiếu Đặt Hàng & Gửi Zalo - ${currentKitchenGroup?.kitchenName || "Bếp Ăn"}`
                : "Phiếu Đặt Hàng & Gửi Zalo Từng Bếp"}
            </h2>
            <p className="text-xs text-[#8E8E93] mt-0.5">
              {lockedKitchenId
                ? `Đơn hàng của ${currentKitchenGroup?.kitchenName || "bếp"}. Nhấn sao chép để gửi tin nhắn Zalo cho từng nhà cung cấp.`
                : "Đơn hàng được chia theo từng bếp. Nhấn vào từng bếp để xem và sao chép tin nhắn Zalo gửi từng nhà cung cấp"}
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
            {!lockedKitchenId && (
              <button
                type="button"
                onClick={onProceedToReports}
                className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-xs font-bold text-white transition active:scale-95 flex items-center gap-1"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Xem Báo Cáo</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <Package className="w-3.5 h-3.5 text-[#34C759]" />
              <span>Tổng Tiền Đơn</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {formatVND(displayTotalCost)}
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <TrendingDown className="w-3.5 h-3.5 text-[#34C759]" />
              <span>{lockedKitchenId ? "Tổng Số Món" : "Tiết Kiệm Được"}</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#34C759] mt-1 tnum">
              {lockedKitchenId
                ? `${
                    currentKitchenGroup
                      ? Object.values(currentKitchenGroup.supplierBlocks).reduce(
                          (acc, sb) => acc + sb.items.length,
                          0
                        )
                      : 0
                  } Món`
                : formatVND(allocation.totalSaved)}
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Tổng Khối Lượng</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {displayTotalKg} kg
            </div>
          </div>

          <div className="bg-[#F2F2F7] rounded-2xl p-3 border border-black/5">
            <div className="flex items-center gap-1.5 text-[#8E8E93] text-[11px] font-semibold">
              <Utensils className="w-3.5 h-3.5 text-[#5856D6]" />
              <span>{lockedKitchenId ? "Nhà Cung Cấp" : "Số Bếp Đặt"}</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
              {lockedKitchenId
                ? `${displaySuppliersCount} NCC Cung Ứng`
                : `${kitchenList.length} Bếp Ăn`}
            </div>
          </div>
        </div>

        {/* View Mode Switcher: By Kitchen (Default) vs By Supplier (Hidden if lockedKitchenId) */}
        {!lockedKitchenId && (
          <div className="flex items-center justify-between pt-1 border-t border-[#3C3C43]/10">
            <div className="text-xs text-[#8E8E93] font-medium">
              Chế độ hiển thị:
            </div>
            <div className="inline-flex bg-[#767680]/12 p-0.5 rounded-full text-xs">
              <button
                type="button"
                onClick={() => setViewMode("by_kitchen")}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  viewMode === "by_kitchen"
                    ? "bg-white text-[#1C1C1E] shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Chia Theo Từng Bếp (Khuyên dùng)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("by_supplier")}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  viewMode === "by_supplier"
                    ? "bg-white text-[#1C1C1E] shadow-2xs"
                    : "text-[#8E8E93]"
                }`}
              >
                Tổng Hợp Theo NCC
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. VIEW MODE: TÁCH THÀNH TỪNG BẾP (DEFAULT - THEO YÊU CẦU CỦA BẠN) */}
      {/* ======================================================== */}
      {viewMode === "by_kitchen" && (
        <div className="space-y-3.5">
          {kitchenList.length === 0 ? (
            <div className="ios-card p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center mx-auto text-xl">
                🛒
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
            kitchenList.map((kg, kIdx) => {
              // Default: first kitchen is expanded or if toggled
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
                  {/* Clickable Kitchen Header (Accordion) */}
                  <button
                    type="button"
                    onClick={() => toggleKitchenExpand(kg.kitchenId)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-black/[0.015] active:bg-black/[0.03] transition select-none cursor-pointer bg-gradient-to-r from-white to-[#F2F2F7]/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: kg.kitchenColor }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-sm sm:text-base text-[#1C1C1E]">
                            ĐƠN HÀNG: {kg.kitchenName.toUpperCase()}
                          </h3>
                          <span className="text-[11px] font-bold text-[#248A3D] bg-[#34C759]/15 px-2 py-0.5 rounded-full">
                            {supBlocks.length} NCC giao hàng · {kg.totalKg} kg
                          </span>
                        </div>
                        {kg.kitchenNote && (
                          <div className="text-xs text-[#8E8E93] mt-0.5 truncate max-w-md">
                            📍 {kg.kitchenNote}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-[#8E8E93]">Thành tiền:</div>
                        <div className="text-sm font-extrabold text-[#34C759] tnum">
                          {formatVND(kg.totalCost)}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[#767680]/12 flex items-center justify-center text-[#1C1C1E]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content: SUPPLIER PO CARDS FOR THIS KITCHEN */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-4 border-t border-[#3C3C43]/10 bg-[#F2F2F7]/40">
                      <div className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                        Đơn đặt hàng gửi từng Nhà Cung Cấp cho {kg.kitchenName}:
                      </div>

                      <div className="grid grid-cols-1 gap-3.5">
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
                              className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden"
                            >
                              {/* Supplier Sub-Header & Zalo Copy Button */}
                              <div className="p-3.5 sm:p-4 border-b border-[#3C3C43]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#F2F2F7]/40 to-white">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: sb.supplierColor }}
                                    />
                                    <span className="font-extrabold text-sm text-[#1C1C1E]">
                                      {sb.supplierName}
                                    </span>
                                    {sb.supplierPhone && (
                                      <a
                                        href={`tel:${sb.supplierPhone}`}
                                        className="text-[11px] text-[#007AFF] font-mono bg-[#007AFF]/10 px-2 py-0.2 rounded-full flex items-center gap-1"
                                      >
                                        <Phone className="w-2.5 h-2.5" />
                                        <span>{sb.supplierPhone}</span>
                                      </a>
                                    )}
                                  </div>
                                  <div className="text-xs text-[#8E8E93]">
                                    Giao cho {kg.kitchenName}:{" "}
                                    <strong className="text-[#1C1C1E]">
                                      {sb.items.length} món · {sb.subKg} kg
                                    </strong>
                                  </div>
                                </div>

                                {/* Primary Copy Zalo Button for this Supplier & Kitchen */}
                                <button
                                  type="button"
                                  onClick={() => handleCopyZalo(sb.supplierId, kg.kitchenId)}
                                  className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl font-bold text-xs transition-all duration-150 flex items-center justify-center gap-2 shadow-xs active:scale-95 shrink-0 ${
                                    isCopied
                                      ? "bg-[#248A3D] text-white"
                                      : "bg-[#34C759] hover:bg-[#28CD41] text-white"
                                  }`}
                                >
                                  {isCopied ? (
                                    <>
                                      <Check className="w-4 h-4 stroke-[3]" />
                                      <span>Đã sao chép tin Zalo!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      <span>
                                        Sao Chép Đơn Zalo Gửi {sb.supplierName} ({kg.kitchenName})
                                      </span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Zalo Message Preview Box (Không kèm giá tiền) */}
                              <div className="p-3.5 space-y-2.5 bg-[#F2F2F7]/50">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-[#34C759]" />
                                    Nội dung tin nhắn sao chép:
                                  </span>
                                  <span className="text-[#34C759] font-semibold">
                                    (Chuẩn không kèm giá tiền)
                                  </span>
                                </div>

                                <div className="bg-white rounded-xl p-3 text-xs font-mono text-[#1C1C1E] whitespace-pre-wrap border border-black/5 shadow-2xs leading-relaxed">
                                  {zaloText}
                                </div>

                                {/* Item List detail */}
                                <div className="space-y-1 pt-1">
                                  {sb.items.map((it, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-xs py-1 border-b border-[#3C3C43]/5 last:border-0"
                                    >
                                      <span className="font-medium text-[#1C1C1E]">
                                        {idx + 1}. {it.itemName}
                                      </span>
                                      <span className="font-extrabold text-[#1C1C1E] tnum">
                                        {it.qty} {it.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. VIEW MODE: TỔNG HỢP THEO NCC (OPTIONAL) */}
      {/* ======================================================== */}
      {viewMode === "by_supplier" && (
        <div className="space-y-3.5">
          {allocatedSuppliersCount === 0 ? (
            <div className="ios-card p-10 text-center text-xs text-[#8E8E93]">
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
                          Tổng đơn: <strong className="text-[#1C1C1E] tnum">{g.totalKg} kg</strong>
                        </span>
                        <span>•</span>
                        <span>{kBlocks.length} bếp nhận hàng</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyZalo(g.supplierId, null)}
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
                          <span>Sao Chép Toàn Bộ Đơn ({g.supplierName})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 space-y-3 bg-[#F2F2F7]/50">
                    <div className="bg-white rounded-2xl p-3.5 text-xs font-mono text-[#1C1C1E] whitespace-pre-wrap border border-black/5 shadow-2xs leading-relaxed">
                      {zaloPreview}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Optional Table Detail Toggle (Admin Only) */}
      {!lockedKitchenId && (
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
      )}

      {/* Floating Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToOrders}
          className={`${
            lockedKitchenId ? "w-full" : "w-full sm:w-auto"
          } px-4 py-3.5 rounded-2xl bg-white border border-[#3C3C43]/15 hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-98`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại sửa số lượng đặt hàng</span>
        </button>

        {!lockedKitchenId && (
          <button
            type="button"
            onClick={onProceedToReports}
            className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base bg-[#1C1C1E] text-white hover:bg-black transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            <span>Xem Báo Cáo Chi Phí (Bước 4)</span>
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
}
