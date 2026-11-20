"use client";

import React, { useState, useEffect, useRef } from "react";
import { KitchenData, SessionState } from "@/lib/types";
import { formatVND } from "@/lib/optimizer";
import {
  Camera,
  Image as ImageIcon,
  ClipboardCheck,
  BarChart3,
  Plus,
  Trash2,
  Maximize2,
  X,
  Check,
  Copy,
  Upload,
  RefreshCw,
  Beef,
  Flame,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export interface MeatItem {
  id: string;
  name: string;
  category?: "heo" | "bo" | "ga" | "khac";
  orderKg: number;
  actualKg?: number;
  unitPrice?: number;
  isPacked: boolean;
  note?: string;
}

export interface KitchenMeatOrder {
  kitchenId: string;
  items: MeatItem[];
  photoUrl?: string;
  photoDate?: string;
}

interface TabMeatOrderProps {
  workingDate: string;
  kitchens: KitchenData[];
  session: SessionState;
  onNotify: (msg: string, type?: "default" | "warn") => void;
}

// Generate sample realistic order slip SVG
function getSampleSlipSvg(
  kitchenName: string,
  date: string,
  items: Array<{ name: string; qty: number }>
) {
  const itemsText = items
    .map(
      (it, idx) => `
    <text x="32" y="${165 + idx * 30}" font-family="sans-serif" font-size="13" font-weight="600" fill="#1C1C1E">${idx + 1}. ${it.name}</text>
    <text x="330" y="${165 + idx * 30}" font-family="monospace, sans-serif" font-size="13" font-weight="bold" fill="#059669">${it.qty} kg</text>
  `
    )
    .join("");

  const totalKg = items.reduce((acc, it) => acc + it.qty, 0);

  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="420" viewBox="0 0 380 420">
    <rect width="380" height="420" rx="18" fill="#FAFAF8" stroke="#E5E5EA" stroke-width="2"/>
    <rect x="16" y="16" width="348" height="388" rx="12" fill="#FFFFFF" stroke="#C7C7CC" stroke-width="1" stroke-dasharray="4 4"/>
    <text x="190" y="55" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="800" fill="#1C1C1E">PHIẾU ĐẶT HÀNG THỊT TƯƠI</text>
    <text x="190" y="80" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#007AFF">${kitchenName.toUpperCase()}</text>
    <text x="190" y="100" text-anchor="middle" font-family="monospace, sans-serif" font-size="11" fill="#8E8E93">Ngày giao: ${date}</text>
    <line x1="28" y1="120" x2="352" y2="120" stroke="#E5E5EA" stroke-width="1.5"/>
    <text x="32" y="140" font-family="sans-serif" font-size="11" font-weight="bold" fill="#8E8E93">TÊN MẶT HÀNG</text>
    <text x="330" y="140" font-family="sans-serif" font-size="11" font-weight="bold" fill="#8E8E93">SỐ LƯỢNG</text>
    ${itemsText}
    <line x1="28" y1="320" x2="352" y2="320" stroke="#E5E5EA" stroke-width="1.5"/>
    <text x="32" y="345" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1C1C1E">TỔNG KHỐI LƯỢNG:</text>
    <text x="330" y="345" font-family="monospace, sans-serif" font-size="14" font-weight="800" fill="#34C759">${totalKg} kg</text>
    <text x="32" y="375" font-family="sans-serif" font-size="11" fill="#8E8E93">Ký duyệt: Bếp trưởng ✓</text>
    <rect x="250" y="355" width="95" height="26" rx="6" fill="#34C759" fill-opacity="0.15" stroke="#34C759" stroke-width="1"/>
    <text x="297" y="372" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="bold" fill="#248A3D">ĐÃ XÁC NHẬN</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
}

// Initial mock meat order database
function getInitialMeatOrders(kitchens: KitchenData[], date: string): Record<string, KitchenMeatOrder> {
  const result: Record<string, KitchenMeatOrder> = {};

  const templates: Record<string, MeatItem[]> = {
    k1: [
      { id: "m1", name: "Thịt ba chỉ heo rút sườn", category: "heo", orderKg: 20, actualKg: 20.2, unitPrice: 140000, isPacked: true },
      { id: "m2", name: "Sườn non heo tươi", category: "heo", orderKg: 15, actualKg: 15.0, unitPrice: 160000, isPacked: true },
      { id: "m3", name: "Thịt bò phi lê mềm", category: "bo", orderKg: 10, actualKg: 10.0, unitPrice: 270000, isPacked: false },
      { id: "m4", name: "Đùi gà góc tư tươi", category: "ga", orderKg: 25, actualKg: 25.5, unitPrice: 58000, isPacked: false },
    ],
    k2: [
      { id: "m5", name: "Nạc dăm heo tươi", category: "heo", orderKg: 18, actualKg: 18.0, unitPrice: 125000, isPacked: true },
      { id: "m6", name: "Thịt heo xay loại 1", category: "heo", orderKg: 12, actualKg: 12.0, unitPrice: 110000, isPacked: true },
      { id: "m7", name: "Bắp bò hoa giòn", category: "bo", orderKg: 8, actualKg: 8.2, unitPrice: 250000, isPacked: true },
      { id: "m8", name: "Đùi gà góc tư tươi", category: "ga", orderKg: 30, actualKg: 30.0, unitPrice: 58000, isPacked: false },
    ],
    k3: [
      { id: "m9", name: "Thịt ba chỉ heo", category: "heo", orderKg: 15, actualKg: 15.0, unitPrice: 135000, isPacked: false },
      { id: "m10", name: "Sườn non heo tươi", category: "heo", orderKg: 12, actualKg: 12.0, unitPrice: 160000, isPacked: false },
      { id: "m11", name: "Gà ta nguyên con thả vườn", category: "ga", orderKg: 20, actualKg: 20.4, unitPrice: 95000, isPacked: false },
    ],
  };

  kitchens.forEach((k) => {
    const items = templates[k.id] || [
      { id: `m_${k.id}_1`, name: "Thịt nạc vai heo", category: "heo", orderKg: 15, actualKg: 15, unitPrice: 120000, isPacked: false },
      { id: `m_${k.id}_2`, name: "Thịt gà tươi sạch", category: "ga", orderKg: 20, actualKg: 20, unitPrice: 65000, isPacked: false },
    ];

    result[k.id] = {
      kitchenId: k.id,
      items,
      photoUrl: getSampleSlipSvg(k.name, date, items.map((it) => ({ name: it.name, qty: it.orderKg }))),
      photoDate: date,
    };
  });

  return result;
}

export function TabMeatOrder({
  workingDate,
  kitchens,
  session,
  onNotify,
}: TabMeatOrderProps) {
  // 3 Sub-tabs: 1. "photos" (Xem ảnh đơn) | 2. "packing" (Soạn hàng) | 3. "reports" (Báo cáo)
  const [activeSubTab, setActiveSubTab] = useState<"photos" | "packing" | "reports">("photos");

  // Active Kitchen Selector
  const defaultKitchenId =
    session.role === "kitchen" && session.kitchenId
      ? session.kitchenId
      : kitchens[0]?.id || "k1";

  const [selectedKitchenId, setSelectedKitchenId] = useState<string>(defaultKitchenId);

  // Meat orders data per kitchen
  const [meatOrders, setMeatOrders] = useState<Record<string, KitchenMeatOrder>>({});

  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Add Item modal state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemKg, setNewItemKg] = useState<number>(10);

  // File input ref for camera/upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize selectedKitchenId when role is kitchen
  useEffect(() => {
    if (session.role === "kitchen" && session.kitchenId) {
      setSelectedKitchenId(session.kitchenId);
    }
  }, [session.role, session.kitchenId]);

  // Load meat orders from localStorage or initialize with mock data
  useEffect(() => {
    if (typeof window !== "undefined" && kitchens.length > 0) {
      const storageKey = `freshoptima_meat_${workingDate}`;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setMeatOrders(JSON.parse(saved));
        } else {
          const initial = getInitialMeatOrders(kitchens, workingDate);
          setMeatOrders(initial);
          localStorage.setItem(storageKey, JSON.stringify(initial));
        }
      } catch {
        const initial = getInitialMeatOrders(kitchens, workingDate);
        setMeatOrders(initial);
      }
    }
  }, [workingDate, kitchens]);

  // Save meat orders to localStorage helper
  const saveOrders = (updated: Record<string, KitchenMeatOrder>) => {
    setMeatOrders(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`freshoptima_meat_${workingDate}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  // Current active kitchen's order
  const currentKitchenOrder =
    meatOrders[selectedKitchenId] || {
      kitchenId: selectedKitchenId,
      items: [],
      photoUrl: undefined,
    };

  const activeKitchenData = kitchens.find((k) => k.id === selectedKitchenId) || kitchens[0];

  // ==========================================
  // TAB 1 ACTIONS: PHOTOS
  // ==========================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const updated = {
        ...meatOrders,
        [selectedKitchenId]: {
          ...currentKitchenOrder,
          photoUrl: base64,
          photoDate: workingDate,
        },
      };
      saveOrders(updated);
      onNotify(`Đã tải lên ảnh đơn hàng thịt cho ${activeKitchenData?.name || "Bếp"}!`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeletePhoto = () => {
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        photoUrl: undefined,
      },
    };
    saveOrders(updated);
    onNotify("Đã xóa ảnh đơn hàng");
  };

  const handleResetSamplePhoto = () => {
    const slipSvg = getSampleSlipSvg(
      activeKitchenData?.name || "Bếp",
      workingDate,
      currentKitchenOrder.items.map((it) => ({ name: it.name, qty: it.orderKg }))
    );
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        photoUrl: slipSvg,
        photoDate: workingDate,
      },
    };
    saveOrders(updated);
    onNotify("Đã khôi phục ảnh phiếu mẫu đơn thịt");
  };

  // ==========================================
  // TAB 2 ACTIONS: PACKING
  // ==========================================
  const toggleItemPacked = (itemId: string) => {
    const updatedItems = currentKitchenOrder.items.map((it) =>
      it.id === itemId ? { ...it, isPacked: !it.isPacked } : it
    );
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        items: updatedItems,
      },
    };
    saveOrders(updated);
  };

  const updateActualKg = (itemId: string, actualKg: number) => {
    const updatedItems = currentKitchenOrder.items.map((it) =>
      it.id === itemId ? { ...it, actualKg } : it
    );
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        items: updatedItems,
      },
    };
    saveOrders(updated);
  };

  const adjustActualKg = (itemId: string, delta: number) => {
    const item = currentKitchenOrder.items.find((it) => it.id === itemId);
    if (!item) return;
    const current = item.actualKg !== undefined ? item.actualKg : item.orderKg;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    updateActualKg(itemId, next);
  };

  const toggleAllKitchenPacked = () => {
    const allPacked = currentKitchenOrder.items.every((it) => it.isPacked);
    const updatedItems = currentKitchenOrder.items.map((it) => ({
      ...it,
      isPacked: !allPacked,
    }));
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        items: updatedItems,
      },
    };
    saveOrders(updated);
    onNotify(allPacked ? "Đã bỏ tích hoàn thành" : "Đã tích soạn đủ tất cả món thịt!");
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || newItemKg <= 0) return;
    const newItem: MeatItem = {
      id: `meat_custom_${Date.now()}`,
      name: newItemName.trim(),
      orderKg: newItemKg,
      actualKg: newItemKg,
      isPacked: false,
    };
    const updatedItems = [...currentKitchenOrder.items, newItem];
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        items: updatedItems,
      },
    };
    saveOrders(updated);
    setNewItemName("");
    setIsAddItemOpen(false);
    onNotify(`Đã thêm "${newItem.name}" vào đơn thịt`);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = currentKitchenOrder.items.filter((it) => it.id !== itemId);
    const updated = {
      ...meatOrders,
      [selectedKitchenId]: {
        ...currentKitchenOrder,
        items: updatedItems,
      },
    };
    saveOrders(updated);
    onNotify("Đã xóa món thịt");
  };

  // Copy packing list for Zalo
  const handleCopyPackingList = async () => {
    let text = `DANH SÁCH SOẠN ĐƠN THỊT (${workingDate})\n`;
    text += `Bếp: ${activeKitchenData?.name || "Bếp Ăn"}\n`;
    text += `====================\n\n`;

    currentKitchenOrder.items.forEach((it, idx) => {
      text += `${idx + 1}. ${it.name}: ${it.orderKg} kg ${
        it.isPacked ? "[✓ ĐÃ SOẠN]" : "[CHƯA SOẠN]"
      } (Cân thực tế: ${it.actualKg || it.orderKg} kg)\n`;
    });

    const totalKg = currentKitchenOrder.items.reduce((acc, it) => acc + (it.actualKg || it.orderKg), 0);
    text += `\n-> Tổng khối lượng: ${totalKg} kg\n`;

    try {
      await navigator.clipboard.writeText(text);
      onNotify("Đã sao chép danh sách soạn thịt!");
    } catch {
      onNotify("Không thể sao chép", "warn");
    }
  };

  // ==========================================
  // TAB 3 ACTIONS: REPORTS CALCULATIONS
  // ==========================================
  // Available kitchens based on role
  const displayKitchens =
    session.role === "kitchen" && session.kitchenId
      ? kitchens.filter((k) => k.id === session.kitchenId)
      : kitchens;

  let grandTotalOrderKg = 0;
  let grandTotalActualKg = 0;
  let totalItemsCount = 0;
  let packedItemsCount = 0;

  displayKitchens.forEach((k) => {
    const kOrder = meatOrders[k.id];
    if (kOrder) {
      kOrder.items.forEach((it) => {
        const kg = it.actualKg !== undefined ? it.actualKg : it.orderKg;
        grandTotalOrderKg += it.orderKg;
        grandTotalActualKg += kg;
        totalItemsCount += 1;
        if (it.isPacked) packedItemsCount += 1;
      });
    }
  });

  const completionPercent =
    totalItemsCount > 0 ? Math.round((packedItemsCount / totalItemsCount) * 100) : 0;

  // Copy full meat report for Zalo (Không kèm giá tiền)
  const handleCopyMeatReport = async () => {
    let text = `BÁO CÁO TỔNG HỢP ĐƠN THỊT NGÀY ${workingDate}\n`;
    text += `Tổng khối lượng: ${grandTotalActualKg.toFixed(1)} kg\n`;
    text += `Tiến độ soạn hàng: ${packedItemsCount}/${totalItemsCount} món (${completionPercent}%)\n`;
    text += `====================\n\n`;

    displayKitchens.forEach((k) => {
      const ko = meatOrders[k.id];
      if (ko && ko.items.length > 0) {
        const kKg = ko.items.reduce((acc, it) => acc + (it.actualKg || it.orderKg), 0);
        const kPacked = ko.items.filter((it) => it.isPacked).length;

        text += `🥩 ${k.name.toUpperCase()}: ${kKg.toFixed(1)} kg - [Đã soạn: ${kPacked}/${ko.items.length}]\n`;
        ko.items.forEach((it) => {
          text += `  • ${it.name}: ${it.actualKg || it.orderKg} kg ${it.isPacked ? "[✓]" : "[○]"}\n`;
        });
        text += `\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(text);
      onNotify("Đã sao chép báo cáo đơn thịt gửi Zalo!");
    } catch {
      onNotify("Không thể sao chép", "warn");
    }
  };

  return (
    <div className="space-y-3 pb-24 max-w-full overflow-x-hidden">
      {/* 1. Header Sub-tab Segment Controller */}
      <div className="bg-[#767680]/12 p-1 rounded-2xl select-none">
        <div className="grid grid-cols-3 gap-1">
          {/* Sub-tab 1: Xem Ảnh Đơn Hàng */}
          <button
            type="button"
            onClick={() => setActiveSubTab("photos")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeSubTab === "photos"
                ? "bg-white text-[#1C1C1E] shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeSubTab === "photos"
                  ? "bg-[#34C759] text-white"
                  : "bg-[#8E8E93]/20 text-[#8E8E93]"
              }`}
            >
              1
            </span>
            <span className="truncate">Xem Ảnh Đơn</span>
          </button>

          {/* Sub-tab 2: Soạn Hàng */}
          <button
            type="button"
            onClick={() => setActiveSubTab("packing")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 relative ${
              activeSubTab === "packing"
                ? "bg-white text-[#1C1C1E] shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeSubTab === "packing"
                  ? "bg-[#34C759] text-white"
                  : "bg-[#8E8E93]/20 text-[#8E8E93]"
              }`}
            >
              2
            </span>
            <span className="truncate">Soạn Hàng</span>
            {currentKitchenOrder.items.some((it) => !it.isPacked) && (
              <span className="w-2 h-2 rounded-full bg-[#FF3B30] absolute top-1.5 right-1.5 shadow-xs" />
            )}
          </button>

          {/* Sub-tab 3: Báo Cáo */}
          <button
            type="button"
            onClick={() => setActiveSubTab("reports")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeSubTab === "reports"
                ? "bg-white text-[#1C1C1E] shadow-sm"
                : "text-[#8E8E93] hover:text-[#1C1C1E]"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeSubTab === "reports"
                  ? "bg-[#34C759] text-white"
                  : "bg-[#8E8E93]/20 text-[#8E8E93]"
              }`}
            >
              3
            </span>
            <span className="truncate">Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Kitchen Selector Chips (For Tab 1 & Tab 2) */}
      {activeSubTab !== "reports" && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          {displayKitchens.map((k) => {
            const active = selectedKitchenId === k.id;
            const kOrder = meatOrders[k.id];
            const itemCount = kOrder ? kOrder.items.length : 0;
            const packedCount = kOrder ? kOrder.items.filter((it) => it.isPacked).length : 0;

            return (
              <button
                key={k.id}
                type="button"
                onClick={() => setSelectedKitchenId(k.id)}
                disabled={session.role === "kitchen" && session.kitchenId !== k.id}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-2xs ${
                  active
                    ? "bg-[#1C1C1E] text-white"
                    : "bg-white text-[#1C1C1E] border border-black/5 hover:bg-[#F2F2F7]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: k.color }}
                />
                <span>{k.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-[#767680]/10 text-[#8E8E93]"
                  }`}
                >
                  {packedCount}/{itemCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: XEM ẢNH ĐƠN HÀNG THỊT */}
      {/* ======================================================== */}
      {activeSubTab === "photos" && (
        <div className="space-y-3 animate-view">
          {/* Top Action Bar */}
          <div className="ios-card p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#007AFF]" />
                  <span>Ảnh Đơn Thịt {activeKitchenData?.name}</span>
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Xem phiếu đơn chụp từ bếp hoặc tải lên ảnh đơn hàng mới
                </p>
              </div>

              {/* Upload / Camera Button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-2xs"
                  title="Chụp hoặc tải ảnh mới"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chụp / Tải ảnh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photo Display Card */}
          <div className="ios-card overflow-hidden p-3 space-y-3">
            {currentKitchenOrder.photoUrl ? (
              <div className="space-y-2.5">
                <div className="relative rounded-2xl overflow-hidden border border-black/5 bg-[#FAFAF8] group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentKitchenOrder.photoUrl}
                    alt="Phiếu đơn thịt"
                    className="w-full max-h-[380px] object-contain mx-auto select-none transition-transform duration-200"
                  />

                  {/* Quick Action Overlay Buttons */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setLightboxImage({
                          url: currentKitchenOrder.photoUrl!,
                          title: `Phiếu Đơn Thịt - ${activeKitchenData?.name} (${workingDate})`,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1 shadow-md active:scale-95 transition"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Phóng to</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeletePhoto}
                      className="p-1.5 rounded-xl bg-black/75 backdrop-blur-md text-[#FF3B30] hover:text-white hover:bg-[#FF3B30] shadow-md active:scale-95 transition"
                      title="Xóa ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1">
                  <span>
                    Phiếu xác nhận ngày: <strong>{workingDate}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetSamplePhoto}
                    className="text-[11px] text-[#007AFF] font-medium flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Mẫu phiếu mẫu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F2F2F7] text-[#8E8E93] flex items-center justify-center mx-auto text-xl">
                  📷
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#1C1C1E]">
                    Chưa có ảnh đơn hàng thịt cho {activeKitchenData?.name}
                  </h4>
                  <p className="text-[11px] text-[#8E8E93] max-w-xs mx-auto mt-0.5">
                    Chụp trực tiếp bằng camera điện thoại hoặc tải ảnh chụp phiếu đặt thịt
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-full bg-[#007AFF] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh lên</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSamplePhoto}
                    className="px-3 py-1.5 rounded-full bg-white border border-[#3C3C43]/15 text-[#1C1C1E] text-xs font-semibold transition active:scale-95"
                  >
                    Dùng ảnh mẫu
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Proceed to Step 2 Button */}
            <div className="pt-2 border-t border-[#3C3C43]/10">
              <button
                type="button"
                onClick={() => {
                  setActiveSubTab("packing");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full py-2.5 rounded-2xl bg-[#34C759] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition"
              >
                <span>Tiến Hành Soạn Hàng (Bước 2)</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: SOẠN HÀNG (CHECKLIST SOẠN ĐƠN THỊT) */}
      {/* ======================================================== */}
      {activeSubTab === "packing" && (
        <div className="space-y-3 animate-view">
          {/* Packing Summary Header Card */}
          <div className="ios-card p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-[#1C1C1E]">
                    Soạn Thịt {activeKitchenData?.name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#34C759]/15 text-[#248A3D]">
                    {currentKitchenOrder.items.filter((it) => it.isPacked).length}/
                    {currentKitchenOrder.items.length} món
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-0.5">
                  Tích chọn các món đã cân và soạn xong cho bếp
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleAllKitchenPacked}
                  className="px-2.5 py-1.5 rounded-xl bg-[#34C759]/15 text-[#248A3D] text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Soạn đủ</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPackingList}
                  className="p-1.5 rounded-xl bg-[#767680]/10 text-[#1C1C1E] transition active:scale-95"
                  title="Sao chép danh sách soạn"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(true)}
                  className="p-1.5 rounded-xl bg-[#1C1C1E] text-white transition active:scale-95 shadow-2xs"
                  title="Thêm món thịt mới"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#3C3C43]/10 text-xs">
              <div className="bg-[#F2F2F7] rounded-xl p-2 text-center">
                <span className="text-[10px] text-[#8E8E93] font-semibold">Tổng Cần Soạn</span>
                <div className="font-black text-[#1C1C1E] text-sm mt-0.5 tnum">
                  {currentKitchenOrder.items.reduce((acc, it) => acc + it.orderKg, 0)} kg
                </div>
              </div>
              <div className="bg-[#F2F2F7] rounded-xl p-2 text-center">
                <span className="text-[10px] text-[#8E8E93] font-semibold">Cân Thực Tế</span>
                <div className="font-black text-[#34C759] text-sm mt-0.5 tnum">
                  {currentKitchenOrder.items
                    .reduce((acc, it) => acc + (it.actualKg !== undefined ? it.actualKg : it.orderKg), 0)
                    .toFixed(1)}{" "}
                  kg
                </div>
              </div>
            </div>
          </div>

          {/* List of Meat Items to Pack */}
          <div className="ios-card overflow-hidden">
            {/* Table Header: Dual quantity columns */}
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider bg-[#F2F2F7]/70 border-b border-[#3C3C43]/10">
              <span className="flex-1">Mặt hàng thịt</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-14 text-center">Theo đơn</span>
                <span className="w-24 text-center">Thực tế (-/+)</span>
                <span className="w-7 text-center">Soạn</span>
              </div>
            </div>

            <div className="divide-y divide-[#3C3C43]/10">
              {currentKitchenOrder.items.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8E8E93]">
                  Chưa có món thịt nào cho bếp này.
                </div>
              ) : (
                currentKitchenOrder.items.map((item) => {
                  const isPacked = item.isPacked;
                  const actualVal =
                    item.actualKg !== undefined ? item.actualKg : item.orderKg;
                  const diff = Math.round((actualVal - item.orderKg) * 10) / 10;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 flex items-center justify-between gap-2 transition ${
                        isPacked ? "bg-[#34C759]/[0.05]" : "hover:bg-black/[0.015]"
                      }`}
                    >
                      {/* Left: Item Name & Diff badge */}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-[#1C1C1E] truncate">
                          {item.name}
                        </div>
                        {diff !== 0 && (
                          <div className="text-[10px] mt-0.5">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block ${
                                diff > 0
                                  ? "bg-[#007AFF]/12 text-[#007AFF]"
                                  : "bg-[#FF9500]/15 text-[#D97706]"
                              }`}
                            >
                              Chênh: {diff > 0 ? `+${diff}` : diff} kg
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Dual Quantities & Toggle */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* 1 Bên: Số lượng theo đơn hàng */}
                        <div
                          onClick={() => updateActualKg(item.id, item.orderKg)}
                          className="w-14 text-center py-1 bg-[#F2F2F7] rounded-xl border border-black/5 cursor-pointer hover:bg-[#E5E5EA] active:scale-95 transition"
                          title="Chạm để sao chép số lượng theo đơn sang thực tế"
                        >
                          <div className="text-[8px] font-semibold text-[#8E8E93] leading-none">
                            Theo đơn
                          </div>
                          <div className="text-xs font-black text-[#1C1C1E] mt-0.5 tnum leading-tight">
                            {item.orderKg}
                            <span className="text-[9px] font-normal text-[#8E8E93] ml-0.5">
                              kg
                            </span>
                          </div>
                        </div>

                        {/* 1 Bên: Số lượng thực tế (kèm nút điều chỉnh -/+) */}
                        <div className="flex items-center bg-[#F2F2F7] rounded-xl p-0.5 border border-black/5 shadow-2xs">
                          {/* Nút trừ [-] */}
                          <button
                            type="button"
                            onClick={() => adjustActualKg(item.id, -0.1)}
                            className="w-6 h-6 rounded-lg bg-white text-[#1C1C1E] font-bold text-xs flex items-center justify-center hover:bg-[#E5E5EA] active:scale-90 transition shadow-2xs select-none"
                            title="Giảm 0.1 kg"
                          >
                            -
                          </button>

                          {/* Ô hiển thị & nhập số kg thực tế */}
                          <input
                            type="number"
                            step="0.1"
                            value={actualVal}
                            onChange={(e) =>
                              updateActualKg(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-10 text-center font-black text-xs text-[#1C1C1E] bg-transparent focus:outline-none tnum mx-0.5"
                          />

                          {/* Nút cộng [+] */}
                          <button
                            type="button"
                            onClick={() => adjustActualKg(item.id, 0.1)}
                            className="w-6 h-6 rounded-lg bg-white text-[#1C1C1E] font-bold text-xs flex items-center justify-center hover:bg-[#E5E5EA] active:scale-90 transition shadow-2xs select-none"
                            title="Tăng 0.1 kg"
                          >
                            +
                          </button>
                        </div>

                        {/* Nút Tích Hoàn Thành Soạn Hàng */}
                        <button
                          type="button"
                          onClick={() => toggleItemPacked(item.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition active:scale-90 shadow-2xs select-none ${
                            isPacked
                              ? "bg-[#34C759] text-white"
                              : "bg-white border border-[#3C3C43]/20 text-[#8E8E93] hover:border-[#34C759]"
                          }`}
                          title={
                            isPacked
                              ? "Đã soạn xong (Chạm để bỏ tích)"
                              : "Chưa soạn (Chạm để đánh dấu xong)"
                          }
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Proceed to Step 3 Button */}
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("reports");
              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full py-2.5 rounded-2xl bg-[#34C759] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition"
          >
            <span>Xem Báo Cáo Đơn Thịt (Bước 3)</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: BÁO CÁO ĐƠN THỊT */}
      {/* ======================================================== */}
      {activeSubTab === "reports" && (
        <div className="space-y-3 animate-view">
          {/* Main KPI Summary Card */}
          <div className="ios-card p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-[#1C1C1E] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#34C759]" />
                  <span>Báo Cáo Đơn Thịt Ngày {workingDate}</span>
                </h3>
                <p className="text-[11px] text-[#8E8E93]">
                  Thống kê khối lượng, chi phí & tiến độ hoàn thành soạn hàng
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyMeatReport}
                className="px-2.5 py-1.5 rounded-xl bg-[#34C759] text-white text-xs font-bold transition active:scale-95 flex items-center gap-1 shadow-2xs shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Chép Zalo</span>
              </button>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-black/5">
                <span className="text-[10px] text-[#8E8E93] font-semibold">Tổng Khối Lượng</span>
                <div className="font-black text-sm text-[#1C1C1E] mt-0.5 tnum">
                  {grandTotalActualKg.toFixed(1)} kg
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-black/5">
                <span className="text-[10px] text-[#8E8E93] font-semibold">Tổng Số Món</span>
                <div className="font-black text-sm text-[#34C759] mt-0.5 tnum">
                  {totalItemsCount} món
                </div>
              </div>

              <div className="bg-[#F2F2F7] rounded-xl p-2 text-center border border-black/5">
                <span className="text-[10px] text-[#8E8E93] font-semibold">Đã Soạn Xong</span>
                <div className="font-black text-sm text-[#007AFF] mt-0.5 tnum">
                  {completionPercent}%
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown per Kitchen List */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">
              Chi Tiết Đơn Từng Bếp
            </div>

            {displayKitchens.map((k) => {
              const ko = meatOrders[k.id];
              const kKg = ko
                ? ko.items.reduce((acc, it) => acc + (it.actualKg || it.orderKg), 0)
                : 0;
              const packedCount = ko ? ko.items.filter((it) => it.isPacked).length : 0;
              const totalItems = ko ? ko.items.length : 0;
              const isAllDone = totalItems > 0 && packedCount === totalItems;

              return (
                <div key={k.id} className="ios-card p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: k.color }}
                      />
                      <h4 className="font-extrabold text-xs text-[#1C1C1E] truncate">
                        {k.name.toUpperCase()}
                      </h4>
                      {isAllDone ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#34C759]/15 text-[#248A3D] text-[9px] font-bold">
                          ✓ Xong đủ
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#FF9500]/15 text-[#D97706] text-[9px] font-bold">
                          {packedCount}/{totalItems} món
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#1C1C1E] tnum">
                        {kKg.toFixed(1)} kg
                      </span>
                    </div>
                  </div>

                  {/* Meat items row summary */}
                  {ko && ko.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-[#3C3C43]/10">
                      {ko.items.map((it) => (
                        <span
                          key={it.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                            it.isPacked
                              ? "bg-[#34C759]/10 text-[#248A3D] font-medium"
                              : "bg-[#F2F2F7] text-[#8E8E93]"
                          }`}
                        >
                          <span>{it.name}:</span>
                          <strong className="tnum">{it.orderKg}kg</strong>
                          {it.isPacked && <span>✓</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* LIGHTBOX MODAL: FULL SCREEN PHOTO PREVIEW */}
      {/* ======================================================== */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col justify-between p-3 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-white p-2 shrink-0">
            <span className="text-xs font-bold truncate max-w-[260px]">
              {lightboxImage.title}
            </span>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Image */}
          <div
            className="flex-1 flex items-center justify-center p-2 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt="Ảnh phóng to"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>

          {/* Footer Close Button */}
          <div className="p-2 text-center shrink-0">
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold shadow-lg"
            >
              Đóng xem ảnh
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD MEAT ITEM */}
      {/* ======================================================== */}
      {isAddItemOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsAddItemOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-5 border border-black/5 shadow-2xl animate-view space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3C3C43]/10">
              <h3 className="text-sm font-bold text-[#1C1C1E]">
                Thêm Món Thịt Cho {activeKitchenData?.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddItemOpen(false)}
                className="text-[#8E8E93] hover:text-[#1C1C1E] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                  Tên Món Thịt
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thịt bò bắp hoa, Thịt nạc vai..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F2F2F7] rounded-xl border border-black/5 font-semibold text-[#1C1C1E] focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8E8E93] mb-1">
                  Số Lượng Theo Đơn (Kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newItemKg}
                  onChange={(e) => setNewItemKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#F2F2F7] rounded-xl border border-black/5 font-bold text-[#1C1C1E] focus:outline-none focus:bg-white tnum"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddItemOpen(false)}
                className="flex-1 py-2 rounded-xl bg-[#767680]/10 text-xs font-semibold text-[#1C1C1E]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex-1 py-2 rounded-xl bg-[#34C759] text-white text-xs font-bold shadow-sm"
              >
                Thêm món
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
