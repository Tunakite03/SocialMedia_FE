# 💻 Frontend Architecture (React + TailwindCSS + WebRTC)

## 1. Tổng quan

Frontend của hệ thống được phát triển bằng **ReactJS** kết hợp **TailwindCSS**, hướng đến trải nghiệm người dùng mượt mà, responsive và realtime.  
Hệ thống còn tích hợp **WebRTC** để hỗ trợ gọi video và truyền dữ liệu trực tiếp giữa các client.

## 2. Thành phần chính

### ⚪ ReactJS

-  Quản lý giao diện người dùng và điều hướng giữa các trang (SPA - Single Page Application).
-  Tích hợp với API của backend thông qua **HTTPS** để thực hiện:
   -  Đăng nhập, đăng ký.
   -  Đăng bài viết, bình luận, gửi tin nhắn.
   -  Hiển thị thông báo realtime.
-  Sử dụng zustand để quản lý states
-  Shadcn to add components, use index.css to set màu chủ đạo của web theo tỉ lệ 60%-30%-10%.

### 🟣 TailwindCSS

-  Framework CSS tiện lợi giúp tạo giao diện hiện đại, tối giản.
-  Tối ưu hiệu suất build và giảm kích thước CSS nhờ cơ chế purge.

### 🔵 WebRTC

-  Được sử dụng cho tính năng gọi thoại và video giữa người dùng.
-  Cho phép truyền dữ liệu trực tiếp giữa các thiết bị mà không cần thông qua server trung gian (trừ giai đoạn signaling).
-  Hỗ trợ kết nối với **WebRTC SFU/Peer Server** để tối ưu băng thông khi nhiều người tham gia cuộc gọi.

### 🟢 Socket.IO Client

-  Kết nối liên tục với backend để nhận các sự kiện realtime như:
   -  Tin nhắn mới, cuộc gọi đến, thông báo.
   -  Trạng thái hoạt động của người dùng (online/offline).

---

## 3. Luồng hoạt động Frontend

1. Người dùng thao tác trên giao diện React → gửi yêu cầu HTTPS đến **Node.js API**.
2. Các sự kiện realtime (chat, call, notification) được nhận qua **Socket.IO**.
3. Khi người dùng tham gia cuộc gọi, **WebRTC** được kích hoạt để truyền âm thanh và hình ảnh trực tiếp.
4. Kết quả phân tích cảm xúc hoặc transcript cuộc gọi được backend gửi ngược lại hiển thị trên giao diện.

---

## 4. Ưu điểm kiến trúc

-  **Hiệu năng cao**, giao diện phản hồi nhanh.
-  **Realtime mạnh mẽ** nhờ tích hợp Socket.IO và WebRTC.
-  **Thiết kế linh hoạt**, dễ bảo trì nhờ component hóa (React).
-  **Trải nghiệm người dùng tốt**, hỗ trợ responsive trên mọi thiết bị.
