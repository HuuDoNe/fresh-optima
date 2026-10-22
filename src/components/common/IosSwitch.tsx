"use client";

import React from "react";

interface IosSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelActive?: string;
  labelInactive?: string;
}

export function IosSwitch({
  checked,
  onChange,
  labelActive = "Còn hàng",
  labelInactive = "Hết hàng",
}: IosSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 group cursor-pointer focus:outline-none select-none"
    >
      <div
        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
          checked ? "bg-[#34C759]" : "bg-[#E5E5EA]"
        }`}
      >
        <div
          className={`bg-white w-5 h-5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] transform transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span
        className={`text-xs font-semibold tracking-tight transition-colors ${
          checked ? "text-[#34C759]" : "text-[#8E8E93]"
        }`}
      >
        {checked ? labelActive : labelInactive}
      </span>
    </button>
  );
}
