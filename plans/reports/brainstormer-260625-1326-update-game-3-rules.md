# Brainstorm: Cập nhật luật chơi Game 3 - Mật mã lặng thinh

Tài liệu này phân tích yêu cầu cập nhật luật chơi của Trò chơi 3 (Mật mã lặng thinh - `TAM_SAO`) và các thay đổi cần thiết trong mã nguồn (Backend & Frontend) để hiện thực hóa quy trình mới này.

## Yêu cầu mới từ người dùng

1. **Đội hình:** Cử 4 thành viên lên sân khấu. MC gợi ý trước (số từ, chủ đề).
2. **Thảo luận:** 3 thành viên nhận mật mã, trao đổi nhỏ **30 giây**.
3. **Diễn tả:** Có **1 phút** để 3 thành viên diễn tả cho thành viên thứ 4 (người đoán).
4. **Trả lời:** Người đoán có **10 giây** để đưa ra đáp án.
5. **Xoay vòng:** Người đoán xoay vòng qua 4 câu hỏi tương ứng 4 thành viên.
6. **Cách tính điểm:**
   - Trả lời đúng (đội chơi chính): **+10 điểm** (Không đổi).
   - Nếu trả lời sai: Các đội khác có quyền cướp điểm.
     - Cướp đúng: **+10 điểm** (Luật cũ là +5).
     - Cướp sai: **-5 điểm** (Luật cũ là không bị trừ điểm).
   - Bỏ qua giai đoạn gợi ý đồng đội (HINT) có tính điểm giảm trước đây của đội chơi chính.

---

## Phân Tích & Đề Xuất Phương Án

### 1. Luồng Trạng Thái (State Machine Flow)

**Hiện tại:**
- `WAITING` -> `READY` -> `PREPARING` (15s) -> `PLAYING` (member * 10s) -> `ANSWER_CONFIRM` -> `HINT` (nếu sai, +5đ nếu đúng sau gợi ý) -> `STEAL` (nếu sai, +5đ nếu cướp đúng, 0đ nếu cướp sai) -> `FINISHED`.

**Đề xuất mới:**
- Bỏ qua trạng thái `HINT` đối với đội chơi chính.
- Khi đội chính trả lời **SAI** ở màn hình xác nhận đáp án (`ANSWER_CONFIRM`), hệ thống chuyển trực tiếp sang trạng thái `STEAL` (Cướp điểm).
- **Hình ảnh/chữ gợi ý** sẽ tự động được hiển thị công khai ở trạng thái `STEAL` để hỗ trợ các đội cướp điểm suy luận.

### 2. Cập Nhật Thời Gian (Timers)
- **Chuẩn bị (`PREPARING`):** Tăng từ **15 giây** lên **30 giây** để khớp với thời gian thảo luận nhỏ của 3 thành viên nhận mật mã.
- **Thi đấu (`PLAYING`):** Chuyển từ công thức động `member_count * 10` thành **60 giây** (1 phút) cố định để diễn tả.
- **Trả lời (`ANSWER_CONFIRM`):** Bổ sung bộ đếm ngược **10 giây** trên màn hình Trình chiếu (Display Page) để đếm ngược thời gian người đoán đưa ra đáp án sau khi hết giờ diễn tả.

### 3. Cập Nhật Cách Tính Điểm (Scoring)
- Điểm cướp đúng: Tăng từ **+5** lên **+10 điểm**.
- Điểm cướp sai: Giảm từ **0** xuống **-5 điểm** (trừ điểm đội cướp sai).

---

## Chi Tiết Các File Cần Thay Đổi

### Backend (`backend/game_state.py`)
- **`start_preparing`:** Thay đổi `duration` từ `15` thành `30`.
- **`start_playing`:** Thay đổi `duration` cố định thành `60` thay vì dựa trên số lượng thành viên.
- **`time_up`:** Khởi tạo `self.timer_info` với thời lượng `10` giây, kiểu `"guessing"` để đếm ngược thời gian trả lời của người đoán.
- **`confirm_answer`:**
  - Nếu `correct = True`: Cộng 10 điểm, reset `timer_info = None`.
  - Nếu `correct = False`: Chuyển thẳng sang `GameState.STEAL`, kích hoạt `steal_active = True`, `hint_visible = True` (hiển thị gợi ý cho đội cướp), và reset `timer_info = None`.
- **`steal_answer`:**
  - Nếu cướp đúng: Cộng 10 điểm (thay vì 5) cho đội cướp.
  - Nếu cướp sai: Trừ 5 điểm (thay vì 0) cho đội cướp. Phát hiệu ứng `wrong_deduct` qua WebSocket để trừ điểm sinh động.

### Frontend (`frontend/src/pages/DisplayPage.tsx`)
- Cập nhật text luật chơi của game `TAM_SAO` trong component `RulesOverlay` hiển thị đúng 5 điều luật mới.
- Trong khối render trạng thái `ANSWER_CONFIRM`, render thêm component `<Timer timerInfo={timer} />` để đếm ngược 10 giây trả lời.
- Thêm giao diện hiển thị hiệu ứng trừ điểm khi nhận sự kiện `wrong_deduct` (hiển thị `-5 Điểm` màu đỏ nổi bật).

### Frontend (`frontend/src/components/display/Timer.tsx`)
- Thêm nhãn `"Thời Gian Trả Lời"` khi nhận `timerInfo.type === 'guessing'`.

### Frontend (`frontend/src/components/display/GameEffects.tsx`)
- Cho phép hiệu ứng `wrong_deduct` kích hoạt rung màn hình và âm thanh báo sai giống như `wrong`.

### Frontend (`frontend/src/components/admin/GameController.tsx`)
- Đổi nhãn nút bấm xác nhận từ `SAI (Mở Gợi Ý)` thành `SAI (Cho đội khác cướp)`.
- Cập nhật nút bấm cướp điểm:
  - Nút ĐÚNG: hiển thị `ĐÚNG (+10)`
  - Nút SAI: hiển thị `SAI (-5)`

---

## Đánh Giá Rủi Ro & Giải Pháp
- *Rủi ro:* Giá trị điểm âm khi cướp sai có thể khiến điểm số của một đội giảm xuống dưới 0.
- *Giải pháp:* Hệ thống SQLite và Backend cho phép điểm âm bình thường, không gây lỗi hệ thống. Điều này hoàn toàn phù hợp với luật chơi Gala.

---

## Các Bước Tiếp Theo
1. Xác nhận phương án với người dùng.
2. Cập nhật mã nguồn Backend & Frontend theo phương án trên.
3. Chạy thử nghiệm và xác minh thời gian đếm ngược, luồng trạng thái cướp điểm và tính điểm trừ.
