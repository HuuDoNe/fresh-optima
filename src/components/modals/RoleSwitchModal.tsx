"use client";

import React from "react";
import { SupplierData, KitchenData, SessionState, UserRole } from "@/lib/types";
import { X, ShieldCheck, UtensilsCrossed } from "lucide-react";

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierData[];
  kitchens?: KitchenData[];
  session: SessionState;
  onSelectRole: (role: UserRole, id?: string | null) => void;
}

export function RoleSwitchModal({
  isOpen,
  onClose,
  suppliers,
  kitchens = [],
  session,
  onSelectRole,
}: RoleSwitchModalProps) {
  if (!isOpen) return null;

  const isAdmin = session.role === "admin";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-md w-full p-6 border border-black/5 shadow-2xl animate-view">
        <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Chuyển Đổi Vai Trò Sử Dụng (RBAC)</h3>
            <p className="text-xs text-zinc-500">Chọn góc nhìn Quản lý, Cổng Bếp Ăn, hoặc Cổng Nhà Cung Cấp</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {/* Admin Option */}
          <button
            type="button"
            onClick={() => {
              onSelectRole("admin", null);
              onClose();
            }}
            className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              isAdmin
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 hover:bg-zinc-50 text-zinc-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg ${
                  isAdmin ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-800"
                } flex items-center justify-center`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">Quản lý Thu mua (Admin)</div>
                <div className={`text-[11px] ${isAdmin ? "text-zinc-300" : "text-zinc-500"}`}>
                  Toàn quyền chỉnh sửa báo giá, đặt hàng các bếp & xem báo cáo
                </div>
              </div>
            </div>
            {isAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">
                Đang dùng
              </span>
            )}
          </button>

          {/* Kitchen Section */}
          {kitchens.length > 0 && (
            <>
              <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Tài khoản Cổng Bếp Ăn (Chỉ xem giá & đặt hàng cho bếp này)
              </div>

              {kitchens.map((k) => {
                const active = session.role === "kitchen" && session.kitchenId === k.id;
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => {
                      onSelectRole("kitchen", k.id);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      active
                        ? "border-blue-600 bg-blue-50/70 text-zinc-950"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${k.color}20`,
                          color: k.color,
                        }}
                      >
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{k.name}</div>
                        <div className="text-[11px] text-zinc-500">
                          {k.note || "Bếp ăn"} · Xem giá, chỉ đặt hàng & copy Zalo cho {k.name}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                        Đang dùng
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Supplier Section */}
          {suppliers.length > 0 && (
            <>
              <div className="pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Tài khoản Cổng Nhà Cung Cấp Độc Lập
              </div>

              {suppliers.map((s) => {
                const active = session.role === "supplier" && session.supplierId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onSelectRole("supplier", s.id);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      active
                        ? "border-emerald-600 bg-emerald-50/70 text-zinc-950"
                        : "border-zinc-200 hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <div>
                        <div className="text-xs font-bold">{s.name}</div>
                        <div className="text-[11px] text-zinc-500 tnum">
                          Zalo: {s.phone} · Chỉ sửa giá & kiểm tra đơn của {s.name}
                        </div>
                      </div>
                    </div>
                    {active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                        Đang dùng
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
