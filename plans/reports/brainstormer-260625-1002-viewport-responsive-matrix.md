# Brainstorm: Giao diện Ma trận chữ co giãn theo viewport (Responsive Viewport Matrix)

Tài liệu này đề xuất phương án tối ưu để ma trận hiển thị trọn vẹn trên 1 màn hình (không sinh thanh cuộn dọc/ngang) và tăng tối đa chiều rộng của mỗi ô chữ để chữ không bị xuống hàng.

---

## 1. Phân tích vấn đề

- **Thanh cuộn (Scrollbar):** Sử dụng các kích thước cố định bằng pixel như `w-28 h-28` (112px) cho 10 hàng và 10 cột, cộng thêm khoảng cách và padding của container, dễ dàng vượt quá chiều cao khả dụng của màn hình (`100vh`), đặc biệt là trên các máy chiếu có độ phân giải dọc thấp (ví dụ: HD 720p hoặc tỷ lệ 4:3).
- **Xuống dòng chữ:** Các ô chữ dạng hình vuông (`w-28 h-28`) giới hạn chiều rộng, khiến các từ ghép hoặc từ tiếng Anh dài bị xuống dòng lỗi font.

---

## 2. Giải pháp: Ô chữ hình chữ nhật co giãn theo Viewport Height (`vh`) & Viewport Width (`vw`)

Thay vì dùng kích thước hình vuông cố định bằng pixel, chúng ta sử dụng tỷ lệ tương đối:

### 1. Chiều cao ô chữ tính bằng `vh` (Viewport Height):
- Đặt chiều cao mỗi ô chữ là **`h-[6vh]`** hoặc **`h-[6.5vh]`**.
- Với 10 hàng, tổng chiều cao ma trận sẽ chiếm khoảng **`60vh` - `65vh`**.
- Khoảng trống còn lại (~`35vh`) hoàn toàn đủ cho Header, đồng hồ đếm ngược và khoảng cách an toàn, **đảm bảo 100% không bao giờ xuất hiện thanh cuộn dọc** trên bất kỳ độ phân giải nào.

### 2. Chiều rộng ô chữ co giãn tự động theo Grid Container:
- Sử dụng **`w-full`** cho mỗi ô chữ và cấu hình Grid Container rộng tối đa **`max-w-[90vw]`** hoặc **`max-w-[95vw]`**.
- Trên màn hình Full HD (1920x1080), mỗi ô chữ sẽ tự động rộng khoảng **140px - 160px** nhưng chỉ cao **70px** (tỷ lệ hình chữ nhật ~ 2:1).
- Hình dạng chữ nhật nằm ngang này cung cấp không gian chiều ngang cực lớn, giúp các từ dài hiển thị trên 1 dòng hoàn hảo.

---

## 3. Các thay đổi cụ thể trên code

### Cập nhật [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx)

1. **Wrapper chính:**
   Nới rộng tối đa chiều ngang và giới hạn chiều cao:
   ```tsx
   <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[92vw] z-10 relative pt-12">
   ```
2. **Container chứa lưới (Grid):**
   ```tsx
   <div className="bg-white/10 p-3 rounded-xl backdrop-blur shadow-[0_0_50px_rgba(147,51,234,0.3)] w-full">
     <div className="grid grid-cols-10 gap-1.5">
   ```
3. **Các ô chữ (Grid Cells):**
   Thay đổi class kích thước thành `w-full h-[6vh]` (hoặc `h-[6.5vh]`):
   ```tsx
   className={`
     w-full h-[6.5vh] flex items-center justify-center text-center p-1
     bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-purple-400/50
     rounded-lg shadow-inner font-bold text-white text-lg
     transition-all duration-300
     ${!isVisible ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}
   `}
   ```

---

## 4. Kế hoạch xác thực (Verification Plan)

1. **Kiểm tra thanh cuộn:** Mở rộng và thu nhỏ chiều cao trình duyệt, xác nhận ma trận co giãn mượt mà theo chiều cao và không xuất hiện thanh cuộn.
2. **Kiểm tra độ dài chữ:** Xác nhận các từ khóa dài như "Vinaphone", "Computer", "Agentic AI" hiển thị đẹp trên 1 dòng đơn.
