"use client";

import React, { useState, useEffect } from "react";
import {
  SupplierData,
  VegetableItemData,
  DateQuotesMap,
  KitchenData,
  KitchenOrdersMap,
  OrderBatchSummary,
} from "@/lib/types";
import { runPerKitchenAllocation, formatVND } from "@/lib/optimizer";
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
  ShoppingBag,
  Tag,
  Package,
  Layers,
  Check,
  Truck,
  Utensils,
  ChevronDown,
  ChevronUp,
  Circle,
  CheckSquare,
  Square,
} from "lucide-react";
import { IosSwitch } from "@/components/common/IosSwitch";

interface SupplierPortalProps {
  supplier: SupplierData;
  workingDate: string;
  items: VegetableItemData[];
  dayQuotes: DateQuotesMap;
  kitchens: KitchenData[];
  kitchenOrders: KitchenOrdersMap;
  history: OrderBatchSummary[];
  suppliers: SupplierData[];
  onUpdateQuote: (
    itemId: string,
    price?: number,
    inStock?: boolean
  ) => Promise<void>;
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
  kitchens,
  kitchenOrders,
  history,
  suppliers,
  onUpdateQuote,
  onCopyYesterday,
  onSetAllInStock,
  onOpenSelfProfileModal,
  onOpenAddItemModal,
  onExitSupplierMode,
  onNotify,
}: SupplierPortalProps) {
  // Tabs: "quotes" (Báo giá sản phẩm) vs "orders" (Đơn hàng từ bên mua)
  const [activeTab, setActiveTab] = useState<"quotes" | "orders">("quotes");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPackingList, setCopiedPackingList] = useState(false);

  // Accordion state: which kitchen cards are expanded
  const [expandedKitchens, setExpandedKitchens] = useState<Record<string, boolean>>({});

  // Checklist state: key = `${kitchenId}_${itemId}` -> boolean (has been delivered)
  const [deliveredMap, setDeliveredMap] = useState<Record<string, boolean>>({});

  // Load delivered checklist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storageKey = `delivery_checklist_${workingDate}_${supplier.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setDeliveredMap(JSON.parse(saved));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [workingDate, supplier.id]);

  // Toggle delivery checklist item
  const toggleDelivered = (kitchenId: string, itemId: string) => {
    const key = `${kitchenId}_${itemId}`;
    setDeliveredMap((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (typeof window !== "undefined") {
        const storageKey = `delivery_checklist_${workingDate}_${supplier.id}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
  };

  // Toggle expand/collapse of a kitchen
  const toggleKitchenExpand = (kitchenId: string) => {
    setExpandedKitchens((prev) => ({
      ...prev,
      [kitchenId]: !prev[kitchenId],
    }));
  };

  // --- 1. QUOTES DATA ---
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

  // --- 2. ORDERS DATA (STRICLY FILTERED FOR THIS SUPPLIER & SPLIT PER KITCHEN) ---
  const committedBatch = history.find((h) => h.date === workingDate);
  let supplierLines: Array<{
    id: string;
    kitchenId: string;
    kitchenName: string;
    kitchenColor: string;
    kitchenNote?: string;
    itemId: string;
    itemName: string;
    unit: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }> = [];

  let isCommittedOrder = false;

  if (committedBatch) {
    const filteredCommitted = committedBatch.lines.filter(
      (l) => l.supplierId === supplier.id
    );
    if (filteredCommitted.length > 0) {
      isCommittedOrder = true;
      supplierLines = filteredCommitted.map((l) => {
        const k = kitchens.find((kItem) => kItem.id === l.kitchenId);
        return {
          id: l.id,
          kitchenId: l.kitchenId,
          kitchenName: l.kitchenName,
          kitchenColor: l.kitchenColor || k?.color || "#059669",
          kitchenNote: k?.note || undefined,
          itemId: l.itemId,
          itemName: l.itemName,
          unit: l.unit,
          qty: l.qty,
          unitPrice: l.unitPrice,
          totalPrice: l.totalPrice,
        };
      });
    }
  }

  // If no committed order found in history, calculate from current active kitchen orders
  if (supplierLines.length === 0) {
    const liveAlloc = runPerKitchenAllocation(
      kitchens,
      items,
      suppliers,
      dayQuotes,
      kitchenOrders,
      null
    );
    supplierLines = liveAlloc.lines
      .filter((l) => l.supplierId === supplier.id && !l.unfulfilled)
      .map((l, idx) => ({
        id: `live_${idx}`,
        kitchenId: l.kitchenId,
        kitchenName: l.kitchenName,
        kitchenColor: l.kitchenColor,
        kitchenNote: l.kitchenNote,
        itemId: l.itemId,
        itemName: l.itemName,
        unit: l.unit,
        qty: l.qty,
        unitPrice: l.unitPrice,
        totalPrice: l.totalPrice,
      }));
  }

  // Group lines by kitchen
  const byKitchen: Record<
    string,
    {
      kitchenId: string;
      kitchenName: string;
      kitchenColor: string;
      kitchenNote?: string;
      items: typeof supplierLines;
      totalKg: number;
      totalCost: number;
    }
  > = {};

  let totalSupplierKg = 0;
  let totalSupplierCost = 0;

  supplierLines.forEach((line) => {
    if (!byKitchen[line.kitchenId]) {
      byKitchen[line.kitchenId] = {
        kitchenId: line.kitchenId,
        kitchenName: line.kitchenName,
        kitchenColor: line.kitchenColor,
        kitchenNote: line.kitchenNote,
        items: [],
        totalKg: 0,
        totalCost: 0,
      };
    }
    byKitchen[line.kitchenId].items.push(line);
    byKitchen[line.kitchenId].totalKg += line.qty;
    byKitchen[line.kitchenId].totalCost += line.totalPrice;
    totalSupplierKg += line.qty;
    totalSupplierCost += line.totalPrice;
  });

  const kitchenBlocks = Object.values(byKitchen);

  // Mark all items of a kitchen as delivered or undelivered
  const toggleAllKitchenDelivered = (kitchenId: string, kitchenItems: typeof supplierLines) => {
    const allChecked = kitchenItems.every((it) => deliveredMap[`${kitchenId}_${it.itemId}`]);
    setDeliveredMap((prev) => {
      const next = { ...prev };
      kitchenItems.forEach((it) => {
        next[`${kitchenId}_${it.itemId}`] = !allChecked;
      });
      if (typeof window !== "undefined") {
        const storageKey = `delivery_checklist_${workingDate}_${supplier.id}`;
        localStorage.setItem(storageKey, JSON.stringify(next));
      }
      return next;
    });
    onNotify(allChecked ? "Đã bỏ tích giao hàng" : "Đã tích giao đủ tất cả món của bếp!");
  };

  // Copy packing list per kitchen
  const handleCopyPackingList = async () => {
    if (supplierLines.length === 0) return;
    let text = `DANH SÁCH ĐƠN HÀNG GIAO TỪNG BẾP (${workingDate})\n`;
    text += `Nhà cung cấp: ${supplier.name}\n`;
    text += `Tổng khối lượng: ${totalSupplierKg} kg\n`;
    text += `====================\n\n`;

    kitchenBlocks.forEach((kb) => {
      text += `📦 ${kb.kitchenName.toUpperCase()}${
        kb.kitchenNote ? ` (${kb.kitchenNote})` : ""
      }:\n`;
      kb.items.forEach((it, idx) => {
        const isDeliv = deliveredMap[`${kb.kitchenId}_${it.itemId}`];
        text += `  ${idx + 1}. ${it.itemName}: ${it.qty} ${it.unit} ${
          isDeliv ? "[ĐÃ GIAO ĐỦ]" : ""
        }\n`;
      });
      text += `  -> Tổng ${kb.kitchenName}: ${kb.totalKg} kg\n\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopiedPackingList(true);
      setTimeout(() => setCopiedPackingList(false), 2500);
      onNotify("Đã sao chép danh sách đơn đóng gói theo từng bếp!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedPackingList(true);
      setTimeout(() => setCopiedPackingList(false), 2500);
      onNotify("Đã sao chép danh sách đơn đóng gói theo từng bếp!");
    }
  };

  return (
    <section className="animate-view space-y-4 pb-28 max-w-full overflow-x-hidden">
      {/* 1. Supplier Top Profile Banner */}
      <div className="ios-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
                Cổng Nhà Cung Cấp Độc Lập
              </span>
              <span className="text-xs text-[#8E8E93]">•</span>
              <span className="text-xs font-semibold text-[#1C1C1E] tnum">
                {workingDate}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1C1E] tracking-tight">
              {supplier.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8E8E93]">
              <span className="flex items-center gap-1 font-mono text-[#007AFF]">
                <Phone className="w-3.5 h-3.5" />
                <span>{supplier.phone || "Chưa có SĐT"}</span>
              </span>
              {supplier.note && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>{supplier.note}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenSelfProfileModal}
              className="px-3 py-1.5 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#8E8E93]" />
              <span>Sửa thông tin</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddItemModal}
              className="px-3 py-1.5 rounded-full bg-[#1C1C1E] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm mặt hàng</span>
            </button>

            <button
              type="button"
              onClick={onExitSupplierMode}
              className="p-2 rounded-full bg-[#767680]/10 hover:bg-[#FF3B30]/10 text-[#8E8E93] hover:text-[#FF3B30] transition active:scale-95"
              title="Thoát cổng NCC (Về Admin)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Cupertino Segmented Tabs: Switch between "Báo Giá" and "Đơn Hàng Đã Đặt" */}
        <div className="grid grid-cols-2 gap-1 bg-[#767680]/12 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
              activeTab === "quotes"
                ? "bg-white text-[#1C1C1E] shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Báo Giá Sản Phẩm</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-2 relative ${
              activeTab === "orders"
                ? "bg-white text-[#34C759] shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn Hàng Nhận Được</span>
            {totalSupplierKg > 0 && (
              <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                {kitchenBlocks.length} bếp · {totalSupplierKg}kg
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: QUOTES MANAGEMENT (BÁO GIÁ SẢN PHẨM CỦA NCC) */}
      {/* ======================================================== */}
      {activeTab === "quotes" && (
        <div className="space-y-3 animate-view">
          {/* Quick Utility Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1C1C1E]">
                {items.length} mặt hàng
              </span>
              <span className="text-xs text-[#248A3D] font-bold bg-[#34C759]/15 px-2 py-0.5 rounded-full">
                {inStockCount} món còn hàng
              </span>
              {outStockCount > 0 && (
                <span className="text-xs text-[#FF3B30] font-bold bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                  {outStockCount} món hết hàng
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-48">
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
                onClick={onCopyYesterday}
                className="px-3 py-1.5 rounded-full bg-white border border-[#3C3C43]/15 hover:bg-[#F2F2F7] text-[#1C1C1E] text-xs font-semibold transition active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Sao chép toàn bộ giá từ ngày hôm trước"
              >
                <Copy className="w-3 h-3 text-[#8E8E93]" />
                <span>Chép hôm qua</span>
              </button>

              <button
                type="button"
                onClick={onSetAllInStock}
                className="px-3 py-1.5 rounded-full bg-[#34C759]/15 hover:bg-[#34C759]/20 text-[#248A3D] text-xs font-bold transition active:scale-95 flex items-center gap-1"
                title="Bật còn hàng cho tất cả mặt hàng"
              >
                <CheckCheck className="w-3.5 h-3.5 text-[#34C759]" />
                <span>Còn hàng tất cả</span>
              </button>
            </div>
          </div>

          {/* Inset Grouped Quotes List */}
          <div className="ios-card overflow-hidden divide-y divide-[#3C3C43]/10">
            {!filteredItems.length ? (
              <div className="py-12 text-center text-xs text-[#8E8E93]">
                Không tìm thấy mặt hàng nào phù hợp.
              </div>
            ) : (
              filteredItems.map((item) => {
                const q = dayQuotes[item.id]?.[supplier.id] || {
                  price: item.basePrice,
                  inStock: true,
                };
                const inStock = q.inStock;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.015] transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Tag className="w-4 h-4 text-[#8E8E93] shrink-0" />
                      <div>
                        <div className="font-bold text-[#1C1C1E] text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#8E8E93]">
                          Đơn vị tính: {item.unit}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0">
                      {/* iOS Toggle Switch */}
                      <IosSwitch
                        checked={inStock}
                        onChange={(val) =>
                          onUpdateQuote(item.id, undefined, val)
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
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: RECEIVED ORDERS (ĐƠN HÀNG ĐÃ ĐẶT - CHIA ĐƠN TỪNG BẾP) */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-4 animate-view">
          {/* Orders Header Summary */}
          <div className="ios-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[#1C1C1E]">
                    Đơn Hàng Cần Giao Ngày {workingDate}
                  </h3>
                  {isCommittedOrder ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[10px] font-bold">
                      ✓ Đã chốt đơn
                    </span>
                  ) : totalSupplierKg > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[#D97706] text-[10px] font-bold">
                      Đang lên đơn
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Nhấn vào từng bếp bên dưới để xem mặt hàng và tích chọn kiểm tra giao hàng
                </p>
              </div>

              {totalSupplierKg > 0 && (
                <button
                  type="button"
                  onClick={handleCopyPackingList}
                  className="px-3.5 py-2 rounded-2xl bg-[#34C759] hover:bg-[#28CD41] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1.5 shadow-sm self-start sm:self-auto shrink-0"
                >
                  {copiedPackingList ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép đơn đóng gói</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Metric KPI Widgets for Supplier */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-[#F2F2F7] rounded-xl p-3 border border-black/5">
                <div className="text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#34C759]" />
                  <span>Tổng Khối Lượng</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
                  {totalSupplierKg} kg
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-3 border border-black/5">
                <div className="text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Số Bếp Đặt</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#1C1C1E] mt-1 tnum">
                  {kitchenBlocks.length} bếp
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-3 border border-black/5">
                <div className="text-[11px] font-semibold text-[#8E8E93] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#5856D6]" />
                  <span>Tổng Giá Trị</span>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-[#34C759] mt-1 tnum">
                  {formatVND(totalSupplierCost)}
                </div>
              </div>
            </div>
          </div>

          {/* List of Kitchen Order Accordions (CLICK VÀO TỪNG BẾP ĐỂ MỞ RA MẶT HÀNG & TÍCH GIAO ĐỦ) */}
          <div className="space-y-3">
            {kitchenBlocks.length === 0 ? (
              <div className="ios-card p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center mx-auto text-xl">
                  🛒
                </div>
                <h4 className="font-bold text-sm text-[#1C1C1E]">
                  Chưa có đơn hàng nào cho ngày {workingDate}
                </h4>
                <p className="text-xs text-[#8E8E93] max-w-sm mx-auto">
                  Khi người mua lên đơn hàng và chọn các mặt hàng của bạn, danh sách đơn hàng chia theo từng bếp sẽ xuất hiện tại đây ngay lập tức.
                </p>
              </div>
            ) : (
              kitchenBlocks.map((kb, kIdx) => {
                // By default: first kitchen is expanded, or if user toggled
                const isExpanded =
                  expandedKitchens[kb.kitchenId] !== undefined
                    ? expandedKitchens[kb.kitchenId]
                    : kIdx === 0;

                // Calculate delivery progress for this kitchen
                const deliveredCount = kb.items.filter(
                  (it) => deliveredMap[`${kb.kitchenId}_${it.itemId}`]
                ).length;
                const isAllDelivered = deliveredCount === kb.items.length && kb.items.length > 0;
                const hasPartial = deliveredCount > 0 && !isAllDelivered;

                return (
                  <div
                    key={kb.kitchenId}
                    className="ios-card overflow-hidden transition-all duration-200"
                  >
                    {/* Clickable Kitchen Header (Accordion Trigger) */}
                    <button
                      type="button"
                      onClick={() => toggleKitchenExpand(kb.kitchenId)}
                      className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-black/[0.015] active:bg-black/[0.03] transition select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: kb.kitchenColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-sm sm:text-base text-[#1C1C1E]">
                              {kb.kitchenName.toUpperCase()}
                            </h4>

                            {/* Delivery Status Badge */}
                            {isAllDelivered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D]">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Đã giao đủ ({deliveredCount}/{kb.items.length})</span>
                              </span>
                            ) : hasPartial ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[#D97706]">
                                <span>Đã giao {deliveredCount}/{kb.items.length} món</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#767680]/12 text-[#8E8E93]">
                                <span>Chưa giao (0/{kb.items.length})</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#8E8E93] mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span className="font-semibold text-[#1C1C1E] tnum">
                              {kb.items.length} món · {kb.totalKg} kg
                            </span>
                            <span>•</span>
                            <span className="font-bold text-[#34C759] tnum">
                              {formatVND(kb.totalCost)}
                            </span>
                            {kb.kitchenNote && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline truncate max-w-xs">
                                  {kb.kitchenNote}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand / Collapse Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-[#8E8E93] hidden sm:inline">
                          {isExpanded ? "Thu gọn" : "Xem mặt hàng"}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-[#767680]/12 flex items-center justify-center text-[#1C1C1E]">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expandable Kitchen Content */}
                    {isExpanded && (
                      <div className="border-t border-[#3C3C43]/10 bg-gradient-to-b from-white to-[#F2F2F7]/30">
                        {/* Kitchen Address / Note Bar & Quick Action */}
                        <div className="p-3 sm:px-4 bg-[#F2F2F7]/60 border-b border-[#3C3C43]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="text-[#8E8E93]">
                            📍 Địa chỉ/Ghi chú:{" "}
                            <span className="font-semibold text-[#1C1C1E]">
                              {kb.kitchenNote || "Không có ghi chú"}
                            </span>
                          </div>

                          {/* Quick 1-click button to check/uncheck all for this kitchen */}
                          <button
                            type="button"
                            onClick={() => toggleAllKitchenDelivered(kb.kitchenId, kb.items)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1.5 self-start sm:self-auto ${
                              isAllDelivered
                                ? "bg-[#767680]/15 text-[#1C1C1E]"
                                : "bg-[#34C759]/15 text-[#248A3D] hover:bg-[#34C759]/25"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>
                              {isAllDelivered
                                ? "Bỏ tích giao đủ bếp này"
                                : `Tích giao đủ toàn bộ ${kb.kitchenName}`}
                            </span>
                          </button>
                        </div>

                        {/* List of Items with Delivery Checkboxes */}
                        <div className="divide-y divide-[#3C3C43]/10 text-xs">
                          {kb.items.map((it, idx) => {
                            const isDelivered = !!deliveredMap[`${kb.kitchenId}_${it.itemId}`];

                            return (
                              <div
                                key={idx}
                                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                                  isDelivered ? "bg-[#34C759]/[0.05]" : "hover:bg-black/[0.015]"
                                }`}
                              >
                                {/* Item Details */}
                                <div className="flex items-start sm:items-center gap-3 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-[#767680]/12 text-[#1C1C1E] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                    {idx + 1}
                                  </span>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-bold text-sm truncate ${
                                          isDelivered
                                            ? "text-[#1C1C1E]"
                                            : "text-[#1C1C1E]"
                                        }`}
                                      >
                                        {it.itemName}
                                      </span>
                                      <span className="text-[11px] text-[#8E8E93] font-mono bg-[#767680]/10 px-1.5 py-0.2 rounded shrink-0">
                                        /{it.unit}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-[#8E8E93] mt-0.5">
                                      Đơn giá: {formatVND(it.unitPrice)} • Thành tiền:{" "}
                                      <strong className="text-[#34C759] font-bold">
                                        {formatVND(it.totalPrice)}
                                      </strong>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Quantity & Interactive Delivery Checklist Button */}
                                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pl-8 sm:pl-0">
                                  <div className="text-left sm:text-right">
                                    <div className="text-sm font-extrabold text-[#1C1C1E] tnum">
                                      {it.qty} {it.unit}
                                    </div>
                                  </div>

                                  {/* TÍCH CHỌN ĐÃ GIAO ĐỦ / CHƯA GIAO */}
                                  <button
                                    type="button"
                                    onClick={() => toggleDelivered(kb.kitchenId, it.itemId)}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 flex items-center gap-2 active:scale-95 cursor-pointer shadow-2xs select-none ${
                                      isDelivered
                                        ? "bg-[#34C759] border-[#34C759] text-white"
                                        : "bg-white border-[#3C3C43]/20 text-[#1C1C1E] hover:border-[#34C759]"
                                    }`}
                                    title="Chạm để đánh dấu đã giao đủ hay chưa"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded-md flex items-center justify-center transition ${
                                        isDelivered
                                          ? "bg-white text-[#34C759]"
                                          : "border border-[#8E8E93] bg-[#F2F2F7]"
                                      }`}
                                    >
                                      {isDelivered && (
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      )}
                                    </div>
                                    <span>
                                      {isDelivered ? "Đã giao đủ" : "Chưa giao"}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Kitchen Subtotal Footer */}
                        <div className="p-3.5 bg-[#F2F2F7]/50 border-t border-[#3C3C43]/10 flex items-center justify-between text-xs text-[#8E8E93]">
                          <span>
                            Đóng gói riêng cho <strong>{kb.kitchenName}</strong>
                          </span>
                          <span className="font-extrabold text-[#1C1C1E]">
                            Tổng {kb.kitchenName}: {kb.totalKg} kg ({formatVND(kb.totalCost)})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
}
