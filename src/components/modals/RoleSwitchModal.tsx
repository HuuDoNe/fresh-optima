"use client";

import React from "react";
import { SupplierData, KitchenData, SessionState, UserRole } from "@/lib/types";
import { X, ShieldCheck, UtensilsCrossed, Sparkles } from "lucide-react";

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierData[];
  kitchens?: KitchenData[];
  session: SessionState;
  isMandatory?: boolean;
  lastSavedRole?: { role: UserRole; id?: string | null } | null;
  onSelectRole: (role: UserRole, id?: string | null) => void;
}

export function RoleSwitchModal({
  isOpen,
  onClose,
  suppliers,
  kitchens = [],
  session,
  isMandatory = false,
  lastSavedRole = null,
  onSelectRole,
}: RoleSwitchModalProps) {
  if (!isOpen) return null;

  const isAdmin = session.role === "admin";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (!isMandatory) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-black/5 shadow-2xl animate-view flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Drag Handle on Mobile */}
        <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-3 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#34C759] to-[#248A3D] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(52,199,89,0.3)] shrink-0">
              FO
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 tracking-tight">
                  {isMandatory ? "Chọn Vai Trò Để Bắt Đầu" : "Chuyển Đổi Vai Trò Sử Dụng"}
                </h3>
                {isMandatory && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    Bắt buộc
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isMandatory
                  ? "Vui lòng chọn vai trò để truy cập đúng quyền hạn và dữ liệu"
                  : "Chọn góc nhìn Quản lý, Cổng Bếp Ăn, hoặc Cổng Nhà Cung Cấp"}
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 p-1.5 rounded-full hover:bg-zinc-100 transition shrink-0"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role Options Scroll Area */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
          {/* 1. Admin Option */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
              Ban Quản Lý & Điều Hành
            </div>
            <button
              type="button"
              onClick={() => onSelectRole("admin", null)}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between active:scale-[0.99] ${
                isAdmin && !isMandatory
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-900"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${
                    isAdmin && !isMandatory
                      ? "bg-white/15 text-white"
                      : "bg-zinc-100 text-zinc-800"
                  } flex items-center justify-center shrink-0`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Quản lý Thu mua (Admin)</div>
                  <div
                    className={`text-[11px] truncate ${
                      isAdmin && !isMandatory ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    Toàn quyền duyệt giá, đặt hàng đa bếp & xem báo cáo chi phí
                  </div>
                </div>
              </div>
              {isAdmin && !isMandatory ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shrink-0 ml-2">
                  Đang dùng
                </span>
              ) : isMandatory && lastSavedRole?.role === "admin" ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 shrink-0 ml-2 border border-zinc-200">
                  Đã dùng lần trước
                </span>
              ) : null}
            </button>
          </div>

          {/* 2. Kitchen Section */}
          {kitchens.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Cổng Bếp Ăn ({kitchens.length} Bếp)
                </span>
                <span className="text-[10px] text-blue-600 font-semibold">
                  Chỉ xem giá & đặt hàng bếp đó
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {kitchens.map((k) => {
                  const active =
                    session.role === "kitchen" && session.kitchenId === k.id && !isMandatory;
                  const isLast =
                    isMandatory &&
                    lastSavedRole?.role === "kitchen" &&
                    lastSavedRole?.id === k.id;

                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => onSelectRole("kitchen", k.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between active:scale-[0.99] ${
                        active
                          ? "border-blue-600 bg-blue-50/80 text-zinc-950 shadow-xs"
                          : "border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${k.color}20`,
                            color: k.color,
                          }}
                        >
                          <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{k.name}</div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {k.note || "Bếp ăn"} · Đặt hàng & copy Zalo cho {k.name}
                          </div>
                        </div>
                      </div>
                      {active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0 ml-2">
                          Đang dùng
                        </span>
                      ) : isLast ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 shrink-0 ml-2 border border-blue-200">
                          Đã dùng lần trước
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Supplier Section */}
          {suppliers.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Cổng Nhà Cung Cấp ({suppliers.length} NCC)
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Cập nhật giá & xem đơn nhận
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {suppliers.map((s) => {
                  const active =
                    session.role === "supplier" && session.supplierId === s.id && !isMandatory;
                  const isLast =
                    isMandatory &&
                    lastSavedRole?.role === "supplier" &&
                    lastSavedRole?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelectRole("supplier", s.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all duration-150 flex items-center justify-between active:scale-[0.99] ${
                        active
                          ? "border-emerald-600 bg-emerald-50/80 text-zinc-950 shadow-xs"
                          : "border-zinc-200/80 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: s.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{s.name}</div>
                          <div className="text-[11px] text-zinc-500 truncate tnum">
                            Zalo: {s.phone || "Chưa có SĐT"} · Báo giá & quản lý đơn {s.name}
                          </div>
                        </div>
                      </div>
                      {active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shrink-0 ml-2">
                          Đang dùng
                        </span>
                      ) : isLast ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0 ml-2 border border-emerald-200">
                          Đã dùng lần trước
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Hint */}
        <div className="pt-3 border-t border-zinc-100 mt-2 text-center shrink-0">
          <p className="text-[11px] text-zinc-400">
            💡 Bạn có thể đổi lại vai trò bất cứ lúc nào bằng cách nhấn vào tên vai trò ở thanh trên cùng
          </p>
        </div>
      </div>
    </div>
  );
}
