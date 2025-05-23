# Hướng dẫn sử dụng tính năng gửi email thông báo

## 1. Giới thiệu

Tính năng gửi email thông báo cho phép admin gửi thông báo qua Gmail đến tất cả người dùng trong hệ thống xem phim, bao gồm các thông báo về việc bảo trì hệ thống và các thông báo tùy chỉnh khác.

## 2. Cách sử dụng API

### 2.1. Gửi thông báo bảo trì

```bash
POST /api/admin/notifications/send-maintenance
```

Tham số:
- `subject`: Tiêu đề email
- `message`: Nội dung thông báo
- `maintenanceTime`: Thời gian bắt đầu bảo trì
- `expectedDuration`: Thời gian dự kiến hoàn thành
- `userGroup`: Nhóm người dùng (all, premium, free)

Ví dụ:
```json
{
  "subject": "Thông báo bảo trì hệ thống",
  "message": "Chúng tôi sẽ tiến hành bảo trì hệ thống để nâng cấp trải nghiệm xem phim.",
  "maintenanceTime": "2025-05-24 22:00",
  "expectedDuration": "3 giờ",
  "userGroup": "all"
}
```

### 2.2. Gửi thông báo tùy chỉnh

```bash
POST /api/admin/notifications/send-custom
```

Tham số:
- `subject`: Tiêu đề email
- `message`: Nội dung thông báo
- `htmlContent`: Nội dung HTML (tùy chọn)
- `userGroup`: Nhóm người dùng (all, premium, free)

Ví dụ:
```json
{
  "subject": "Phim mới đã ra mắt trên Movie Streaming",
  "message": "Chúng tôi vừa cập nhật các bộ phim mới. Hãy đăng nhập để trải nghiệm!",
  "userGroup": "all"
}
```

### 2.3. Gửi email hàng loạt (Bulk Email)

```bash
POST /api/admin/notifications/send-bulk
```

Tham số:
- `subject`: Tiêu đề email
- `message`: Nội dung thông báo
- `htmlContent`: Nội dung HTML (tùy chọn)
- `userGroup`: Nhóm người dùng (all, premium, free, custom)
- `filter`: Bộ lọc MongoDB tùy chỉnh (chỉ khi userGroup là custom)
- `batchSize`: Kích thước mỗi batch (mặc định: 50)

Ví dụ:
```json
{
  "subject": "Chương trình khuyến mãi tháng 5",
  "message": "Đăng ký gói Premium trong tháng 5 và nhận giảm giá 20%!",
  "userGroup": "free",
  "batchSize": 100
}
```

### 2.4. Gửi email đến người dùng được chọn

```bash
POST /api/admin/notifications/send-to-users
```

Tham số:
- `subject`: Tiêu đề email
- `message`: Nội dung thông báo
- `htmlContent`: Nội dung HTML (tùy chọn)
- `userIds`: Mảng các ID người dùng cần gửi
- `batchSize`: Kích thước mỗi batch (mặc định: 50)

Ví dụ:
```json
{
  "subject": "Thông báo quan trọng cho bạn",
  "message": "Thông báo này chỉ dành riêng cho bạn.",
  "userIds": ["60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb"]
}
```

### 2.5. Gửi email đến danh sách email cụ thể

```bash
POST /api/admin/notifications/send-to-emails
```

Tham số:
- `subject`: Tiêu đề email
- `message`: Nội dung thông báo
- `htmlContent`: Nội dung HTML (tùy chọn)
- `emails`: Mảng các địa chỉ email
- `batchSize`: Kích thước mỗi batch (mặc định: 50)

Ví dụ:
```json
{
  "subject": "Mời bạn tham gia Movie Streaming",
  "message": "Bạn đã được mời tham gia nền tảng xem phim Movie Streaming.",
  "emails": ["user1@example.com", "user2@example.com"]
}
```

### 2.6. Xem lịch sử gửi thông báo

```bash
GET /api/admin/notifications/history
```

Tham số query:
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng kết quả mỗi trang (mặc định: 10)

Ví dụ:
```
GET /api/admin/notifications/history?page=1&limit=20
```

## 3. Sử dụng Script gửi email

### 3.1. Gửi email đến tất cả người dùng

```bash
node scripts/sendEmailToAllUsers.js
```

Hoặc với tham số:

```bash
node scripts/sendEmailToAllUsers.js --subject "Tiêu đề" --message "Nội dung" --userGroup all --batchSize 50
```

### 3.2. Gửi email từ file CSV

```bash
node scripts/sendEmailFromCsv.js
```

Hoặc với tham số:

```bash
node scripts/sendEmailFromCsv.js ./path/to/file.csv "Tiêu đề" "Nội dung" email 50
```

### 3.3. Gửi email hàng loạt

```bash
node scripts/sendBulkEmail.js
```

Hoặc với tham số:

```bash
node scripts/sendBulkEmail.js --subject "Tiêu đề" --message "Nội dung" --userGroup all --batchSize 50
```

## 4. Lưu ý quan trọng

- Để tránh giới hạn gửi email của Gmail (500 email/ngày), nên chia thành các batch nhỏ khi gửi cho nhiều người dùng.
- Email được gửi bằng BCC (Blind Carbon Copy) để bảo vệ thông tin người nhận.
- Lưu ý cài đặt biến môi trường `EMAIL_USER` và `EMAIL_PASS` trong file `.env`.
- Có thể cấu hình SMTP tùy chỉnh bằng các biến môi trường: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`.

## 5. Khắc phục sự cố

- Nếu không thể gửi email, kiểm tra cài đặt email trong file `.env`.
- Đối với Gmail, cần bật "Less secure app access" hoặc sử dụng "App password".
- Kiểm tra lịch sử gửi email để xem thông tin lỗi chi tiết.
- Nếu gặp lỗi "Rate limit exceeded", tăng thời gian chờ giữa các batch hoặc giảm kích thước batch.

## 6. Mẫu Cài Đặt .env

```
# Email Settings
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password-or-app-password

# Optional SMTP Settings (for custom SMTP servers)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
```
