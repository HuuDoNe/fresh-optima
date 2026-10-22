"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SupplierData,
  KitchenData,
  VegetableItemData,
  DateQuotesMap,
  KitchenOrdersMap,
  OrderBatchSummary,
  SessionState,
} from "@/lib/types";
import {
  getAppState,
  updateDailyQuoteAction,
  copyYesterdayQuotesAction,
  setAllInStockAction,
  saveSupplierSelfProfileAction,
  saveSupplierAction,
  deleteSupplierAction,
  saveKitchenAction,
  deleteKitchenAction,
  saveVegetableItemAction,
  deleteVegetableItemAction,
  commitOrderBatchAction,
  deleteHistoryDayAction,
} from "@/actions/app-actions";
import { Header, AdminTab } from "@/components/layout/Header";
import { SupplierPortal } from "@/components/supplier/SupplierPortal";
import { TabQuotes } from "@/components/admin/TabQuotes";
import { TabOrders } from "@/components/admin/TabOrders";
import { TabPO } from "@/components/admin/TabPO";
import { TabReports } from "@/components/admin/TabReports";
import { RoleSwitchModal } from "@/components/modals/RoleSwitchModal";
import { SupplierModal } from "@/components/modals/SupplierModal";
import { SupplierSelfModal } from "@/components/modals/SupplierSelfModal";
import { KitchenModal } from "@/components/modals/KitchenModal";
import { ItemModal } from "@/components/modals/ItemModal";
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { runPerKitchenAllocation } from "@/lib/optimizer";

function getTodayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

