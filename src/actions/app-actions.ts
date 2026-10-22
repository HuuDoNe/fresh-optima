"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAppState(dateStr: string) {
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const kitchens = await db.kitchen.findMany({
    orderBy: { createdAt: "asc" },
  });

  const items = await db.vegetableItem.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Ensure quotes exist for all item x supplier combinations for dateStr
  const existingQuotes = await db.dailyQuote.findMany({
    where: { date: dateStr },
  });

  const quoteMap: Record<string, Record<string, { price: number; inStock: boolean }>> = {};

  existingQuotes.forEach((q) => {
    if (!quoteMap[q.itemId]) quoteMap[q.itemId] = {};
    quoteMap[q.itemId][q.supplierId] = {
      price: q.price,
      inStock: q.inStock,
    };
  });

  // Fill in any missing quotes with defaults
  const toCreate: Array<{
    date: string;
    itemId: string;
    supplierId: string;
    price: number;
    inStock: boolean;
  }> = [];

  items.forEach((it) => {
    if (!quoteMap[it.id]) quoteMap[it.id] = {};
    suppliers.forEach((sup) => {
      if (!quoteMap[it.id][sup.id]) {
        quoteMap[it.id][sup.id] = {
          price: it.basePrice,
          inStock: true,
        };
        toCreate.push({
          date: dateStr,
          itemId: it.id,
          supplierId: sup.id,
          price: it.basePrice,
          inStock: true,
        });
      }
    });
  });

  if (toCreate.length > 0) {
    for (const item of toCreate) {
      await db.dailyQuote.upsert({
        where: {
          date_itemId_supplierId: {
            date: item.date,
            itemId: item.itemId,
            supplierId: item.supplierId,
          },
        },
        update: {},
        create: item,
      });
    }
  }

  // Fetch all history order batches with lines
  const rawHistory = await db.orderBatch.findMany({
    orderBy: { date: "desc" },
    include: {
      lines: {
        include: {
          kitchen: true,
          item: true,
          supplier: true,
        },
      },
    },
  });

  const history = rawHistory.map((h) => ({
    id: h.id,
    date: h.date,
    totalWeight: h.totalWeight,
    totalCost: h.totalCost,
    totalSaved: h.totalSaved,
    lines: h.lines.map((l) => ({
      id: l.id,
      kitchenId: l.kitchenId,
      kitchenName: l.kitchen.name,
      kitchenColor: l.kitchen.color,
      itemId: l.itemId,
      itemName: l.item.name,
      unit: l.item.unit,
      supplierId: l.supplierId,
      supplierName: l.supplier.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      totalPrice: l.totalPrice,
      note: l.note,
      isFallback: l.isFallback,
    })),
  }));

  return {
    suppliers,
    kitchens,
    items,
    dayQuotes: quoteMap,
    history,
  };
}

