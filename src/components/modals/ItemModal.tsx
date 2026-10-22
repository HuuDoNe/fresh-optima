"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, unit: string, basePrice: number) => Promise<void>;
}

export function ItemModal({ isOpen, onClose, onSave }: ItemModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("20000");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name, unit, parseFloat(price) || 20000);
      setName("");
      setUnit("kg");
      setPrice("20000");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 border border-zinc-200 shadow-xl animate-view">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-950">Thêm Mặt Hàng Rau Củ Mới</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Mặt hàng mới sẽ được tự động cập nhật vào danh mục chung của hệ thống
            </p>
          </div>
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
              Tên mặt hàng rau củ *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Cà rốt Đà Lạt, Rau muống..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Đơn vị tính *
              </label>
              <input
                type="text"
                required
                placeholder="kg, bó, túi, khay..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Đơn giá dự kiến (VNĐ)
              </label>
              <input
                type="number"
                step="500"
                min="500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 tnum"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
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
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Thêm Mặt Hàng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
