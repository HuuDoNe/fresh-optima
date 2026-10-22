"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-sm w-full p-5 border border-black/5 shadow-2xl animate-view space-y-4">
        <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-2 sm:hidden" />
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-950">{title}</h4>
            <p className="text-xs text-zinc-500 mt-1">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white transition shadow-xs"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
