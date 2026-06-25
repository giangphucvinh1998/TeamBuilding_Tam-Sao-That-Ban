# Brainstorm: Thay đổi luật chơi và thời gian Game 2 (Giai điệu vượt ngàn)

Chúng tôi đã phân tích yêu cầu điều chỉnh luật chơi Game 2 và lập phương án cập nhật toàn diện cả ở Frontend (giao diện hiển thị luật chơi, bộ đếm thời gian, giao diện MC) và Backend (logic chạy đếm ngược thời gian).

---

## 🔍 Chi tiết thay đổi yêu cầu

1. **Thời gian đoán bài hát gốc:** Giảm từ **60 giây** xuống **15 giây**.
2. **Thời gian đoán sau gợi ý:** Thêm cơ chế đếm ngược **10 giây** (trong trạng thái `HINT`).
3. **Cập nhật nội dung hiển thị Luật chơi:** Sửa đổi text giới thiệu luật chơi Game 2 trên màn hình máy chiếu.
4. **Cập nhật giao diện MC (Admin Panel):** Đổi nhãn nút bấm chốt thời gian từ "60s" thành "15s".

---

## 🛠️ Giải pháp kỹ thuật đề xuất

### 1. Backend (`backend/humming_game_state.py`)

* **Thay đổi thời gian đoán gốc:**
  Cập nhật hàm `start_playing` để chạy bộ đếm ngược 15 giây:
  ```python
  self.timer_info = TimerInfo(start_time=time.time(), duration=15, type="playing")
  ...
  self._timer_task = asyncio.create_task(self._play_timer_callback(15))
  ```

* **Thêm cơ chế đếm ngược cho Hint:**
  Trong hàm `confirm_answer` (nhánh trả lời sai và không phải bài hát cuối):
  ```python
  self.state = GameState.HINT
  self.hint_visible = True
  self.timer_info = TimerInfo(start_time=time.time(), duration=10, type="guessing")
  if self._timer_task:
      self._timer_task.cancel()
  self._timer_task = asyncio.create_task(self._hint_timer_callback(10))
  ```
  Thêm callback `_hint_timer_callback` để tắt bộ đếm khi hết 10 giây (nhưng giữ nguyên trạng thái `HINT` để MC bấm nút xử lý):
  ```python
  async def _hint_timer_callback(self, duration: int):
      try:
          await asyncio.sleep(duration)
          self.timer_info = None
          await self.broadcast_state()
      except asyncio.CancelledError:
          pass
  ```

* **Dọn dẹp Task khi MC chốt kết quả sớm:**
  Trong `hint_answer`, `skip_hint`, và `time_up`, đảm bảo luôn hủy `self._timer_task` đang chạy ngầm và đặt `self.timer_info = None`.

### 2. Frontend Máy chiếu (`frontend/src/components/display/HummingDisplay.tsx` & `DisplayPage.tsx`)

* **Hiển thị bộ đếm ở màn hình Gợi ý (`HINT`):**
  Trong [HummingDisplay.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/components/display/HummingDisplay.tsx), thêm component `<Timer>` vào giao diện khi `state === 'HINT'` để người chơi nhìn thấy 10 giây đếm ngược.
* **Cập nhật nội dung hiển thị Luật chơi:**
  Trong [DisplayPage.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/pages/DisplayPage.tsx) dưới `case 'HUMMING'`, cập nhật text luật chơi mới theo đúng yêu cầu:
  * 4 clip quay sẵn thời lượng 30s. Đội thi có 15s trả lời. Đúng +10 điểm.
  * Trả lời sai nhận 1 gợi ý (thêm 10s suy nghĩ). Đúng +5 điểm, sai -5 điểm (hoặc bỏ qua không trừ điểm).
  * Lượt cuối live humming: Đúng +20đ, sai không trừ điểm, được phép bỏ qua, không gợi ý, không cướp điểm.

### 3. Frontend Admin (`frontend/src/components/admin/HummingController.tsx`)
* Cập nhật nút bấm bắt đầu tính giờ từ `⏱ BẮT ĐẦU TÍNH GIỜ (60s)` thành `⏱ BẮT ĐẦU TÍNH GIỜ (15s)`.

---

## 📋 Đánh giá Rủi ro & Lưu ý
* **Autoplay / Đồng bộ:** Cơ chế hoạt động của WebSocket và React State-machine vẫn được duy trì đồng bộ, giảm thiểu tối đa rủi ro lệch thời gian giữa màn hình MC và máy chiếu.
* **Hủy Task:** Phải cực kỳ cẩn thận hủy các Task asyncio để tránh xung đột hoặc tự động chuyển trạng thái ngoài ý muốn của MC.

---

## 🚀 Bước tiếp theo
Tôi đã chuẩn bị phương án thực hiện chi tiết. Bạn có muốn tiến hành triển khai các thay đổi này ngay lập tức không?
