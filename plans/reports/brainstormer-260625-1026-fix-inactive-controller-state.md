# Brainstorm: Sửa lỗi giao diện điều khiển rỗng/sai trạng thái khi không khóa chuyển trò

Tài liệu này phân tích và ghi nhận lỗi giao diện trống hoặc hiển thị sai trạng thái khi đang ở tab điều khiển của game khác trong lúc game Mò Kim Bể Chữ (MATRIX) đang chạy, và đề xuất giải pháp xử lý triệt để.

---

## 1. Vấn đề phát sinh
- Khi game Matrix đang chạy ở trạng thái active (ví dụ: `state: 'PHASE_1'`), nếu người dùng chuyển sang tab điều khiển của Giai Điệu Ngân Nga (HUMMING) hoặc Mật Mã Lặng Thinh (TAM_SAO):
  - Do chúng ta đã mở khóa (bypass lock), giao diện điều khiển của hai trò chơi này vẫn hiển thị.
  - Tuy nhiên, biến `gameState` nhận từ WebSocket lúc này đang là trạng thái của game MATRIX (với `state: 'PHASE_1'`, `game_mode: 'MATRIX'`).
  - Giao diện của các controller khác (như `HummingController` và `GameController`) thực hiện destructure biến `state` trực tiếp từ `gameState` và chỉ hiển thị các nút điều khiển tương ứng khi `state` bằng `'WAITING'`, `'READY'`, `'PLAYING'`, v.v.
  - Do `'PHASE_1'` không khớp với bất kỳ trạng thái nào của chúng, các nút bấm bị ẩn hoàn toàn (giao diện trống), và tiêu đề phụ hiển thị sai trạng thái là `PHASE_1` (như trong hình 2 của người dùng).

---

## 2. Giải pháp kỹ thuật (Bao gồm trong code)
Để khắc phục lỗi này, khi một trò chơi chưa thực sự được kích hoạt trên hệ thống (tức là `gameState.game_mode` hiện tại không phải là game đó), chúng ta sẽ giả lập trạng thái cục bộ của trò chơi đó là `'WAITING'` và các trường thông tin vòng chơi là `null`/`0`.

Cụ thể:

### A. Trong `HummingController.tsx`
Thay thế destructure trực tiếp bằng logic gán điều kiện:
```tsx
const isCurrentGameActive = gameState.game_mode === 'HUMMING';
const state = isCurrentGameActive ? gameState.state : 'WAITING';
const current_team = isCurrentGameActive ? gameState.current_team : null;
const current_song = isCurrentGameActive ? gameState.current_song : null;
const is_media_playing = isCurrentGameActive ? gameState.is_media_playing : false;
const is_final_live = isCurrentGameActive ? gameState.is_final_live : false;
const { teams } = gameState;
```

### B. Trong `GameController.tsx`
Khai báo biến `state` ở đầu hàm (trước các hook `useEffect` để các hook này hoạt động đúng):
```tsx
const isCurrentGameActive = gameState?.game_mode === 'TAM_SAO';
const state = isCurrentGameActive ? gameState?.state : 'WAITING';
```
Đồng thời, cập nhật các biến destructure ở thân component:
```tsx
const current_team = isCurrentGameActive ? gameState.current_team : null;
const current_keyword = isCurrentGameActive ? gameState.current_keyword : null;
const current_answer = isCurrentGameActive ? gameState.current_answer : null;
const current_hint = isCurrentGameActive ? gameState.current_hint : null;
const round_number = isCurrentGameActive ? gameState.round_number : 0;
const { teams } = gameState;
```

---

## 3. Kết quả xác thực (Verification)
1. Khi game Matrix đang chạy ở trạng thái `PHASE_1`, giao diện tab Giai Điệu Ngân Nga hiển thị chính xác trạng thái `WAITING`, hiển thị đầy đủ danh sách đội, danh sách bài hát và nút **BẮT ĐẦU LƯỢT MỚI** (như hình 1).
2. Tương tự, giao diện tab Mật Mã Lặng Thinh hiển thị chính xác trạng thái `WAITING`, danh sách đội và từ khóa.
3. Không xảy ra bất kỳ lỗi TypeScript hay lỗi biên dịch nào (`npm run build` hoàn thành trong 179ms).