export async function updateDailyQuoteAction(
  dateStr: string,
  itemId: string,
  supplierId: string,
  price?: number,
  inStock?: boolean
) {
  const existing = await db.dailyQuote.findUnique({
    where: {
      date_itemId_supplierId: {
        date: dateStr,
        itemId,
        supplierId,
      },
    },
  });

  const item = await db.vegetableItem.findUnique({ where: { id: itemId } });
  const defaultPrice = item ? item.basePrice : 20000;

  await db.dailyQuote.upsert({
    where: {
      date_itemId_supplierId: {
        date: dateStr,
        itemId,
        supplierId,
      },
    },
    update: {
      ...(price !== undefined ? { price: Math.max(0, price) } : {}),
      ...(inStock !== undefined ? { inStock } : {}),
    },
    create: {
      date: dateStr,
      itemId,
      supplierId,
      price: price !== undefined ? Math.max(0, price) : defaultPrice,
      inStock: inStock !== undefined ? inStock : true,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function copyYesterdayQuotesAction(
  targetDate: string,
  prevDate: string,
  supplierId: string | null = null
) {
  const prevQuotes = await db.dailyQuote.findMany({
    where: {
      date: prevDate,
      ...(supplierId ? { supplierId } : {}),
    },
  });

  for (const q of prevQuotes) {
    await db.dailyQuote.upsert({
      where: {
        date_itemId_supplierId: {
          date: targetDate,
          itemId: q.itemId,
          supplierId: q.supplierId,
        },
      },
      update: {
        price: q.price,
        inStock: q.inStock,
      },
      create: {
        date: targetDate,
        itemId: q.itemId,
        supplierId: q.supplierId,
        price: q.price,
        inStock: q.inStock,
      },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function setAllInStockAction(
  dateStr: string,
  supplierId: string
) {
  await db.dailyQuote.updateMany({
    where: {
      date: dateStr,
      supplierId,
    },
    data: {
      inStock: true,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function saveSupplierSelfProfileAction(
  supplierId: string,
  name: string,
  phone: string,
  note: string
) {
  try {
    await db.supplier.update({
      where: { id: supplierId },
      data: { name: name.trim(), phone: phone.trim(), note: note.trim() },
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi lưu thông tin NCC";
    return { success: false, error: msg };
  }
}

export async function saveSupplierAction(
  id: string | null,
  name: string,
  phone: string,
  note: string,
  dateStr?: string,
  color?: string
) {
  try {
    const colors = ["#059669", "#2563EB", "#D97706", "#7C3AED", "#E11D48", "#0891B2"];
    if (id) {
      await db.supplier.update({
        where: { id },
        data: { name: name.trim(), phone: phone.trim(), note: note.trim() },
      });
    } else {
      const count = await db.supplier.count();
      const assignedColor = color || colors[count % colors.length];
      const newSup = await db.supplier.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          note: note.trim(),
          color: assignedColor,
        },
      });

      // Populate quotes for existing items for this new supplier
      const items = await db.vegetableItem.findMany();
      const targetDate = dateStr || new Date().toISOString().split("T")[0];
      for (const item of items) {
        await db.dailyQuote.upsert({
          where: {
            date_itemId_supplierId: {
              date: targetDate,
              itemId: item.id,
              supplierId: newSup.id,
            },
          },
          update: {},
          create: {
            date: targetDate,
            itemId: item.id,
            supplierId: newSup.id,
            price: item.basePrice,
            inStock: true,
          },
        });
      }
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi lưu nhà cung cấp";
    console.error("saveSupplierAction error:", err);
    return { success: false, error: msg };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    const count = await db.supplier.count();
    if (count <= 1) throw new Error("Phải giữ lại ít nhất 1 nhà cung cấp");

    await db.supplier.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi xóa nhà cung cấp";
    return { success: false, error: msg };
  }
}

export async function saveKitchenAction(
  id: string | null,
  name: string,
  note: string,
  color?: string
) {
  try {
    const colors = ["#059669", "#2563EB", "#D97706", "#7C3AED", "#E11D48", "#0891B2"];
    if (id) {
      await db.kitchen.update({
        where: { id },
        data: { name: name.trim(), note: note.trim() },
      });
    } else {
      const count = await db.kitchen.count();
      const assignedColor = color || colors[count % colors.length];
      await db.kitchen.create({
        data: {
          name: name.trim(),
          note: note.trim(),
          color: assignedColor,
        },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi lưu bếp ăn";
    return { success: false, error: msg };
  }
}

export async function deleteKitchenAction(id: string) {
  try {
    const count = await db.kitchen.count();
    if (count <= 1) throw new Error("Phải giữ lại ít nhất 1 bếp ăn");

    await db.kitchen.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi xóa bếp ăn";
    return { success: false, error: msg };
  }
}

export async function saveVegetableItemAction(
  name: string,
  unit: string,
  basePrice: number,
  dateStr: string
) {
  try {
    const item = await db.vegetableItem.create({
      data: {
        name: name.trim(),
        unit: unit.trim() || "kg",
        basePrice: Math.max(500, basePrice || 20000),
      },
    });

    const suppliers = await db.supplier.findMany();
    for (const s of suppliers) {
      await db.dailyQuote.create({
        data: {
          date: dateStr,
          itemId: item.id,
          supplierId: s.id,
          price: item.basePrice,
          inStock: true,
        },
      });
    }

    revalidatePath("/");
    return { success: true, item };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi thêm mặt hàng";
    return { success: false, error: msg };
  }
}

export async function deleteVegetableItemAction(id: string) {
  try {
    await db.vegetableItem.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi xóa mặt hàng";
    return { success: false, error: msg };
  }
}

export async function commitOrderBatchAction(
  dateStr: string,
  lines: Array<{
    kitchenId: string;
    itemId: string;
    supplierId: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
    note: string | null;
    isFallback: boolean;
  }>,
  totalWeight: number,
  totalCost: number,
  totalSaved: number
) {
  // Upsert batch
  const batchId = `ORD-${dateStr.replace(/-/g, "")}`;
  
  // Delete existing lines if this date was already committed
  const existing = await db.orderBatch.findUnique({ where: { date: dateStr } });
  if (existing) {
    await db.orderLine.deleteMany({ where: { orderBatchId: existing.id } });
  }

  const batch = await db.orderBatch.upsert({
    where: { date: dateStr },
    update: {
      totalWeight,
      totalCost,
      totalSaved,
    },
    create: {
      id: batchId,
      date: dateStr,
      totalWeight,
      totalCost,
      totalSaved,
    },
  });

  // Create order lines
  for (const l of lines) {
    await db.orderLine.create({
      data: {
        orderBatchId: batch.id,
        kitchenId: l.kitchenId,
        itemId: l.itemId,
        supplierId: l.supplierId,
        qty: l.qty,
        unitPrice: l.unitPrice,
        totalPrice: l.totalPrice,
        note: l.note,
        isFallback: l.isFallback,
      },
    });
  }

  revalidatePath("/");
  return { success: true, batchId: batch.id };
}

export async function deleteHistoryDayAction(dateStr: string) {
  await db.orderBatch.delete({ where: { date: dateStr } });
  revalidatePath("/");
  return { success: true };
}
