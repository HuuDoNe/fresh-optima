"use client";

import React, { useState, useEffect } from "react";
import { KitchenData } from "@/lib/types";
import { X, Trash2 } from "lucide-react";

interface KitchenModalProps {
  isOpen: boolean;
  onClose: () => void;
  kitchen: KitchenData | null;
  kitchenCount: number;
  onSave: (id: string | null, name: string, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function KitchenModal({
  isOpen,
  onClose,
  kitchen,
  kitchenCount,
  onSave,
  onDelete,
}: KitchenModalProps) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kitchen) {
      setName(kitchen.name);
      setNote(kitchen.note || "");
    } else {
      const nextChar = String.fromCharCode(65 + kitchenCount);
      setName(`Bếp ${nextChar}`);
      setNote("");
    }
  }, [kitchen, kitchenCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(kitchen ? kitchen.id : null, name, note);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!kitchen || kitchenCount <= 1) return;
    setLoading(true);
    try {
      await onDelete(kitchen.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-[28px] sm:rounded-3xl max-w-md w-full p-6 border border-black/5 shadow-2xl animate-view">
        <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-3 sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <h3 className="text-sm font-bold text-zinc-950">
            {kitchen ? `Cập Nhật ${kitchen.name}` : "Thêm Bếp Ăn Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Tên Bếp (Phân xưởng / Cơ sở) *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Bếp A, Bếp B, Bếp C..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Ghi chú giao hàng / Cổng nhận
            </label>
            <input
              type="text"
              placeholder="VD: Giao cổng số 1 trước 5h30 sáng"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
            {kitchen && kitchenCount > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 p-1.5 rounded hover:bg-rose-50 transition"
              >
                <Trash2 className="w-4 h-4" /> Xóa bếp này
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition disabled:opacity-50"
              >
                {loading ? "Đang lưu..." : kitchen ? "Cập Nhật" : "Thêm Bếp"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
