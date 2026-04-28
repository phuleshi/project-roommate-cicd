# 📌 Hướng dẫn chạy dự án Roommate

Dưới đây là các bước chi tiết để cài đặt và chạy dự án này trên môi trường local.

## 1. Khởi động Cơ sở dữ liệu (MySQL)

Trước tiên, hãy đảm bảo MySQL đang hoạt động:

1. Mở **XAMPP** hoặc **MySQL Workbench**.
2. Start dịch vụ **MySQL** (nếu dùng XAMPP).
3. Import database:
   - Mở công cụ quản lý MySQL (như phpMyAdmin hoặc MySQL Workbench).
   - Chạy/execute file `roommate.sql` (nằm ở thư mục gốc của dự án) để tạo cơ sở dữ liệu và các bảng cần thiết.

## 2. Cấu hình Database cho Backend

Kiểm tra và cấu hình file `.env` trong thư mục `backend`. Nếu chưa có, hãy tạo file `backend/.env` với nội dung sau (thay đổi thông tin nếu cấu hình MySQL của bạn khác):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=roommate
```

## 3. Cài đặt Dependencies

Mở terminal và cài đặt các thư viện cần thiết cho cả backend và frontend.

### 📌 Cài đặt Backend
Mở terminal mới và chạy các lệnh sau:
```bash
cd backend
npm install
```

### 📌 Cài đặt Frontend
Mở một terminal khác và chạy các lệnh sau:
```bash
cd frontend
npm install
```

## 4. Chạy dự án (Run Application)

Để ứng dụng hoạt động đầy đủ, bạn cần chạy song song cả Backend và Frontend.

### Khởi động Backend
Tại terminal của thư mục `backend`, chạy lệnh:
```bash
node src/index.js
```
*(Nếu thành công, terminal sẽ báo kết nối database thành công và server chạy ở port 8800 hoặc port đã cấu hình).*

### Khởi động Frontend
Tại terminal của thư mục `frontend`, chạy lệnh:
```bash
npm run dev
```
*(Sau đó, mở đường dẫn `http://localhost:5173/` được hiển thị trên terminal bằng trình duyệt để sử dụng ứng dụng).*

---
**💡 Lưu ý:** 
- Đảm bảo bạn đã cài đặt **Node.js** trên máy tính.
- Nếu gặp lỗi port đã được sử dụng, hãy tắt các ứng dụng đang dùng port đó hoặc đổi port trong source code.