"use client";

import React from "react";
import { Tag, ShoppingBag, Send, BarChart3 } from "lucide-react";
import { AdminTab } from "./Header";

interface IosTabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
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
      id: "quotes" as AdminTab,
      label: "Báo Giá",
      icon: Tag,
    },
    {
      id: "orders" as AdminTab,
      label: "Đặt Bếp",
      icon: ShoppingBag,
      badge: orderCount > 0 ? orderCount : null,
    },
    {
      id: "po" as AdminTab,
      label: "Gửi Zalo",
      icon: Send,
    },
    {
      id: "reports" as AdminTab,
      label: "Báo Cáo",
      icon: BarChart3,
    },
  ];

  const tabs = isKitchen ? allTabs.filter((t) => t.id !== "reports") : allTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F9F9F9]/90 backdrop-blur-2xl border-t border-[#3C3C43]/15 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div
        className={`max-w-md mx-auto grid ${
          isKitchen ? "grid-cols-3" : "grid-cols-4"
        } gap-1`}
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
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors duration-150 ${
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
