"use client";

import React, { useState, useEffect } from "react";
import { SupplierData } from "@/lib/types";
import { X } from "lucide-react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: SupplierData | null;
  onSave: (id: string | null, name: string, phone: string, note: string) => Promise<void>;
}

export function SupplierModal({
  isOpen,
  onClose,
  supplier,
  onSave,
}: SupplierModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setPhone(supplier.phone);
      setNote(supplier.note || "");
    } else {
      setName("");
      setPhone("");
      setNote("");
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    try {
      await onSave(supplier ? supplier.id : null, name, phone, note);
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
            {supplier ? "Cập Nhật Nhà Cung Cấp" : "Thêm Nhà Cung Cấp Mới"}
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
              Tên Nhà Cung Cấp *
            </label>
            <input
              type="text"
              required
              placeholder="VD: HTX Rau Sạch Củ Chi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Số điện thoại / Zalo nhận đơn *
            </label>
            <input
              type="text"
              required
              placeholder="VD: 0918234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900 tnum"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Ghi chú giao hàng / Điều kiện nhận đơn
            </label>
            <input
              type="text"
              placeholder="VD: Giao trước 5h45 sáng, chuẩn VietGAP"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
            />
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
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : supplier ? "Cập Nhật" : "Thêm Nhà Cung Cấp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
