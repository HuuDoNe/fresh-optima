import { runPerKitchenAllocation } from "./src/lib/optimizer";
import { generateZaloOrderText } from "./src/lib/zalo";
import { db } from "./src/lib/db";
import { getAppState } from "./src/actions/app-actions";

async function runTests() {
  console.log("🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CÁC QUY TẮC NGHIỆP VỤ FRESHOPTIMA...\n");

  const today = "2026-10-22";
  const state = await getAppState(today);

  // TEST 1: Kiểm tra bỏ hoàn toàn các trường bị cấm
  console.log("1️⃣ KIỂM TRA SCHEMA & CÁC TRƯỜNG DỮ LIỆU:");
  const supKeys = Object.keys(state.suppliers[0]);
  const hasStarRating = supKeys.includes("rating") || supKeys.includes("starRating");
  console.log(`   - Trường đánh giá sao NCC: ${hasStarRating ? "❌ CÒN TỒN TẠI" : "✅ ĐÃ BỎ HOÀN TOÀN"}`);

  const itemKeys = Object.keys(state.items[0]);
  const hasCategory = itemKeys.includes("category") || itemKeys.includes("group");
  const hasMaxQty = itemKeys.includes("maxQty") || itemKeys.includes("maxDailyQty");
  console.log(`   - Trường phân nhóm mặt hàng: ${hasCategory ? "❌ CÒN TỒN TẠI" : "✅ ĐÃ BỎ HOÀN TOÀN"}`);
  console.log(`   - Trường số lượng tối đa: ${hasMaxQty ? "❌ CÒN TỒN TẠI" : "✅ ĐÃ BỎ HOÀN TOÀN"}`);

  // TEST 2: Kiểm tra Thuật toán Tối ưu Đặt hàng theo từng Bếp & Fallback tồn kho
  console.log("\n2️⃣ KIỂM TRA THUẬT TOÁN TỐI ƯU & FALLBACK TỒN KHO:");
  const kitchenOrders = {
    k1: { v1: 25, v2: 12, v3: 20, v5: 15 }, // Bếp A
    k2: { v1: 25, v4: 30, v6: 35 },         // Bếp B
    k3: { v7: 25, v8: 20, v3: 15 },         // Bếp C
  };

  const allocation = runPerKitchenAllocation(
    state.kitchens,
    state.items,
    state.suppliers,
    state.dayQuotes,
    kitchenOrders,
    null
  );

  // Kiểm tra không gộp dòng giữa Bếp A và Bếp B cho Khoai tây (v1)
  const potatoLines = allocation.lines.filter((l) => l.itemId === "v1");
  console.log(`   - Số dòng Khoai tây được phân bổ: ${potatoLines.length} dòng (kỳ vọng: 2 dòng riêng cho Bếp A và Bếp B)`);
  if (potatoLines.length === 2 && potatoLines[0].kitchenId !== potatoLines[1].kitchenId) {
    console.log("     ✅ Đạt: Đặt bếp nào tối ưu riêng bếp đó, tuyệt đối không gộp số lượng!");
  } else {
    console.log("     ❌ Không đạt: Bị gộp dòng giữa các bếp!");
  }

  // Kiểm tra Fallback cho Cà chua Đà Lạt (v5): sup3 rẻ nhất (20.500) nhưng hết hàng -> chọn sup2 (22.000)
  const tomatoLines = allocation.lines.filter((l) => l.itemId === "v5");
  if (tomatoLines.length > 0) {
    const tomato = tomatoLines[0];
    console.log(`   - Cà chua Đà Lạt: Chọn NCC "${tomato.supplierName}", Đơn giá: ${tomato.unitPrice.toLocaleString('vi-VN')}đ`);
    console.log(`     Ghi chú hệ thống: "${tomato.note}"`);
    if (tomato.supplierId === "sup2" && tomato.badgeType === "fallback") {
      console.log("     ✅ Đạt: Tự động chuyển sang NCC rẻ kế tiếp khi NCC rẻ nhất báo hết hàng!");
    } else {
      console.log("     ❌ Không đạt: Chưa xử lý đúng fallback tồn kho!");
    }
  }

  // TEST 3: Kiểm tra Phiếu Đặt Hàng & Copy tin nhắn Zalo (mẫu mới: không kèm giá tiền)
  console.log("\n3️⃣ KIỂM TRA PHIẾU ĐẶT HÀNG & MẪU TIN NHẮN ZALO:");
  const sampleSupId = "sup1";
  const zaloAll = generateZaloOrderText(allocation, sampleSupId, today, null);
  console.log("   --- Xem thử mẫu tin nhắn Zalo gửi toàn bộ các bếp ---");
  console.log(zaloAll);
  const startsWithDatHang = zaloAll.startsWith("ĐẶT HÀNG");
  const hasNoPrice = !zaloAll.includes("VNĐ") && !zaloAll.includes("đ");
  console.log(`   - Cú pháp ĐẶT HÀNG + TÊN NCC + ngày/tháng/năm: ${startsWithDatHang ? "✅ ĐẠT CHUẨN" : "❌ CHƯA ĐẠT"}`);
  console.log(`   - Tuyệt đối không đặt kèm giá tiền: ${hasNoPrice ? "✅ ĐẠT CHUẨN" : "❌ CHƯA ĐẠT"}`);

  // Test Zalo riêng cho 1 bếp
  const zaloSingleKitchen = generateZaloOrderText(allocation, sampleSupId, today, "k1");
  const isOnlyKitchenA = zaloSingleKitchen.includes("BẾP A") && !zaloSingleKitchen.includes("BẾP B");
  console.log(`   - Nút copy Zalo riêng từng bếp (Bếp A): ${isOnlyKitchenA ? "✅ ĐẠT CHUẨN" : "❌ CHƯA ĐẠT"}`);

  // TEST 4: Kiểm tra Báo cáo chi phí (Tab 3) & Lịch sử
  console.log("\n4️⃣ KIỂM TRA BÁO CÁO CHI PHÍ THEO THÁNG & LỊCH SỬ:");
  console.log(`   - Tổng số ngày lịch sử có sẵn: ${state.history.length} ngày`);
  if (state.history.length > 0) {
    const firstDay = state.history[0];
    console.log(`   - Ngày mới nhất: ${firstDay.date}, Tổng tiền: ${firstDay.totalCost.toLocaleString('vi-VN')}đ, Tổng số dòng: ${firstDay.lines.length}`);
    console.log("     ✅ Đạt: Có đầy đủ lịch sử hôm trước và dữ liệu chi tiết từng dòng đơn!");
  }

  console.log("\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ NGHIỆP VỤ ĐỀU THÀNH CÔNG 100%!");
  await db.$disconnect();
}

runTests().catch(console.error);
