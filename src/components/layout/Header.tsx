"use client";

import React from "react";
import { SupplierData, KitchenData, SessionState, UserRole } from "@/lib/types";
import { Calendar, Shield, UtensilsCrossed } from "lucide-react";
import { PwaInstallButton } from "@/components/common/PwaInstallButton";

export type MainTab = "orders" | "meat" | "reports";
export type OrderStep = "quotes" | "orders" | "po";
export type AdminTab = MainTab;

interface HeaderProps {
  session: SessionState;
  suppliers: SupplierData[];
  kitchens?: KitchenData[];
  workingDate: string;
  activeAdminTab?: MainTab;
  onTabChange?: (tab: MainTab) => void;
  onDateChange: (newDate: string) => void;
  onOpenRoleModal: () => void;
  onQuickRoleChange?: (role: UserRole, id?: string | null) => void;
}

export function Header({
  session,
  suppliers,
  kitchens = [],
  workingDate,
  onDateChange,
  onOpenRoleModal,
}: HeaderProps) {
  const isSupplier = session.role === "supplier";
  const isKitchen = session.role === "kitchen";
  const activeSupplier = suppliers.find((s) => s.id === session.supplierId);
  const activeKitchen = kitchens.find((k) => k.id === session.kitchenId);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F2F2F7]/90 backdrop-blur-xl border-b border-[#3C3C43]/10 pt-[env(safe-area-inset-top,0px)]">
      <div className="w-full px-3.5 h-12 flex items-center justify-between gap-2">
        {/* Left: Role Switcher Pill */}
        <button
          type="button"
          onClick={onOpenRoleModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-black/5 shadow-2xs hover:bg-[#F2F2F7] active:scale-95 transition text-xs font-bold cursor-pointer shrink-0 select-none"
          title="Nhấn để đổi vai trò"
        >
          {isSupplier ? (
            <>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: activeSupplier?.color || "#34C759" }}
              />
              <span className="truncate max-w-[85px] text-[#248A3D]">
                {activeSupplier ? activeSupplier.name : "NCC"}
              </span>
            </>
          ) : isKitchen ? (
            <>
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#007AFF] shrink-0" />
              <span className="truncate max-w-[85px] text-[#007AFF]">
                {activeKitchen ? activeKitchen.name : "Bếp Ăn"}
              </span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-[#3C3C43] shrink-0" />
              <span className="text-[#1C1C1E]">Admin</span>
            </>
          )}
          <span className="text-[9px] text-[#8E8E93]">▼</span>
        </button>

        {/* Center: App Brand */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#34C759] to-[#248A3D] text-white flex items-center justify-center font-black text-[11px] shadow-xs">
            FO
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[#1C1C1E]">
            FreshOptima
          </span>
        </div>

        {/* Right: Compact Date Picker Pill & PWA Install Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-white border border-black/5 rounded-full px-2 py-0.5 gap-1 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-[#34C759] shrink-0" />
            <input
              type="date"
              value={workingDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-[11px] font-bold text-[#1C1C1E] bg-transparent focus:outline-none cursor-pointer tnum w-22"
            />
          </div>
          <PwaInstallButton />
        </div>
      </div>
    </header>
  );
}
