# Brainstorm: Điều chỉnh thời gian các Phase & Thu nhỏ tỷ lệ phóng ma trận

Tài liệu này ghi nhận và phân tích các yêu cầu tinh chỉnh thời gian của 3 Phase game Mò Kim Bể Chữ và tỷ lệ zoom ở Phase 3.

---

## 1. Điều chỉnh thời lượng các Phase

### Yêu cầu:
- **Phase 1 (Bắt đầu điền ma trận):** Giảm xuống **10 giây** (trước đây là 30 giây).
- **Phase 2 (Ẩn/Hiện ngẫu nhiên):** Tăng lên **40 giây** (trước đây là 30 giây).
- **Phase 3 (Phóng to/Thu nhỏ):** Tăng lên **40 giây** (trước đây là 30 giây).
- **Tổng thời gian:** `10 + 40 + 40 = 90 giây` (không đổi).

### Cách xử lý:

#### Phía Backend (`backend/matrix_game_state.py`):
Thay đổi tham số `duration` trong các hàm kích hoạt Phase:
- `start_phase_1`: `duration = 10`
- `start_phase_2`: `duration = 40`
- `start_phase_3`: `duration = 40`

#### Phía Frontend (`MatrixDisplay.tsx`):
1. **Tốc độ điền ma trận:**
   Vì Phase 1 chỉ còn 10 giây để điền đủ 50 lượt (mỗi lượt 2 ô = 100 ô), ta cần tăng tốc độ interval điền chữ:
   `Interval mới = 10000ms / 50 = 200ms` (trước đây là `600ms`).
2. **Logic tính tổng thời gian đếm ngược (90s):**
   Cập nhật công thức tính thời gian còn lại:
   - Trong `PHASE_1`: `rem + 80` (vì còn 40s Phase 2 + 40s Phase 3).
   - Trong `PHASE_2`: `rem + 40` (vì còn 40s Phase 3).
   - Trong `PHASE_3`: `rem` (Phase cuối).

---

## 2. Giới hạn tỷ lệ zoom ở Phase 3 để tránh đè chữ

### Yêu cầu:
Xử lý hiệu ứng zoom trong Phase 3 ở mức vừa phải để không xảy ra hiện tượng chồng lấn hoặc che khuất từ khóa giữa các ô kề cận.

### Giải pháp:
Hiện tại, công thức tính scale ngẫu nhiên là:
`scale: 0.3 + Math.random() * 1.3` (cho phép scale từ `0.3` đến `1.6`).
- Mức `0.3` quá nhỏ gây mờ mắt.
- Mức `1.6` quá to khiến ô chữ tràn viền và đè lên các ô xung quanh.

**Đề xuất điều chỉnh:**
Giới hạn scale trong khoảng **`0.8` đến `1.2`**:
`scale: 0.8 + Math.random() * 0.4`
Với dải scale này:
- Ô chữ co giãn nhẹ nhàng, giữ được sự năng động của hiệu ứng.
- Đảm bảo khoảng cách an toàn giữa các ô, không bao giờ bị đè chữ hay tràn viền.

---

## 3. Kế hoạch xác thực (Verification Plan)

1. **Biên dịch & Khởi chạy:** Chạy build frontend và kiểm tra backend không có lỗi cú pháp.
2. **Kiểm tra tốc độ Phase 1:** Bắt đầu game Matrix, kiểm tra xem ma trận được điền đầy đủ và nhanh chóng trong vòng đúng 10 giây.
3. **Kiểm tra bộ đếm thời gian:** Đảm bảo bộ đếm hiển thị `90s` ban đầu, và đếm ngược liên tục qua 10s (Phase 1) -> 40s (Phase 2) -> 40s (Phase 3).
4. **Kiểm tra hiệu ứng Zoom:** Trong Phase 3, quan sát hiệu ứng phóng to/thu nhỏ xem các ô chữ có bị đè lên nhau không, các từ khóa có rõ ràng không.
