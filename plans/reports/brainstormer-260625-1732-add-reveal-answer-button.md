# Brainstorm: Nút "Không ai đoán đúng" (Hiện đáp án) cho Game 2 & Game 3

## 🔍 Vấn đề hiện tại
* Trong **Game 2 (Giai điệu vượt ngàn)** và **Game 3 (Mật mã lặng thinh)**, nếu người chơi chính trả lời sai, game sẽ chuyển sang trạng thái gợi ý/cướp điểm.
* Nếu tất cả các đội đều trả lời sai hoặc không có đội nào muốn cướp điểm, MC không có cách nào để chuyển trạng thái sang `FINISHED` (để hiển thị đáp án bài hát/từ khóa lên màn hình chiếu) mà không cộng/trừ điểm của một đội nào đó.
* MC chỉ có thể dùng nút "Hủy lượt (Reset)" để quay về `WAITING`, nhưng nút này bỏ qua trạng thái `FINISHED` khiến màn hình trình chiếu không hiện đáp án cho khán giả biết.

---

## 🛠️ Các giải pháp thiết kế

### Phương án 1: Thêm nút "Bỏ qua / Không ai đoán đúng" (Chọn phương án này)
* **Ý tưởng:** Thêm một nút bấm chuyên dụng trên Admin Panel (cho cả Game 2 và Game 3) ở các trạng thái `ANSWER_CONFIRM`, `HINT`, `STEAL`.
* **Cơ chế:** Khi click, gửi request lên một API endpoint mới `/reveal-answer` (hoặc `/game/reveal-answer` và `/humming/reveal-answer`).
* **Backend:**
  * Chuyển trạng thái lượt chơi hiện tại thành `FINISHED` trong database.
  * Thiết lập `score_awarded = 0`, `score_to_team = NULL` (không đội nào được điểm).
  * Phát âm thanh hiệu ứng "wrong" (hoặc hiệu ứng kết thúc lượt) qua WebSocket.
  * Cập nhật trạng thái in-memory sang `FINISHED`.
* **Frontend Display:** Do trạng thái chuyển thành `FINISHED`, giao diện màn hình chiếu sẽ tự động nhận diện và hiển thị Mật mã đáp án / Tên bài hát cho khán giả xem (đã được cấu hình ở các task trước).
* **Admin Panel:** Hiển thị màn hình kết thúc lượt với nút "TIẾP TỤC" để MC bấm chuyển sang câu hỏi tiếp theo.

### Phương án 2: Tự động chuyển FINISHED khi kết thúc cướp điểm
* **Ý tưởng:** Khi tất cả các đội đã cướp điểm sai thì tự động kết thúc.
* **Hạn chế:** MC không thể chủ động điều phối nếu có đội không muốn cướp điểm (hệ thống không tự nhận diện được việc không ai giơ tay cướp điểm). Do đó phương án này thiếu linh hoạt và không khả thi thực tế.

---

## 💻 Thiết kế chi tiết API & Luồng xử lý

### 1. Game 3 (Mật mã lặng thinh)
* **Endpoint mới:** `POST /api/game/reveal-answer`
* **Backend `game_state.py`:**
  ```python
  async def reveal_answer(self):
      if self.state not in (GameState.ANSWER_CONFIRM, GameState.HINT, GameState.STEAL):
          raise ValueError("Trạng thái không hợp lệ để hiện đáp án")
      
      db = await get_db()
      try:
          await db.execute(
              "UPDATE rounds SET state = 'FINISHED', score_awarded = 0, score_to_team = NULL, finished_at = CURRENT_TIMESTAMP WHERE id = ?",
              (self.current_round_id,)
          )
          await db.commit()
          
          self.state = GameState.FINISHED
          self.steal_active = False
          self.timer_info = None
          await self.broadcast_state()
          await manager.broadcast_effect("wrong")
      finally:
          await db.close()
  ```

### 2. Game 2 (Giai điệu vượt ngàn)
* **Endpoint mới:** `POST /api/humming/reveal-answer`
* **Backend `humming_game_state.py`:**
  ```python
  async def reveal_answer(self):
      if self.state not in (GameState.ANSWER_CONFIRM, GameState.HINT, GameState.STEAL):
          raise ValueError("Trạng thái không hợp lệ để hiện đáp án")
      
      db = await get_db()
      try:
          await db.execute(
              "UPDATE humming_rounds SET state = 'FINISHED', score_awarded = 0, score_to_team = NULL, finished_at = CURRENT_TIMESTAMP WHERE id = ?",
              (self.current_round_id,)
          )
          await db.commit()
          
          self.state = GameState.FINISHED
          self.steal_active = False
          self.is_media_playing = False
          self.timer_info = None
          await self.broadcast_state()
          await manager.broadcast_effect("wrong")
      finally:
          await db.close()
  ```

### 3. Giao diện Admin Panel (Frontend)
* **`GameController.tsx` (Game 3):**
  * Thêm nút "Không ai đoán đúng (Hiện đáp án)" trong các panel trạng thái `ANSWER_CONFIRM` và `STEAL`.
* **`HummingController.tsx` (Game 2):**
  * Thêm nút "Không ai đoán đúng (Hiện đáp án)" trong các panel trạng thái `ANSWER_CONFIRM`, `HINT`, và `STEAL`.

---

## 📈 Kế hoạch kiểm thử & Xác nhận
1. Chạy thử lượt chơi Game 2 và Game 3.
2. Trả lời sai/Hết giờ -> Chuyển sang cướp điểm/gợi ý.
3. Nhấp nút "Không ai đoán đúng" trên Admin.
4. Xác nhận:
   * Màn hình Display chuyển sang `FINISHED` và hiện đáp án chính xác.
   * Không có đội nào bị trừ điểm hoặc cộng điểm sai lệch.
   * Admin hiển thị trạng thái kết thúc lượt với nút "TIẾP TỤC".
