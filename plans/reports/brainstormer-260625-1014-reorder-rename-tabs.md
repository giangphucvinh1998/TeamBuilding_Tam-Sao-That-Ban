# Brainstorm: Tái cấu trúc thứ tự Tab và Đổi tên Game "Tam Sao Thất Bản"

Tài liệu này ghi nhận và phân tích các yêu cầu thay đổi thứ tự và đổi tên các tab trò chơi trên giao diện Admin Page và Display Page.

---

## 1. Yêu cầu thiết kế mới
Người dùng mong muốn thay đổi thứ tự hiển thị các tab trò chơi và đổi tên game đầu tiên:
- **Thứ tự mới:**
  1. **Mò kim bể chữ** (trước đây ở vị trí thứ 3)
  2. **Giai điệu ngân nga** (giữ nguyên vị trí thứ 2)
  3. **Mật mã lặng thinh** (đổi tên từ "Tam sao thất bản", trước đây ở vị trí thứ 1)

---

## 2. Các phương án thực hiện và phân tích chi tiết

### Phương án A: Chỉ thay đổi giao diện hiển thị (UI Labels) và giữ nguyên định danh logic (KISS - Khuyên dùng)
* **Mô tả:** Giữ nguyên các định danh logic ở cả Frontend và Backend (ví dụ: `TAM_SAO`, `/game/tam-sao-endpoint`, các trường DB, v.v.). Chỉ cập nhật tiêu đề, nhãn (labels), nút bấm (buttons) hiển thị trên UI.
* **Chi tiết thay đổi:**
  - **AdminPage (Tabs chọn game):**
    ```tsx
    // Thứ tự hiển thị mới trong AdminPage.tsx:
    1. MÒ KIM BỂ CHỮ (setControlMode('MATRIX'))
    2. GIAI ĐIỆU NGÂN NGA (setControlMode('HUMMING'))
    3. MẬT MÃ LẶNG THINH (setControlMode('TAM_SAO'))
    ```
    - Thay đổi tab quản lý từ khóa: `Từ Khóa (TSTB)` chuyển thành `Từ Khóa (MMLT)`.
  - **DisplayPage (Tiêu đề chờ & Tiêu đề game):**
    - Màn hình chờ mặc định (khi chưa khởi chạy game nào hoặc khi reset): Hiển thị `"MẬT MÃ LẶNG THINH"` thay vì `"TAM SAO THẤT BẢN"`.
    - Khi game chạy: Tên game mode hiển thị `"Mật Mã Lặng Thinh"` khi `game_mode === 'TAM_SAO'`.
  - **GameController (Trang điều khiển Admin):**
    - Đổi thông báo cảnh báo từ `"Tam Sao Thất Bản"` thành `"Mật Mã Lặng Thinh"`.
* **Ưu điểm:**
  - Cực kỳ an toàn, không có rủi ro phá vỡ giao tiếp WebSocket, API endpoints, hoặc cấu trúc database.
  - Tốn rất ít công sức phát triển và kiểm thử.
  - Tuân thủ triệt để nguyên lý **KISS** và **YAGNI**.
* **Nhược điểm:**
  - Mã nguồn nội bộ (code logic, API endpoints, variables) vẫn dùng từ khóa cũ `TAM_SAO`, cần bổ sung comment ghi chú để lập trình viên sau này không bị nhầm lẫn.

---

### Phương án B: Thay đổi toàn bộ định danh logic từ `TAM_SAO` sang `SILENT_CODE` hoặc `MUTE_CIPHER`
* **Mô tả:** Đổi tên tất cả các biến, enums, API endpoints, Websocket message types, các file Controller từ `TAM_SAO`/`tam-sao` thành `SILENT_CODE`/`silent-code`.
* **Chi tiết thay đổi:**
  - Đổi tên file `GameController.tsx` thành `SilentCodeController.tsx`.
  - Thay đổi route FastAPI từ `/api/game/` sang `/api/silent-code/`.
  - Cập nhật định dạng dữ liệu state machine trong SQLite DB và WebSocket payload.
* **Ưu điểm:**
  - Mã nguồn sạch sẽ, nhất quán hoàn toàn từ Frontend, Backend tới Database.
* **Nhược điểm:**
  - Rủi ro rất cao gây lỗi kết nối WebSocket, lỗi API hoặc lỗi schema database nếu có chỗ bị sót.
  - Tốn nhiều tài nguyên phát triển và kiểm thử không cần thiết (vi phạm **YAGNI**).

---

## 3. Lựa chọn khuyến nghị và Rationale
Chúng tôi đề xuất triển khai theo **Phương án A**:
- **Lý do:** Đây là một thay đổi thuần túy về mặt trải nghiệm người dùng (branding & UX). Việc thay đổi định danh logic bên dưới không mang lại giá trị thực tế cho người chơi mà lại tăng rủi ro lỗi hệ thống trong quá trình vận hành trực tiếp.
- Chúng ta sẽ bổ sung các bình luận (comments) rõ ràng trong mã nguồn để giải thích sự tương quan giữa `TAM_SAO` (logic) và `Mật mã lặng thinh` (hiển thị UI).

---

## 4. Kế hoạch xác thực (Verification Plan)
1. **Kiểm tra thứ tự trên Admin Page:**
   - Đảm bảo tab "MÒ KIM BỂ CHỮ" ở vị trí đầu tiên, tiếp theo là "GIAI ĐIỆU NGÂN NGA", và cuối cùng là "MẬT MÃ LẶNG THINH".
   - Đảm bảo tab quản lý từ khóa hiển thị tên mới: "Từ Khóa (MMLT)".
2. **Kiểm tra màn hình hiển thị (Display Page):**
   - Khi ở trạng thái chờ (`WAITING`), màn hình chính hiển thị tiêu đề lớn `"MẬT MÃ LẶNG THINH"`.
   - Khi MC chọn trò chơi, tiêu đề góc trái màn hình Display Page hiển thị chính xác tên trò chơi tương ứng.
3. **Kiểm tra tính năng:**
   - Chạy thử vòng chơi "Mật mã lặng thinh" (chọn đội, bốc từ khóa, đếm ngược thời gian) để chắc chắn kết nối WebSocket và API giữa Admin và Display vẫn hoạt động trơn tru.
