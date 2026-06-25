# Brainstorm: Điều chỉnh luật chơi và thời gian Game 3 (Mật mã lặng thinh)

Chúng tôi đã phân tích các thay đổi về luật chơi Game 3 theo yêu cầu và thiết lập phương án cập nhật toàn diện.

---

## 🔍 Chi tiết thay đổi yêu cầu

1. **Thời gian diễn tả mật mã (Pha PLAYING):** Giảm từ **60 giây** xuống **30 giây**.
2. **Thời gian thảo luận nhỏ (Pha PREPARING):** Giữ nguyên **30 giây** nhưng đồng bộ lại toàn bộ nhãn hiển thị chữ (trên giao diện MC đang ghi nhầm là 15 giây).
3. **Cập nhật nội dung hiển thị Luật chơi:** Sửa đổi text giới thiệu luật chơi Game 3 trên màn hình máy chiếu từ 1 phút thành 30 giây diễn tả.
4. **Cập nhật giao diện MC (Admin Panel):** Thay đổi các dòng chữ hướng dẫn của MC liên quan đến pha chuẩn bị (thảo luận nhỏ) từ 15s thành 30s.

---

## 🛠️ Giải pháp kỹ thuật đề xuất

### 1. Backend (`backend/game_state.py`)

* **Thay đổi thời gian thi đấu Game 3:**
  Trong hàm `start_playing(self)`:
  Thay đổi thời gian thi đấu từ 60 giây xuống 30 giây:
  ```python
  duration = 30
  ```

### 2. Frontend Admin (`frontend/src/components/admin/GameController.tsx`)

* **Cập nhật mô tả nút bấm và thông tin trạng thái chuẩn bị:**
  * Đổi `Bắt đầu 15s Chuẩn Bị` thành `Bắt đầu 30s Thảo Luận Nhỏ`.
  * Đổi `Đang chạy 15s chuẩn bị...` thành `Đang chạy 30s thảo luận nhỏ...`.

### 3. Frontend Máy chiếu (`frontend/src/pages/DisplayPage.tsx`)

* **Cập nhật mô tả luật chơi:**
  Trong `getRulesContent` dưới `case 'TAM_SAO'`, đổi:
  * `DIỄN TẢ ĐỒNG ĐỘI (1 PHÚT)` thành `DIỄN TẢ ĐỒNG ĐỘI (30S)`.
  * Nội dung: "Có 30 giây để 3 thành viên diễn tả bằng cử chỉ/body language..."

---

## 📋 Đánh giá Rủi ro & Lưu ý
* **Không làm thay đổi cấu trúc dữ liệu:** Các trạng thái hoạt động của cơ sở dữ liệu và WebSocket không đổi, chỉ điều chỉnh cấu hình thời gian chạy đếm ngược, do đó hoàn toàn an toàn và không gây lỗi đồng bộ.

---

## 🚀 Bước tiếp theo
Tôi đã chuẩn bị kế hoạch triển khai chi tiết. Bạn có muốn tiến hành áp dụng ngay lập tức không?