function shiftDateISO(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

interface ToastItem {
  id: string;
  message: string;
  type: "default" | "warn";
}

export default function FreshOptimaApp() {
  // Working Date & Session
  const [workingDate, setWorkingDate] = useState<string>("2026-10-22");
  const [session, setSession] = useState<SessionState>({
    role: "admin",
    supplierId: null,
  });
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>("quotes");

  // Data from DB
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [kitchens, setKitchens] = useState<KitchenData[]>([]);
  const [items, setItems] = useState<VegetableItemData[]>([]);
  const [dayQuotes, setDayQuotes] = useState<DateQuotesMap>({});
  const [history, setHistory] = useState<OrderBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // In-memory Kitchen Orders (kitchenId -> itemId -> qty)
  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrdersMap>({
    k1: { v1: 25, v2: 12, v3: 20, v5: 15 },
    k2: { v1: 25, v4: 30, v6: 35 },
    k3: { v7: 25, v8: 20, v3: 15 },
  });
  const [activeKitchenId, setActiveKitchenId] = useState<string>("k1");

  // Modals state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);
  const [supplierSelfModalOpen, setSupplierSelfModalOpen] = useState(false);
  const [kitchenModalOpen, setKitchenModalOpen] = useState(false);
  const [editingKitchen, setEditingKitchen] = useState<KitchenData | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);

  // Confirm Dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, type: "default" | "warn" = "default") => {
    const id = "toast_" + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Fetch full state for date
  const loadState = useCallback(async (dateStr: string) => {
    try {
      setLoading(true);
      const res = await getAppState(dateStr);
      setSuppliers(res.suppliers);
      setKitchens(res.kitchens);
      setItems(res.items);
      setDayQuotes(res.dayQuotes);
      setHistory(res.history);

      if (res.kitchens.length > 0 && !res.kitchens.some((k) => k.id === activeKitchenId)) {
        setActiveKitchenId(res.kitchens[0].id);
      }
    } catch (e) {
      console.error(e);
      notify("Lỗi tải dữ liệu", "warn");
    } finally {
      setLoading(false);
    }
  }, [activeKitchenId, notify]);

  useEffect(() => {
    loadState(workingDate);
  }, [workingDate, loadState]);

  // Handle Date Change
  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    setWorkingDate(newDate);
    notify(`Đã chuyển sang ngày làm việc ${newDate}`);
  };

  // Role Switcher Handlers
  const handleSelectRole = (role: "admin" | "supplier", supplierId?: string | null) => {
    if (role === "supplier") {
      const targetSup = suppliers.find((s) => s.id === supplierId) || suppliers[0];
      setSession({ role: "supplier", supplierId: targetSup ? targetSup.id : null });
      notify(`Đã chuyển sang Cổng NCC: ${targetSup ? targetSup.name : ""}`);
    } else {
      setSession({ role: "admin", supplierId: null });
      notify("Đã chuyển sang quyền Quản lý Thu mua (Admin)");
    }
  };

  // Daily Quote Update
  const handleUpdateQuote = async (
    itemId: string,
    supplierId: string,
    price?: number,
    inStock?: boolean
  ) => {
    // Optimistic update
    setDayQuotes((prev) => {
      const next = { ...prev };
      if (!next[itemId]) next[itemId] = {};
      const cur = next[itemId][supplierId] || { price: 20000, inStock: true };
      next[itemId][supplierId] = {
        price: price !== undefined ? price : cur.price,
        inStock: inStock !== undefined ? inStock : cur.inStock,
      };
      return next;
    });

    try {
      await updateDailyQuoteAction(workingDate, itemId, supplierId, price, inStock);
    } catch {
      notify("Không thể cập nhật báo giá", "warn");
      loadState(workingDate);
    }
  };

  // Copy yesterday's quotes
  const handleCopyYesterdayForSupplier = async () => {
    if (!session.supplierId) return;
    const prevDate = shiftDateISO(workingDate, -1);
    try {
      await copyYesterdayQuotesAction(workingDate, prevDate, session.supplierId);
      await loadState(workingDate);
      notify(`Đã sao chép báo giá ngày ${prevDate}`);
    } catch {
      notify("Lỗi sao chép báo giá", "warn");
    }
  };

  const handleCopyAllYesterday = async () => {
    const prevDate = shiftDateISO(workingDate, -1);
    try {
      await copyYesterdayQuotesAction(workingDate, prevDate, null);
      await loadState(workingDate);
      notify(`Đã sao chép toàn bộ báo giá từ ngày ${prevDate}`);
    } catch {
      notify("Lỗi sao chép báo giá", "warn");
    }
  };

  const handleSetAllInStock = async () => {
    if (!session.supplierId) return;
    try {
      await setAllInStockAction(workingDate, session.supplierId);
      await loadState(workingDate);
      notify("Đã bật Còn hàng cho tất cả mặt hàng");
    } catch {
      notify("Lỗi cập nhật trạng thái", "warn");
    }
  };

  const handleRandomizeMarket = () => {
    const nextQuotes = { ...dayQuotes };
    items.forEach((it) => {
      if (!nextQuotes[it.id]) nextQuotes[it.id] = {};
      suppliers.forEach((sup) => {
        const delta = (Math.floor(Math.random() * 7) - 3) * 500;
        const inStock = Math.random() > 0.15;
        const price = Math.max(6000, it.basePrice + delta);
        nextQuotes[it.id][sup.id] = { price, inStock };
        updateDailyQuoteAction(workingDate, it.id, sup.id, price, inStock);
      });
    });
    setDayQuotes(nextQuotes);
    notify("Đã giả lập biến động giá chợ hôm nay");
  };

  // Kitchen Quantities update
  const handleUpdateKitchenQty = (itemId: string, qty: number) => {
    setKitchenOrders((prev) => {
      const next = { ...prev };
      if (!next[activeKitchenId]) next[activeKitchenId] = {};
      next[activeKitchenId] = {
        ...next[activeKitchenId],
        [itemId]: qty,
      };
      return next;
    });
  };

  const handleClearCurrentKitchenOrder = () => {
    const k = kitchens.find((x) => x.id === activeKitchenId);
    setKitchenOrders((prev) => ({
      ...prev,
      [activeKitchenId]: {},
    }));
    notify(`Đã xóa danh sách đặt hàng của ${k ? k.name : "bếp"}`);
  };

  const handleFillSampleOrders = () => {
    const newOrders: KitchenOrdersMap = {};
    if (kitchens[0]) newOrders[kitchens[0].id] = { v1: 25, v2: 12, v3: 20, v5: 15 };
    if (kitchens[1]) newOrders[kitchens[1].id] = { v1: 25, v4: 30, v6: 35 };
    if (kitchens[2]) newOrders[kitchens[2].id] = { v7: 25, v8: 20, v3: 15 };
    setKitchenOrders(newOrders);
    notify("Đã nạp đơn mẫu tách riêng cho từng bếp");
  };

  // Commit order batch to history
  const handleCommitOrders = async () => {
    const allocation = runPerKitchenAllocation(
      kitchens,
      items,
      suppliers,
      dayQuotes,
      kitchenOrders,
      null
    );

    const validLines = allocation.lines.filter((l) => !l.unfulfilled);
    if (!validLines.length) {
      notify("Vui lòng nhập số lượng đặt hàng cho ít nhất 1 bếp", "warn");
      return;
    }

    try {
      await commitOrderBatchAction(
        workingDate,
        validLines.map((l) => ({
          kitchenId: l.kitchenId,
          itemId: l.itemId,
          supplierId: l.supplierId,
          qty: l.qty,
          unitPrice: l.unitPrice,
          totalPrice: l.totalPrice,
          note: l.note,
          isFallback: l.badgeType === "fallback",
        })),
        allocation.allocatedKg,
        allocation.totalCost,
        allocation.totalSaved
      );

      await loadState(workingDate);
      notify(`Đã chốt đơn các bếp ngày ${workingDate} vào Báo cáo chi phí`);
      setActiveAdminTab("reports");
    } catch {
      notify("Lỗi chốt đơn", "warn");
    }
  };

  // Reload history batch to ordering workspace
  const handleReloadDateToOrders = (dateStr: string) => {
    setWorkingDate(dateStr);
    const record = history.find((h) => h.date === dateStr);
    if (record && record.lines.length) {
      const restoredOrders: KitchenOrdersMap = {};
      kitchens.forEach((k) => {
        restoredOrders[k.id] = {};
      });

      record.lines.forEach((l) => {
        if (!restoredOrders[l.kitchenId]) restoredOrders[l.kitchenId] = {};
        restoredOrders[l.kitchenId][l.itemId] =
          (restoredOrders[l.kitchenId][l.itemId] || 0) + l.qty;
      });

      setKitchenOrders(restoredOrders);
    }
    setActiveAdminTab("orders");
    notify(`Đã nạp lại đơn hàng ngày ${dateStr} về mục Đặt hàng để chỉnh sửa`);
  };

  // Delete history day
  const handleDeleteHistoryDay = (dateStr: string) => {
    setConfirmState({
      isOpen: true,
      title: "Xóa lịch sử đơn hàng?",
      description: `Bạn có chắc muốn xóa vĩnh viễn đơn hàng ngày ${dateStr} khỏi báo cáo?`,
      onConfirm: async () => {
        try {
          await deleteHistoryDayAction(dateStr);
          await loadState(workingDate);
          notify(`Đã xóa đơn ngày ${dateStr}`);
        } catch {
          notify("Lỗi xóa đơn", "warn");
        }
      },
    });
  };

  // Supplier self profile save
  const handleSaveSupplierSelfProfile = async (
    supId: string,
    name: string,
    phone: string,
    note: string
  ) => {
    try {
      const res = await saveSupplierSelfProfileAction(supId, name, phone, note);
      if (res && !res.success) {
        notify(`Lỗi: ${res.error}`, "warn");
        return;
      }
      await loadState(workingDate);
      notify("Đã cập nhật thông tin nhà cung cấp");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi lưu thông tin";
      notify(`Lỗi: ${msg}`, "warn");
    }
  };

  // Admin Supplier CRUD
  const handleSaveSupplier = async (
    id: string | null,
    name: string,
    phone: string,
    note: string
  ) => {
    try {
      const res = await saveSupplierAction(id, name, phone, note, workingDate);
      if (res && !res.success) {
        notify(`Lỗi: ${res.error}`, "warn");
        return;
      }
      await loadState(workingDate);
      notify(id ? `Đã cập nhật ${name}` : `Đã thêm NCC ${name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi lưu nhà cung cấp";
      notify(`Lỗi: ${msg}`, "warn");
    }
  };

  const handleDeleteSupplier = (sup: SupplierData) => {
    if (suppliers.length <= 1) {
      notify("Phải giữ lại ít nhất 1 nhà cung cấp", "warn");
      return;
    }
    setConfirmState({
      isOpen: true,
      title: "Xóa nhà cung cấp?",
      description: `Bạn có chắc muốn xóa "${sup.name}" khỏi danh sách?`,
      onConfirm: async () => {
        try {
          const res = await deleteSupplierAction(sup.id);
          if (res && !res.success) {
            notify(`Lỗi: ${res.error}`, "warn");
            return;
          }
          await loadState(workingDate);
          notify(`Đã xóa ${sup.name}`);
        } catch {
          notify("Lỗi xóa NCC", "warn");
        }
      },
    });
  };

  // Kitchen CRUD
  const handleSaveKitchen = async (
    id: string | null,
    name: string,
    note: string
  ) => {
    try {
      const res = await saveKitchenAction(id, name, note);
      if (res && !res.success) {
        notify(`Lỗi: ${res.error}`, "warn");
        return;
      }
      await loadState(workingDate);
      notify(id ? `Đã cập nhật ${name}` : `Đã thêm ${name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi lưu bếp";
      notify(`Lỗi: ${msg}`, "warn");
    }
  };

  const handleDeleteKitchen = async (kitchenId: string) => {
    const k = kitchens.find((x) => x.id === kitchenId);
    setConfirmState({
      isOpen: true,
      title: "Xóa bếp ăn?",
      description: `Xóa "${k ? k.name : ""}" và toàn bộ số lượng đang nhập của bếp này?`,
      onConfirm: async () => {
        try {
          const res = await deleteKitchenAction(kitchenId);
          if (res && !res.success) {
            notify(`Lỗi: ${res.error}`, "warn");
            return;
          }
          setKitchenOrders((prev) => {
            const next = { ...prev };
            delete next[kitchenId];
            return next;
          });
          await loadState(workingDate);
          notify("Đã xóa bếp");
        } catch {
          notify("Lỗi xóa bếp", "warn");
        }
      },
    });
  };

  // Item CRUD
  const handleSaveItem = async (name: string, unit: string, basePrice: number) => {
    try {
      const res = await saveVegetableItemAction(name, unit, basePrice, workingDate);
      if (res && !res.success) {
        notify(`Lỗi: ${res.error}`, "warn");
        return;
      }
      await loadState(workingDate);
      notify(`Đã thêm mặt hàng "${name}"`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi thêm mặt hàng";
      notify(`Lỗi: ${msg}`, "warn");
    }
  };

  const handleDeleteItem = (item: VegetableItemData) => {
    setConfirmState({
      isOpen: true,
      title: "Xóa mặt hàng rau củ?",
      description: `Bạn có chắc muốn xóa "${item.name}" khỏi danh mục?`,
      onConfirm: async () => {
        try {
          await deleteVegetableItemAction(item.id);
          await loadState(workingDate);
          notify(`Đã xóa "${item.name}"`);
        } catch {
          notify("Lỗi xóa mặt hàng", "warn");
        }
      },
    });
  };

  const currentLoggedSupplier = suppliers.find((s) => s.id === session.supplierId) || suppliers[0];

  return (
    <>
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-view ${
              t.type === "warn"
                ? "bg-amber-600 text-white"
                : "bg-zinc-900 text-white"
            }`}
          >
            {t.type === "warn" ? (
              <AlertCircle className="w-4 h-4 text-amber-200" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Nordic Command Bar Header */}
      <Header
        session={session}
        suppliers={suppliers}
        workingDate={workingDate}
        activeAdminTab={activeAdminTab}
        onTabChange={(tab) => setActiveAdminTab(tab)}
        onDateChange={handleDateChange}
        onOpenRoleModal={() => setRoleModalOpen(true)}
        onQuickRoleChange={handleSelectRole}
      />

      {/* Main Workspace */}
      <main className="flex-grow max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="py-24 text-center space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs text-zinc-500 font-medium">Đang tải dữ liệu FreshOptima...</div>
          </div>
        ) : session.role === "supplier" ? (
          /* SUPPLIER PORTAL (Strictly Isolated to ONLY Logged-in Supplier) */
          currentLoggedSupplier ? (
            <SupplierPortal
              supplier={currentLoggedSupplier}
              workingDate={workingDate}
              items={items}
              dayQuotes={dayQuotes}
              onUpdateQuote={(itemId, price, inStock) =>
                handleUpdateQuote(itemId, currentLoggedSupplier.id, price, inStock)
              }
              onCopyYesterday={handleCopyYesterdayForSupplier}
              onSetAllInStock={handleSetAllInStock}
              onOpenSelfProfileModal={() => setSupplierSelfModalOpen(true)}
              onOpenAddItemModal={() => setItemModalOpen(true)}
              onExitSupplierMode={() => handleSelectRole("admin")}
              onNotify={notify}
            />
          ) : (
            <div className="py-20 text-center text-xs text-zinc-400">
              Không tìm thấy thông tin nhà cung cấp này.
            </div>
          )
        ) : (
          /* ADMIN WORKSPACE (3 Tabs) */
          <div>
            {activeAdminTab === "quotes" && (
              <TabQuotes
                workingDate={workingDate}
                suppliers={suppliers}
                items={items}
                dayQuotes={dayQuotes}
                onUpdateQuote={handleUpdateQuote}
                onCopyAllYesterday={handleCopyAllYesterday}
                onRandomizeMarket={handleRandomizeMarket}
                onEnterSupplierPortal={(supId) => handleSelectRole("supplier", supId)}
                onOpenSupplierModal={(sup) => {
                  setEditingSupplier(sup);
                  setSupplierModalOpen(true);
                }}
                onDeleteSupplier={handleDeleteSupplier}
                onOpenAddItemModal={() => setItemModalOpen(true)}
                onDeleteItem={handleDeleteItem}
                onProceedToOrders={() => {
                  setActiveAdminTab("orders");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {activeAdminTab === "orders" && (
              <TabOrders
                workingDate={workingDate}
                kitchens={kitchens}
                items={items}
                suppliers={suppliers}
                dayQuotes={dayQuotes}
                kitchenOrders={kitchenOrders}
                activeKitchenId={activeKitchenId}
                onSelectKitchen={(id) => setActiveKitchenId(id)}
                onUpdateKitchenQty={handleUpdateKitchenQty}
                onClearCurrentKitchenOrder={handleClearCurrentKitchenOrder}
                onFillSampleOrders={handleFillSampleOrders}
                onOpenKitchenModal={(k) => {
                  setEditingKitchen(k);
                  setKitchenModalOpen(true);
                }}
                onCommitOrders={handleCommitOrders}
                onNotify={notify}
                onProceedToPo={() => {
                  setActiveAdminTab("po");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onBackToQuotes={() => {
                  setActiveAdminTab("quotes");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {activeAdminTab === "po" && (
              <TabPO
                workingDate={workingDate}
                kitchens={kitchens}
                items={items}
                suppliers={suppliers}
                dayQuotes={dayQuotes}
                kitchenOrders={kitchenOrders}
                onNotify={notify}
                onBackToOrders={() => {
                  setActiveAdminTab("orders");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onProceedToReports={() => {
                  setActiveAdminTab("reports");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}

            {activeAdminTab === "reports" && (
              <TabReports
                workingDate={workingDate}
                suppliers={suppliers}
                history={history}
                onReloadDateToOrders={(batch) => {
                  handleReloadDateToOrders(batch);
                  setActiveAdminTab("orders");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDeleteHistoryDay={handleDeleteHistoryDay}
                onNotify={notify}
              />
            )}
          </div>
        )}
      </main>

      {/* Global Modals */}
      <RoleSwitchModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        suppliers={suppliers}
        session={session}
        onSelectRole={handleSelectRole}
      />

      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSave={handleSaveSupplier}
      />

      {currentLoggedSupplier && (
        <SupplierSelfModal
          isOpen={supplierSelfModalOpen}
          onClose={() => setSupplierSelfModalOpen(false)}
          supplier={currentLoggedSupplier}
          onSave={handleSaveSupplierSelfProfile}
        />
      )}

      <KitchenModal
        isOpen={kitchenModalOpen}
        onClose={() => {
          setKitchenModalOpen(false);
          setEditingKitchen(null);
        }}
        kitchen={editingKitchen}
        kitchenCount={kitchens.length}
        onSave={handleSaveKitchen}
        onDelete={handleDeleteKitchen}
      />

      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
      />

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={() => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
