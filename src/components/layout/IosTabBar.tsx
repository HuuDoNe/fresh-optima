"use client";

import React from "react";
import { ShoppingBag, BarChart3 } from "lucide-react";
import { MainTab } from "./Header";

interface IosTabBarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  orderCount?: number;
  isKitchen?: boolean;
}

export function IosTabBar({
  activeTab,
  onTabChange,
  orderCount = 0,
  isKitchen = false,
}: IosTabBarProps) {
  const allTabs = [
    {
      id: "orders" as MainTab,
      label: "Đơn Rau",
      icon: ShoppingBag,
      badge: orderCount > 0 ? orderCount : null,
    },
    {
      id: "reports" as MainTab,
      label: "Báo Cáo",
      icon: BarChart3,
    },
  ];

  const tabs = isKitchen ? allTabs.filter((t) => t.id !== "reports") : allTabs;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-[#F9F9F9]/95 backdrop-blur-2xl border-t border-[#3C3C43]/15 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] sm:border-x sm:border-[#3C3C43]/10">
      <div
        className={`w-full grid ${
          tabs.length === 1 ? "grid-cols-1" : "grid-cols-2"
        } gap-3`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center py-1 transition-transform active:scale-90 relative select-none"
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-colors duration-150 ${
                    isActive
                      ? "text-[#34C759] stroke-[2.4]"
                      : "text-[#8E8E93] stroke-[1.8]"
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold tracking-tight mt-0.5 transition-colors duration-150 ${
                  isActive
                    ? "text-[#34C759] font-bold"
                    : "text-[#8E8E93]"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
