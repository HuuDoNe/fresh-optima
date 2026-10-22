# FreshOptima — Hệ Thống Tối Ưu Đặt Hàng Rau Củ

Ứng dụng web B2B SaaS quản lý báo giá và tối ưu đặt hàng rau củ theo từng bếp ăn cho chuỗi nhà hàng, suất ăn công nghiệp. Xây dựng bằng **Next.js 15+ (App Router)**, **TypeScript**, **Tailwind CSS**, và **SQLite (Prisma ORM)**.

---

## 🌟 Tính Năng Cốt Lõi

### 1. Phân Quyền Người Dùng (RBAC) Nghiêm Ngặt
- **Quản lý Thu mua (Admin)**:
  - Toàn quyền quản lý danh mục Nhà cung cấp (thêm, sửa, xóa, phân màu nhận diện).
  - Quản lý danh sách Bếp ăn (Bếp A, Bếp B, Bếp C...).
  - Quản lý danh mục Mặt hàng rau củ.
  - Xem & chỉnh sửa Ma trận so sánh báo giá hàng ngày của toàn bộ các nhà cung cấp.
  - Tự động đánh dấu nhãn **Rẻ nhất** cho NCC có giá thấp nhất đang còn hàng.
  - Tính toán phân bổ tối ưu theo từng bếp và tạo Phiếu đặt hàng Zalo.
  - Theo dõi Báo cáo chi phí theo tháng, tra cứu lịch sử và nạp lại đơn cũ vào ngày làm việc để chỉnh sửa.
  - Xuất báo cáo chi phí ra file **Excel (CSV UTF-8 BOM)**.
- **Cổng Nhà Cung Cấp (Supplier Portal - Độc Lập)**:
  - Mỗi NCC có tài khoản riêng biệt.
  - Chỉ xem và thao tác trên danh mục rau củ của chính mình:
    - Bật/tắt trạng thái **Còn hàng / Báo hết hàng**.
    - Nhập Đơn giá chào hàng (VNĐ/kg).
    - Sao chép giá hôm qua, Báo còn hàng tất cả.
    - Tự cập nhật thông tin cá nhân: Tên đại diện, Số điện thoại Zalo nhận đơn, Ghi chú giao hàng.
    - Thêm mặt hàng rau củ mới vào hệ thống.
  - **Tuyệt đối không thấy giá hoặc thông tin của các nhà cung cấp đối thủ**.
- **Loại Bỏ Hoàn Toàn**: *Phân nhóm mặt hàng*, *Đánh giá sao nhà cung cấp*, và *Số lượng tối đa*.

---

### 2. Đặt Hàng Theo Từng Bếp (Admin Tab 2)
- Hỗ trợ không giới hạn số lượng bếp (Bếp A, Bếp B, Bếp C...), cho phép thêm/sửa/xóa bếp linh hoạt.
- **Tối ưu riêng từng bếp**: Tuyệt đối không gộp chung mặt hàng giữa các bếp để đảm bảo nhà cung cấp đóng gói riêng đúng cổng và địa điểm giao của từng bếp.
- **Thuật toán tự động Fallback tồn kho**:
  - Tự động chọn nhà cung cấp có đơn giá rẻ nhất đang còn hàng (`inStock == true`).
  - Nếu NCC rẻ nhất báo hết hàng (`inStock == false`), hệ thống tự động chuyển sang NCC rẻ kế tiếp đang còn hàng và gắn nhãn ghi chú lý do phân bổ.
- **Phiếu Đặt Hàng & Copy Tin Nhắn Zalo**:
  - Tạo Phiếu đặt hàng tổng hợp cho từng NCC nhưng bên trong tách thành từng khối đơn riêng biệt của từng Bếp.
  - Hỗ trợ nút **Copy riêng [Tên Bếp]** hoặc **Copy phiếu Zalo gửi [Tên NCC]** để dán trực tiếp vào ứng dụng Zalo gửi nhà cung cấp.

