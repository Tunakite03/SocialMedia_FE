# Groq AI Assistant - Hướng dẫn sử dụng

## Tổng quan

Assistant chatbot này đã được chỉnh sửa để sử dụng **Groq API** thay vì phân tích cảm xúc cục bộ. Groq cung cấp các mô hình AI mạnh mẽ với tốc độ xử lý cực nhanh.

## Tính năng

-  ✅ Trò chuyện với AI sử dụng Groq API
-  ✅ Lưu trữ lịch sử hội thoại
-  ✅ Giao diện kéo thả (drag & drop) trên desktop
-  ✅ Responsive trên mobile
-  ✅ Lưu API key trong localStorage
-  ✅ Hỗ trợ nhiều mô hình AI

## Cài đặt

### 1. Lấy Groq API Key

1. Truy cập [console.groq.com](https://console.groq.com/keys)
2. Đăng ký/Đăng nhập tài khoản (miễn phí)
3. Tạo API key mới
4. Copy API key (bắt đầu với `gsk_...`)

### 2. Cấu hình trong ứng dụng

1. Mở ứng dụng và click vào icon AI Assistant
2. Click vào icon **Settings** (⚙️) ở góc trên bên phải
3. Nhập Groq API key của bạn
4. Click **Lưu**

## Sử dụng

### Trò chuyện cơ bản

1. Sau khi cấu hình API key, bạn có thể bắt đầu trò chuyện
2. Nhập tin nhắn vào ô input và nhấn Enter hoặc click nút Send
3. AI sẽ phản hồi sử dụng Groq API

### Xóa lịch sử

-  Click icon **Thùng rác** (🗑️) để xóa toàn bộ lịch sử trò chuyện
-  Xác nhận trong dialog

### Các mô hình AI có sẵn

Groq service hỗ trợ các mô hình sau:

-  `llama-3.3-70b-versatile` (mặc định) - Cân bằng giữa tốc độ và chất lượng
-  `llama-3.1-70b-versatile` - Mô hình lớn, chất lượng cao
-  `llama-3.1-8b-instant` - Siêu nhanh cho câu trả lời ngắn
-  `mixtral-8x7b-32768` - Context window lớn
-  `gemma2-9b-it` - Mô hình nhỏ gọn

## Cấu trúc code

### Services

-  **groqService.ts** - Service xử lý API calls với Groq
   -  `initialize(apiKey)` - Khởi tạo với API key
   -  `sendMessage(message)` - Gửi tin nhắn và nhận phản hồi
   -  `streamMessage(message)` - Stream response (chưa sử dụng)
   -  `clearHistory()` - Xóa lịch sử hội thoại
   -  `setSystemMessage(message)` - Cấu hình system prompt

### Components

-  **AssistantChatPopup.tsx** - Component chính
   -  Settings dialog cho API key
   -  Message display
   -  Input handling
   -  Error handling

### Types

-  `GroqChatMessage` - Message format cho Groq API
-  `GroqChatConfig` - Cấu hình cho API calls
-  `AIMessage` - Message format trong UI

## Lưu ý bảo mật

⚠️ **QUAN TRỌNG**: Code hiện tại sử dụng `dangerouslyAllowBrowser: true` để gọi Groq API trực tiếp từ browser. Điều này chỉ phù hợp cho **development**.

### Trong production:

1. **Tạo backend proxy** để gọi Groq API
2. Lưu API key trong **environment variables** trên server
3. Client chỉ gọi tới backend của bạn
4. Backend sẽ forward request tới Groq API

### Ví dụ backend proxy (Node.js/Express):

```javascript
// server.js
const express = require('express');
const Groq = require('groq-sdk');

const app = express();
app.use(express.json());

const groq = new Groq({
   apiKey: process.env.GROQ_API_KEY, // Lưu trong .env
});

app.post('/api/chat', async (req, res) => {
   try {
      const { messages } = req.body;
      const completion = await groq.chat.completions.create({
         messages,
         model: 'llama-3.3-70b-versatile',
      });
      res.json(completion);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

app.listen(3000);
```

## Tùy chỉnh

### Thay đổi system prompt

Mở `groqService.ts` và chỉnh sửa trong hàm `initialize()`:

```typescript
this.conversationHistory = [
   {
      role: 'system',
      content: 'Bạn là trợ lý AI... (chỉnh sửa tại đây)',
   },
];
```

### Thay đổi mô hình mặc định

Trong `groqService.ts`, cập nhật `defaultConfig`:

```typescript
private defaultConfig: GroqChatConfig = {
  model: 'llama-3.1-8b-instant', // Mô hình nhanh hơn
  temperature: 0.7,
  max_tokens: 1024,
};
```

### Thêm streaming response

Uncomment code trong component để sử dụng `streamMessage()` thay vì `sendMessage()` để có hiệu ứng typing real-time.

## Troubleshooting

### "API key không hợp lệ"

-  Kiểm tra lại API key đã copy đúng chưa
-  Đảm bảo API key bắt đầu với `gsk_`
-  Thử tạo API key mới

### "Lỗi khi gọi Groq API"

-  Kiểm tra kết nối internet
-  Kiểm tra rate limit của Groq (free tier có giới hạn)
-  Xem console log để biết chi tiết lỗi

### CORS error

-  Trong development, Groq cho phép browser requests
-  Nếu gặp CORS, hãy implement backend proxy như hướng dẫn trên

## Giới hạn Free Tier

Groq free tier có giới hạn:

-  Request rate limits
-  Token limits per day

Xem chi tiết tại: [console.groq.com/docs/rate-limits](https://console.groq.com/docs/rate-limits)

## Support

Nếu cần hỗ trợ:

-  Groq Documentation: [console.groq.com/docs](https://console.groq.com/docs)
-  Groq Discord: [Groq Community](https://groq.com/discord)
