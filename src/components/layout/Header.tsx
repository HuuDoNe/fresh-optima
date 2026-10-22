"use client";

import React from "react";
import { SupplierData, SessionState } from "@/lib/types";
import { Calendar, UserCheck, Shield } from "lucide-react";
import { PwaInstallButton } from "@/components/common/PwaInstallButton";

interface HeaderProps {
  session: SessionState;
  suppliers: SupplierData[];
  workingDate: string;
  activeAdminTab: "quotes" | "orders" | "reports";
  onTabChange: (tab: "quotes" | "orders" | "reports") => void;
  onDateChange: (newDate: string) => void;
  onOpenRoleModal: () => void;
  onQuickRoleChange: (role: "admin" | "supplier", supplierId?: string | null) => void;
}

export function Header({
  session,
  suppliers,
  workingDate,
  activeAdminTab,
  onTabChange,
  onDateChange,
  onOpenRoleModal,
  onQuickRoleChange,
}: HeaderProps) {
  const isSupplier = session.role === "supplier";
  const activeSupplier = suppliers.find((s) => s.id === session.supplierId);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Active Mode Pill */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            FO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-zinc-950">
                FreshOptima
              </span>
              {isSupplier ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Cổng NCC: {activeSupplier ? activeSupplier.name : "Nhà Cung Cấp"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200">
                  <Shield className="w-3 h-3 text-zinc-600" />
                  Quản lý Thu mua
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              Hệ thống tối ưu báo giá & đặt hàng rau củ theo từng bếp
            </p>
          </div>
        </div>

        {/* Center: Admin Main Navigation (Hidden in Supplier Mode) */}
        {!isSupplier && (
          <nav className="hidden md:flex items-center bg-zinc-100/90 p-1 rounded-lg border border-zinc-200/80">
            <button
              type="button"
              onClick={() => onTabChange("quotes")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
                activeAdminTab === "quotes"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-zinc-200/70 text-zinc-700 font-mono">
                1
              </span>
              <span>Báo Giá Hàng Ngày</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("orders")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
                activeAdminTab === "orders"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-zinc-200/70 text-zinc-700 font-mono">
                2
              </span>
              <span>Đặt Hàng Từng Bếp</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange("reports")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
                activeAdminTab === "reports"
                  ? "bg-white text-zinc-950 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-950"
              }`}
            >
              <span className="w-4 h-4 rounded text-[10px] flex items-center justify-center bg-zinc-200/70 text-zinc-700 font-mono">
                3
              </span>
              <span>Báo Cáo Chi Phí</span>
            </button>
          </nav>
        )}

        {/* Right: Date Picker & Role Switcher (RBAC) */}
        <div className="flex items-center gap-2.5">
          {/* Working Date Selector */}
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <input
              type="date"
              value={workingDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-xs font-semibold text-zinc-800 bg-transparent focus:outline-none cursor-pointer tnum"
            />
          </div>

          {/* Quick Role Switcher Select */}
          <div className="hidden sm:flex items-center bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400">Vai trò:</span>
            <select
              value={
                session.role === "admin"
                  ? "admin"
                  : `supplier:${session.supplierId}`
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "admin") {
                  onQuickRoleChange("admin", null);
                } else if (val.startsWith("supplier:")) {
                  onQuickRoleChange("supplier", val.split(":")[1]);
                }
              }}
              className="text-xs font-semibold text-zinc-900 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="admin">Quản lý Thu mua (Admin)</option>
              {suppliers.map((s) => (
                <option key={s.id} value={`supplier:${s.id}`}>
                  NCC: {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* PWA Install App Button */}
          <PwaInstallButton />

          {/* Role Switcher Modal Trigger */}
          <button
            type="button"
            onClick={onOpenRoleModal}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition flex items-center gap-1.5 shadow-2xs"
            title="Chuyển đổi tài khoản Admin / Nhà cung cấp"
          >
            <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden lg:inline">Đổi tài khoản</span>
          </button>
        </div>
      </div>

      {/* Mobile Admin Navigation Bar */}
      {!isSupplier && (
        <div className="md:hidden grid grid-cols-3 gap-1 px-4 py-2 bg-zinc-50 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => onTabChange("quotes")}
            className={`py-1.5 rounded-md text-xs font-semibold text-center ${
              activeAdminTab === "quotes"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}
          >
            1. Báo Giá
          </button>
          <button
            type="button"
            onClick={() => onTabChange("orders")}
            className={`py-1.5 rounded-md text-xs font-semibold text-center ${
              activeAdminTab === "orders"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}
          >
            2. Đặt Theo Bếp
          </button>
          <button
            type="button"
            onClick={() => onTabChange("reports")}
            className={`py-1.5 rounded-md text-xs font-semibold text-center ${
              activeAdminTab === "reports"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600"
            }`}
          >
            3. Báo Cáo
          </button>
        </div>
      )}
    </header>
  );
}