---

### 3. Báo Cáo Chi Phí & Lịch Sử (Admin Tab 3)
- Bảng tổng hợp theo tháng chỉ hiển thị: **Ngày đặt hàng**, các cột **Tổng tiền của từng Nhà cung cấp**, và **Tổng cộng ngày**.
- Dòng chân trang (Footer) tự động tính tổng chi phí cả tháng của từng NCC và toàn doanh nghiệp.
- **Xem Lịch Sử Hôm Trước & Tra Cứu Ngày Bất Kỳ**:
  - Bấm nút *"Xem lịch sử hôm trước"* để nhảy nhanh đến ngày hôm trước và mở bảng kiểm tra chi tiết (Day Inspector).
  - Hiển thị danh sách chi tiết các mặt hàng từng bếp đã đặt trong ngày đó.
  - Nút **"Mở ngày này ở mục Đặt hàng"**: Nạp lại toàn bộ số lượng của ngày lịch sử đó về Tab Đặt hàng để người dùng kiểm tra hoặc chỉnh sửa tiếp.
- **Xuất Báo Cáo Ra File CSV / Excel**:
  - Đính kèm mã UTF-8 BOM (`\uFEFF`) để mở trực tiếp trên Excel tiếng Việt không bị lỗi font.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- **Node.js**: >= 18.x (khuyên dùng Node 20 hoặc 24).
- **npm** hoặc **pnpm** / **yarn**.

### 2. Cài Đặt & Nạp Dữ Liệu
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi tạo database SQLite và nạp bộ dữ liệu mẫu (3 NCC, 3 Bếp, 8 Rau củ, 10 ngày lịch sử)
npx prisma db push
npm run prisma:seed # hoặc: npx tsx prisma/seed.ts
```

### 3. Chạy Ứng Dụng
```bash
# Chạy môi trường phát triển (Development)
npm run dev
# Truy cập: http://localhost:3000

# Chạy build kiểm thử production
npm run build
npm run start
```

### 4. Chạy Kiểm Thử Nghiệp Vụ Tự Động
```bash
npx tsx test-verification.ts
```

---

## 📂 Cấu Trúc Mã Nguồn

```text
src/
├── app/
│   ├── layout.tsx           # Font Inter, JetBrains Mono, Meta
│   ├── page.tsx             # Điều phối trạng thái chính & RBAC
│   └── globals.css          # Tailwind CSS v4, tnum, scrollbar
├── actions/
│   └── app-actions.ts       # Server Actions (CRUD, Quote, Commit)
├── components/
│   ├── layout/Header.tsx    # Thanh điều hướng Nordic SaaS, Role Switcher
│   ├── supplier/
│   │   └── SupplierPortal.tsx # Cổng độc lập cho Nhà Cung Cấp
│   ├── admin/
│   │   ├── TabQuotes.tsx    # Tab 1: Ma trận Báo giá & Danh bạ NCC
│   │   ├── TabOrders.tsx    # Tab 2: Đặt hàng theo bếp & Phiếu Zalo
│   │   └── TabReports.tsx   # Tab 3: Báo cáo chi phí, Lịch sử & Nạp lại
│   └── modals/              # Các hộp thoại thêm/sửa Bếp, NCC, Mặt hàng
├── lib/
│   ├── db.ts                # Prisma Client singleton
│   ├── types.ts             # TypeScript interfaces & types
│   ├── optimizer.ts         # Thuật toán tối ưu đơn giá theo bếp
│   ├── zalo.ts              # Trình tạo tin nhắn Zalo chuẩn định dạng
│   └── export-csv.ts        # Hàm xuất Excel CSV UTF-8
└── prisma/
    ├── schema.prisma        # Schema SQLite (sẵn sàng cho Supabase/PostgreSQL)
    └── seed.ts              # Bộ dữ liệu mẫu thực tế
```
