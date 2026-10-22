import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getTodayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

function shiftDateISO(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split("T")[0];
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing tables
  await prisma.orderLine.deleteMany();
  await prisma.orderBatch.deleteMany();
  await prisma.dailyQuote.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vegetableItem.deleteMany();
  await prisma.kitchen.deleteMany();
  await prisma.supplier.deleteMany();

  const today = getTodayISO();
  const yesterday = shiftDateISO(today, -1);

  // 1. Suppliers
  const sup1 = await prisma.supplier.create({
    data: {
      id: "sup1",
      name: "HTX Rau Sạch Củ Chi",
      phone: "0918234567",
      note: "Giao trước 5h45 sáng, chuẩn VietGAP",
      color: "#059669",
    },
  });

  const sup2 = await prisma.supplier.create({
    data: {
      id: "sup2",
      name: "Vựa Rau Chợ Đầu Mối",
      phone: "0987345678",
      note: "Nguồn hàng dồi dào, hỗ trợ giao bù",
      color: "#2563EB",
    },
  });

  const sup3 = await prisma.supplier.create({
    data: {
      id: "sup3",
      name: "Nông Trại Xanh Đà Lạt",
      phone: "0909123456",
      note: "Chuyên củ quả Đà Lạt tươi trong ngày",
      color: "#D97706",
    },
  });

  const suppliers = [sup1, sup2, sup3];

  // 2. Users (RBAC)
  await prisma.user.create({
    data: {
      username: "admin",
      role: "admin",
    },
  });

  for (const s of suppliers) {
    await prisma.user.create({
      data: {
        username: `ncc_${s.id}`,
        role: "supplier",
        supplierId: s.id,
      },
    });
  }

  // 3. Kitchens
  const k1 = await prisma.kitchen.create({
    data: {
      id: "k1",
      name: "Bếp A",
      note: "Bếp Trung Tâm - Giao cổng số 1 trước 5h30",
      color: "#059669",
    },
  });

  const k2 = await prisma.kitchen.create({
    data: {
      id: "k2",
      name: "Bếp B",
      note: "Bếp Khu Văn Phòng - Giao cổng số 2 trước 6h00",
      color: "#2563EB",
    },
  });

  const k3 = await prisma.kitchen.create({
    data: {
      id: "k3",
      name: "Bếp C",
      note: "Bếp Chuyên Gia - Giao sảnh sau trước 6h15",
      color: "#D97706",
    },
  });

  const kitchens = [k1, k2, k3];

  // 4. Vegetable Items
  const itemsData = [
    { id: "v1", name: "Khoai tây Đà Lạt", unit: "kg", basePrice: 25000 },
    { id: "v2", name: "Hành lá tươi", unit: "kg", basePrice: 31000 },
    { id: "v3", name: "Củ cải trắng", unit: "kg", basePrice: 13500 },
    { id: "v4", name: "Cải thảo Đà Lạt", unit: "kg", basePrice: 15500 },
    { id: "v5", name: "Cà chua Đà Lạt", unit: "kg", basePrice: 22000 },
    { id: "v6", name: "Rau muống hạt", unit: "kg", basePrice: 11500 },
    { id: "v7", name: "Cải ngọt", unit: "kg", basePrice: 13500 },
    { id: "v8", name: "Bí đỏ hồ lô", unit: "kg", basePrice: 14500 },
  ];

  const items = [];
  for (const item of itemsData) {
    items.push(await prisma.vegetableItem.create({ data: item }));
  }

  // 5. Daily Quotes for Today & Yesterday
  const quoteMatrix: Record<string, Record<string, { price: number; inStock: boolean }>> = {
    v1: {
      sup1: { price: 27000, inStock: true },
      sup2: { price: 25500, inStock: true },
      sup3: { price: 24000, inStock: true }, // Cheapest
    },
    v2: {
      sup1: { price: 29500, inStock: true }, // Cheapest
      sup2: { price: 31500, inStock: true },
      sup3: { price: 33000, inStock: true },
    },
    v3: {
      sup1: { price: 14000, inStock: true },
      sup2: { price: 12500, inStock: true }, // Cheapest
      sup3: { price: 13500, inStock: true },
    },
    v4: {
      sup1: { price: 17000, inStock: true },
      sup2: { price: 16000, inStock: true },
      sup3: { price: 15000, inStock: true }, // Cheapest
    },
    v5: {
      sup1: { price: 23500, inStock: true },
      sup2: { price: 22000, inStock: true }, // Best available (fallback from sup3)
      sup3: { price: 20500, inStock: false }, // Cheapest but OUT OF STOCK!
    },
    v6: {
      sup1: { price: 11000, inStock: true }, // Cheapest
      sup2: { price: 12000, inStock: true },
      sup3: { price: 13000, inStock: true },
    },
    v7: {
      sup1: { price: 13000, inStock: true }, // Cheapest
      sup2: { price: 14000, inStock: true },
      sup3: { price: 15000, inStock: true },
    },
    v8: {
      sup1: { price: 15500, inStock: true },
      sup2: { price: 14000, inStock: true }, // Cheapest
      sup3: { price: 15000, inStock: true },
    },
  };

  for (const date of [today, yesterday]) {
    for (const item of items) {
      for (const sup of suppliers) {
        const q = quoteMatrix[item.id]?.[sup.id] || { price: item.basePrice, inStock: true };
        await prisma.dailyQuote.create({
          data: {
            date,
            itemId: item.id,
            supplierId: sup.id,
            price: q.price,
            inStock: q.inStock,
          },
        });
      }
    }
  }

  // 6. History Order Batches (10 days back)
  for (let d = 10; d >= 1; d--) {
    const dateStr = shiftDateISO(today, -d);
    let dayWeight = 0;
    let dayCost = 0;
    let daySaved = 0;

    const lineRecords: Array<{
      kitchenId: string;
      itemId: string;
      supplierId: string;
      qty: number;
      unitPrice: number;
      totalPrice: number;
      note: string;
      isFallback: boolean;
    }> = [];

    items.forEach((it, idx) => {
      if ((idx + d) % 4 === 0) return;
      const kObj = kitchens[(idx + d) % kitchens.length];
      const sup = suppliers[(idx + d) % suppliers.length];
      const qty = 15 + ((idx * 5 + d * 3) % 25);
      const price = it.basePrice - 500 + ((d * 200 + idx * 250) % 1500);
      const maxP = price + 1800;
      const cost = qty * price;
      const saved = qty * (maxP - price);
      const isFallback = idx % 4 === 0;

      lineRecords.push({
        kitchenId: kObj.id,
        itemId: it.id,
        supplierId: sup.id,
        qty,
        unitPrice: price,
        totalPrice: cost,
        note: isFallback ? "NCC rẻ nhất hết hàng → Đổi sang NCC rẻ kế tiếp" : "Đơn giá rẻ nhất",
        isFallback,
      });

      dayWeight += qty;
      dayCost += cost;
      daySaved += saved;
    });

    const batch = await prisma.orderBatch.create({
      data: {
        id: `ORD-${dateStr.replace(/-/g, "")}`,
        date: dateStr,
        totalWeight: dayWeight,
        totalCost: dayCost,
        totalSaved: daySaved,
      },
    });

    for (const l of lineRecords) {
      await prisma.orderLine.create({
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
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
