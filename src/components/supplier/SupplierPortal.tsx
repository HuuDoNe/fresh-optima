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
  Phone,
  MapPin,
  ShoppingBag,
  Tag,
  Package,
  Truck,
  Utensils,
  ChevronDown,
  ChevronUp,
  Check,
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
    <section className="space-y-3 pb-24 max-w-full overflow-x-hidden">
      {/* 1. Supplier Top Profile Card */}
      <div className="ios-card p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#248A3D]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34C759]" />
              <span>Cổng Nhà Cung Cấp</span>
              <span className="text-[#8E8E93] font-normal">• {workingDate}</span>
            </div>
            <h1 className="text-base font-extrabold text-[#1C1C1E] tracking-tight truncate mt-0.5">
              {supplier.name}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onOpenSelfProfileModal}
              className="p-1.5 rounded-full bg-[#767680]/10 hover:bg-[#767680]/15 text-[#1C1C1E] transition active:scale-90"
              title="Sửa thông tin"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#8E8E93]" />
            </button>
            <button
              type="button"
              onClick={onOpenAddItemModal}
              className="p-1.5 rounded-full bg-[#1C1C1E] text-white transition active:scale-90 shadow-2xs"
              title="Thêm mặt hàng mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExitSupplierMode}
              className="p-1.5 rounded-full bg-[#767680]/10 hover:bg-[#FF3B30]/10 text-[#8E8E93] hover:text-[#FF3B30] transition active:scale-90"
              title="Đổi vai trò"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {(supplier.phone || supplier.note) && (
          <div className="flex items-center gap-3 text-[11px] text-[#8E8E93] pt-0.5 border-t border-[#3C3C43]/10">
            {supplier.phone && (
              <span className="flex items-center gap-1 font-mono text-[#007AFF]">
                <Phone className="w-3 h-3" />
                <span>{supplier.phone}</span>
              </span>
            )}
            {supplier.note && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-[#8E8E93] shrink-0" />
                <span className="truncate">{supplier.note}</span>
              </span>
            )}
          </div>
        )}

        {/* Cupertino Segmented Tabs: Switch between "Báo Giá" and "Đơn Hàng Đã Đặt" */}
        <div className="grid grid-cols-2 gap-1 bg-[#767680]/12 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === "quotes"
                ? "bg-white text-[#1C1C1E] shadow-2xs"
                : "text-[#8E8E93]"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Báo Giá</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 relative ${
              activeTab === "orders"
                ? "bg-white text-[#34C759] shadow-2xs"
                : "text-[#8E8E93]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Đơn Nhận Được</span>
            {totalSupplierKg > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF3B30] text-white text-[10px] font-extrabold">
                {kitchenBlocks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: QUOTES MANAGEMENT (BÁO GIÁ SẢN PHẨM CỦA NCC) */}
      {/* ======================================================== */}
      {activeTab === "quotes" && (
        <div className="space-y-2.5">
          {/* Quick Stats & Controls Bar */}
          <div className="flex items-center justify-between gap-1.5 px-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-[#1C1C1E]">{items.length} món</span>
              <span className="text-[#34C759] bg-[#34C759]/12 px-1.5 py-0.2 rounded-full">
                {inStockCount} còn
              </span>
              {outStockCount > 0 && (
                <span className="text-[#FF3B30] bg-[#FF3B30]/10 px-1.5 py-0.2 rounded-full">
                  {outStockCount} hết
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCopyYesterday}
                className="px-2 py-1 rounded-full bg-white border border-[#3C3C43]/15 text-[#1C1C1E] text-[11px] font-semibold transition active:scale-95 flex items-center gap-1 shadow-2xs"
                title="Sao chép toàn bộ giá từ ngày hôm trước"
              >
                <Copy className="w-3 h-3 text-[#8E8E93]" />
                <span>Hôm qua</span>
              </button>

              <button
                type="button"
                onClick={onSetAllInStock}
                className="px-2 py-1 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                title="Bật còn hàng cho tất cả"
              >
                <CheckCheck className="w-3 h-3 text-[#34C759]" />
                <span>Còn tất cả</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8E8E93]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mặt hàng rau củ..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#3C3C43]/15 rounded-xl focus:outline-none focus:border-[#34C759] shadow-2xs placeholder-[#8E8E93]"
            />
          </div>

          {/* Compact Single-Line Quotes List */}
          <div className="ios-card overflow-hidden divide-y divide-[#3C3C43]/10">
            {!filteredItems.length ? (
              <div className="py-8 text-center text-xs text-[#8E8E93]">
                Không tìm thấy mặt hàng nào.
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
                    className="p-2.5 flex items-center justify-between gap-2 hover:bg-black/[0.015] transition"
                  >
                    {/* Item Info */}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#1C1C1E] text-xs truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[#8E8E93]">
                        ĐVT: {item.unit}
                      </div>
                    </div>

                    {/* Right: Switch & Price */}
                    <div className="flex items-center gap-2 shrink-0">
                      <IosSwitch
                        checked={inStock}
                        onChange={(val) =>
                          onUpdateQuote(item.id, undefined, val)
                        }
                      />

                      <div className="flex items-center bg-[#F2F2F7] rounded-lg px-2 py-1 border border-black/5 focus-within:border-[#34C759] focus-within:bg-white shadow-2xs">
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
                          className="w-16 text-right text-xs font-bold text-[#1C1C1E] focus:outline-none tnum"
                        />
                        <span className="text-[10px] text-[#8E8E93] font-semibold ml-0.5">
                          đ
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
        <div className="space-y-3">
          {/* Orders Header Summary */}
          <div className="ios-card p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-[#1C1C1E] truncate">
                    Đơn Giao Ngày {workingDate}
                  </h3>
                  {isCommittedOrder ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[9px] font-bold shrink-0">
                      ✓ Đã chốt
                    </span>
                  ) : totalSupplierKg > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FF9500]/15 text-[#D97706] text-[9px] font-bold shrink-0">
                      Đang lên
                    </span>
                  ) : null}
                </div>
              </div>

              {totalSupplierKg > 0 && (
                <button
                  type="button"
                  onClick={handleCopyPackingList}
                  className="px-2.5 py-1 rounded-xl bg-[#34C759] hover:bg-[#28CD41] text-white text-[11px] font-bold transition active:scale-95 flex items-center gap-1 shadow-2xs shrink-0"
                >
                  {copiedPackingList ? (
                    <>
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Chép đóng gói</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Metric KPI Widgets for Supplier */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5 text-center">
                <div className="text-[10px] font-semibold text-[#8E8E93] flex items-center justify-center gap-0.5">
                  <Package className="w-3 h-3 text-[#34C759]" />
                  <span>Tổng Kg</span>
                </div>
                <div className="text-xs font-black text-[#1C1C1E] mt-0.5 tnum">
                  {totalSupplierKg} kg
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5 text-center">
                <div className="text-[10px] font-semibold text-[#8E8E93] flex items-center justify-center gap-0.5">
                  <Utensils className="w-3 h-3 text-[#007AFF]" />
                  <span>Số Bếp</span>
                </div>
                <div className="text-xs font-black text-[#1C1C1E] mt-0.5 tnum">
                  {kitchenBlocks.length} bếp
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-2 border border-black/5 text-center">
                <div className="text-[10px] font-semibold text-[#8E8E93] flex items-center justify-center gap-0.5">
                  <Truck className="w-3 h-3 text-[#5856D6]" />
                  <span>Giá Trị</span>
                </div>
                <div className="text-xs font-black text-[#34C759] mt-0.5 tnum truncate">
                  {formatVND(totalSupplierCost)}
                </div>
              </div>
            </div>
          </div>

          {/* List of Kitchen Order Accordions */}
          <div className="space-y-2">
            {kitchenBlocks.length === 0 ? (
              <div className="ios-card p-8 text-center space-y-2">
                <div className="text-2xl">🛒</div>
                <h4 className="font-bold text-xs text-[#1C1C1E]">
                  Chưa có đơn hàng nào
                </h4>
                <p className="text-[11px] text-[#8E8E93]">
                  Đơn đặt của các bếp sẽ hiển thị tại đây khi bên mua tiến hành đặt hàng.
                </p>
              </div>
            ) : (
              kitchenBlocks.map((kb, kIdx) => {
                const isExpanded =
                  expandedKitchens[kb.kitchenId] !== undefined
                    ? expandedKitchens[kb.kitchenId]
                    : kIdx === 0;

                const deliveredCount = kb.items.filter(
                  (it) => deliveredMap[`${kb.kitchenId}_${it.itemId}`]
                ).length;
                const isAllDelivered =
                  deliveredCount === kb.items.length && kb.items.length > 0;
                const hasPartial = deliveredCount > 0 && !isAllDelivered;

                return (
                  <div
                    key={kb.kitchenId}
                    className="ios-card overflow-hidden transition-all duration-200"
                  >
                    {/* Clickable Kitchen Header */}
                    <button
                      type="button"
                      onClick={() => toggleKitchenExpand(kb.kitchenId)}
                      className="w-full p-3 flex items-center justify-between gap-2 text-left hover:bg-black/[0.015] active:bg-black/[0.03] transition select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: kb.kitchenColor }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-xs text-[#1C1C1E] truncate">
                              {kb.kitchenName.toUpperCase()}
                            </h4>

                            {isAllDelivered ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#34C759]/15 text-[#248A3D] shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>Đủ ({deliveredCount}/{kb.items.length})</span>
                              </span>
                            ) : hasPartial ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FF9500]/15 text-[#D97706] shrink-0">
                                <span>{deliveredCount}/{kb.items.length}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#767680]/12 text-[#8E8E93] shrink-0">
                                <span>0/{kb.items.length}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#8E8E93] mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-[#1C1C1E] tnum">
                              {kb.items.length} món · {kb.totalKg} kg
                            </span>
                            <span>•</span>
                            <span className="font-bold text-[#34C759] tnum">
                              {formatVND(kb.totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expand / Collapse Chevron */}
                      <div className="w-6 h-6 rounded-full bg-[#767680]/10 flex items-center justify-center text-[#1C1C1E] shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </button>

                    {/* Expandable Kitchen Content */}
                    {isExpanded && (
                      <div className="border-t border-[#3C3C43]/10 bg-[#F9F9F9]/40">
                        {/* 1-Click Action Bar */}
                        <div className="p-2 px-3 bg-[#F2F2F7]/60 border-b border-[#3C3C43]/10 flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-[#8E8E93] truncate">
                            {kb.kitchenNote ? `📍 ${kb.kitchenNote}` : "Từng món giao:"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              toggleAllKitchenDelivered(kb.kitchenId, kb.items)
                            }
                            className={`px-2 py-1 rounded-full text-[10px] font-bold transition active:scale-95 flex items-center gap-1 shrink-0 ${
                              isAllDelivered
                                ? "bg-[#767680]/15 text-[#1C1C1E]"
                                : "bg-[#34C759]/15 text-[#248A3D]"
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                            <span>
                              {isAllDelivered ? "Bỏ tích tất cả" : "Giao đủ tất cả"}
                            </span>
                          </button>
                        </div>

                        {/* List of Items with Delivery Checkboxes */}
                        <div className="divide-y divide-[#3C3C43]/10 text-xs">
                          {kb.items.map((it, idx) => {
                            const isDelivered =
                              !!deliveredMap[`${kb.kitchenId}_${it.itemId}`];

                            return (
                              <div
                                key={idx}
                                className={`p-2.5 flex items-center justify-between gap-2 transition ${
                                  isDelivered
                                    ? "bg-[#34C759]/[0.05]"
                                    : "hover:bg-black/[0.015]"
                                }`}
                              >
                                {/* Item Details */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs text-[#1C1C1E] truncate">
                                      {it.itemName}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#8E8E93]">
                                    {formatVND(it.unitPrice)}/{it.unit} •{" "}
                                    <strong className="text-[#34C759] font-bold">
                                      {formatVND(it.totalPrice)}
                                    </strong>
                                  </div>
                                </div>

                                {/* Right: Quantity & Checklist Button */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-black text-[#1C1C1E] tnum">
                                    {it.qty} {it.unit}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleDelivered(kb.kitchenId, it.itemId)
                                    }
                                    className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all duration-150 flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs select-none ${
                                      isDelivered
                                        ? "bg-[#34C759] border-[#34C759] text-white"
                                        : "bg-white border-[#3C3C43]/20 text-[#8E8E93]"
                                    }`}
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>
                                      {isDelivered ? "Đã giao" : "Chưa"}
                                    </span>
                                  </button>
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
        </div>
      )}
    </section>
  );
}
