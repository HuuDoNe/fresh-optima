"use client";

import React from "react";
import { SupplierData, KitchenData, SessionState, UserRole } from "@/lib/types";
import { Calendar, UserCheck, Shield, UtensilsCrossed } from "lucide-react";
import { PwaInstallButton } from "@/components/common/PwaInstallButton";

export type AdminTab = "quotes" | "orders" | "po" | "reports";

interface HeaderProps {
  session: SessionState;
  suppliers: SupplierData[];
  kitchens?: KitchenData[];
  workingDate: string;
  activeAdminTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onDateChange: (newDate: string) => void;
  onOpenRoleModal: () => void;
  onQuickRoleChange: (role: UserRole, id?: string | null) => void;
}

export function Header({
  session,
  suppliers,
  kitchens = [],
  workingDate,
  activeAdminTab,
  onTabChange,
  onDateChange,
  onOpenRoleModal,
  onQuickRoleChange,
}: HeaderProps) {
  const isSupplier = session.role === "supplier";
  const isKitchen = session.role === "kitchen";
  const activeSupplier = suppliers.find((s) => s.id === session.supplierId);
  const activeKitchen = kitchens.find((k) => k.id === session.kitchenId);

  return (
    <header className="sticky top-0 z-30 bg-[#F2F2F7]/85 backdrop-blur-2xl border-b border-[#3C3C43]/10 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Mode Pill */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-[#34C759] to-[#248A3D] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(52,199,89,0.3)] shrink-0">
            FO
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#1C1C1E] truncate">
                FreshOptima
              </span>
              {isSupplier ? (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34C759] shrink-0" />
                  {activeSupplier ? activeSupplier.name : "NCC"}
                </span>
              ) : isKitchen ? (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#007AFF]/15 text-[#007AFF] truncate">
                  <UtensilsCrossed className="w-3 h-3 text-[#007AFF] shrink-0" />
                  {activeKitchen ? activeKitchen.name : "Bếp Ăn"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 text-[#3C3C43]">
                  <Shield className="w-2.5 h-2.5 text-[#3C3C43]" />
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Admin & Kitchen Main Navigation (iOS Segmented Control for Desktop / Tablet) */}
        {!isSupplier && (
          <nav className="hidden lg:flex items-center bg-[#767680]/12 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => onTabChange("quotes")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                activeAdminTab === "quotes"
                  ? "bg-white text-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E]"
              }`}
            >
              <span>1. Báo Giá</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("orders")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                activeAdminTab === "orders"
                  ? "bg-white text-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E]"
              }`}
            >
              <span>2. Đặt Bếp</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("po")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                activeAdminTab === "po"
                  ? "bg-white text-[#34C759] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-bold"
                  : "text-[#8E8E93] hover:text-[#1C1C1E]"
              }`}
            >
              <span>3. Gửi Zalo</span>
            </button>

            {!isKitchen && (
              <button
                type="button"
                onClick={() => onTabChange("reports")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
                  activeAdminTab === "reports"
                    ? "bg-white text-[#1C1C1E] shadow-[0_1px_3px_rgba(0,0,0,0.12)] font-bold"
                    : "text-[#8E8E93] hover:text-[#1C1C1E]"
                }`}
              >
                <span>4. Báo Cáo</span>
              </button>
            )}
          </nav>
        )}

        {/* Right: Date Picker & iOS Controls */}
        <div className="flex items-center gap-2">
          {/* iOS Date Picker Pill */}
          <div className="flex items-center bg-white/80 border border-black/5 rounded-full px-2.5 py-1 gap-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
            <input
              type="date"
              value={workingDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-bold text-[#1C1C1E] bg-transparent focus:outline-none cursor-pointer tnum w-28 sm:w-auto"
            />
          </div>

          {/* Quick Role Switcher Select */}
          <div className="hidden sm:flex items-center bg-white/80 border border-black/5 rounded-full px-2.5 py-1 gap-1.5 shadow-2xs">
            <span className="text-[11px] font-medium text-[#8E8E93]">Vai trò:</span>
            <select
              value={
                session.role === "admin"
                  ? "admin"
                  : session.role === "supplier"
                  ? `supplier:${session.supplierId}`
                  : `kitchen:${session.kitchenId}`
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "admin") {
                  onQuickRoleChange("admin", null);
                } else if (val.startsWith("supplier:")) {
                  onQuickRoleChange("supplier", val.split(":")[1]);
                } else if (val.startsWith("kitchen:")) {
                  onQuickRoleChange("kitchen", val.split(":")[1]);
                }
              }}
              className="text-xs font-bold text-[#1C1C1E] bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="admin">Quản lý Thu mua (Admin)</option>
              {kitchens.length > 0 && (
                <optgroup label="Cổng Bếp Ăn">
                  {kitchens.map((k) => (
                    <option key={k.id} value={`kitchen:${k.id}`}>
                      Bếp: {k.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {suppliers.length > 0 && (
                <optgroup label="Cổng Nhà Cung Cấp">
                  {suppliers.map((s) => (
                    <option key={s.id} value={`supplier:${s.id}`}>
                      NCC: {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* PWA Install App Button */}
          <PwaInstallButton />

          {/* Role Switcher Modal Trigger */}
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-white/80 border border-black/5 hover:bg-white text-xs font-semibold text-[#1C1C1E] transition flex items-center gap-1 shadow-2xs"
            title="Đổi tài khoản"
          >
            <UserCheck className="w-3.5 h-3.5 text-[#8E8E93]" />
            <span className="hidden xl:inline">Tài khoản</span>
          </button>
        </div>
      </div>
    </header>
  );
}
