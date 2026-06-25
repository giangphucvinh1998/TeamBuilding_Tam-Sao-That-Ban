# Brainstorm: Không khóa chuyển trò chơi khi đang chạy Game Matrix (Mò Kim Bể Chữ)

Tài liệu này phân tích phương án cho phép MC/BTC chuyển sang và tương tác với các trò chơi khác kể cả khi game Mò Kim Bể Chữ (MATRIX) đang chạy ở trạng thái active (không ở trạng thái `WAITING`).

---

## 1. Yêu cầu thiết kế mới
- Hiện tại, nếu có bất kỳ trò chơi nào đang chạy (trạng thái `state != 'WAITING'`), hệ thống sẽ hiển thị một thông báo cảnh báo và khóa giao diện điều khiển của tất cả các trò chơi khác.
- Yêu cầu mới: Đối với game đầu tiên là **Mò kim bể chữ (MATRIX)**, hệ thống **không khóa chuyển trò**. Lý do là vì điểm số của game này có thể được chấm và tổng hợp thủ công sau, BTC cần linh hoạt chuyển tiếp sang game tiếp theo (Giai điệu ngân nga / Mật mã lặng thinh) mà không bắt buộc phải bấm kết thúc hoàn toàn vòng Matrix trước.

---

## 2. Giải pháp kỹ thuật

### Phía Frontend:
Chúng ta cần bỏ điều kiện khóa giao diện ở các Game Controller khác khi game hiện tại đang chạy là game `MATRIX`.
Cụ thể, trong logic cảnh báo:
- Thay vì chặn nếu `gameState.state !== 'WAITING'`, ta sẽ thêm điều kiện loại trừ: nếu game đang chạy là `MATRIX`, ta sẽ không hiển thị bảng cảnh báo đó ở các Controller khác.

1. **Trong `GameController.tsx` (Mật Mã Lặng Thinh):**
   ```tsx
   // Cũ:
   if (gameState.game_mode !== 'TAM_SAO' && gameState.state !== 'WAITING')
   
   // Mới:
   if (gameState.game_mode !== 'TAM_SAO' && gameState.state !== 'WAITING' && gameState.game_mode !== 'MATRIX')
   ```
2. **Trong `HummingController.tsx` (Giai Điệu Ngân Nga):**
   ```tsx
   // Cũ:
   if (gameState.game_mode !== 'HUMMING' && gameState.state !== 'WAITING')
   
   // Mới:
   if (gameState.game_mode !== 'HUMMING' && gameState.state !== 'WAITING' && gameState.game_mode !== 'MATRIX')
   ```

### Phía Backend (Độ ưu tiên truyền trạng thái qua WebSocket):
Trong `backend/main.py`, luồng gửi trạng thái (state update) qua WebSocket cho Admin và Display được định nghĩa theo thứ tự ưu tiên:
```python
if game.state != "WAITING":         # Mật mã lặng thinh (TAM_SAO)
    state_data = await game.get_full_state()
elif humming_game.state != "WAITING": # Giai điệu ngân nga (HUMMING)
    state_data = await humming_game.get_full_state()
elif matrix_game.state != "WAITING":  # Mò kim bể chữ (MATRIX)
    state_data = await matrix_game.get_full_state()
```
- Khi game `MATRIX` đang chạy, nếu Admin chuyển sang tab Giai điệu ngân nga và nhấn **Bắt đầu**, trạng thái `humming_game.state` sẽ chuyển từ `WAITING` thành `READY`/`PLAYING`.
- Vì `humming_game.state != "WAITING"` có độ ưu tiên cao hơn `matrix_game`, WebSocket sẽ tự động chuyển sang phát trạng thái của game Giai điệu ngân nga. Màn hình Display Page sẽ chuyển hướng mượt mà sang giao diện Giai điệu ngân nga mà không bị gián đoạn.
- Cơ chế này hoàn toàn tự động và đồng bộ xuất sắc nhờ thứ tự ưu tiên đã được thiết lập sẵn ở Backend.

---

## 3. Đánh giá rủi ro và giải pháp
- **Rủi ro:** Khi chuyển từ Matrix sang game khác mà chưa kết thúc Matrix, dữ liệu game Matrix vẫn nằm trong bộ nhớ tạm (in-memory) của backend.
- **Khắc phục:** Điều này hoàn toàn bình thường vì backend lưu trạng thái in-memory độc lập cho 3 thực thể game (`game`, `humming_game`, `matrix_game`). Khi chấm điểm sau đó, Admin có thể quay lại tab Matrix để chấm điểm hoặc kết thúc game mà không gây ảnh hưởng lẫn nhau.

---

## 4. Kế hoạch xác thực (Verification Plan)
1. **Kiểm tra giao diện Admin:**
   - Kích hoạt game Matrix (bắt đầu Phase 1).
   - Chuyển sang tab Giai Điệu Ngân Nga và Mật Mã Lặng Thinh. Đảm bảo giao diện điều khiển của 2 game này không bị khóa bằng màn hình đỏ cảnh báo.
2. **Kiểm tra đồng bộ màn hình chiếu (Display Page):**
   - Khi Matrix đang chạy, trên Admin tab Giai Điệu Ngân Nga, bấm **Bắt đầu**.
   - Quan sát màn hình Display Page tự động chuyển sang giao diện của Giai Điệu Ngân Nga.
