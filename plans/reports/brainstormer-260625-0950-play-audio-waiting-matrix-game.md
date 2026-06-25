# Brainstorm: Tự động phát nhạc chờ cho game Mò Kim Bể Chữ

Tài liệu này phân tích các phương án kỹ thuật để tự động phát file âm thanh `game1.mp3` khi màn hình trình chiếu (Display) ở chế độ chờ (WAITING) của trò chơi "Mò Kim Bể Chữ" (MATRIX).

---

## 1. Yêu cầu & Bối cảnh

- **Mục tiêu:** Khi MC/BTC chuyển sang phần điều khiển game "Mò Kim Bể Chữ" (MATRIX) trên Admin Page và game chưa bắt đầu (ở trạng thái `WAITING`), màn hình chiếu (Display Page) sẽ tự động phát nhạc nền `game1.mp3` để tạo không khí.
- **Hiện trạng:**
  - Game hiện tại hỗ trợ 3 chế độ: `TAM_SAO`, `HUMMING`, `MATRIX`.
  - Trạng thái `WAITING` đang được dùng chung: Khi tất cả game ở trạng thái `WAITING`, backend mặc định trả về trạng thái của game `TAM_SAO` (với `game_mode: "TAM_SAO"` và `state: "WAITING"`). Do đó, Display Page chỉ hiển thị tiêu đề "TAM SAO THẤT BẢN" và không phân biệt được admin đang mở tab điều khiển của game nào.
  - Trình duyệt chặn autoplay âm thanh/video nếu chưa có tương tác từ người dùng (User Interaction). Display Page hiện có cơ chế `handleInteract` (click để kích hoạt video Intro) có thể tận dụng để bypass chính sách này.

---

## 2. Các phương án thiết kế kỹ thuật

### Phương án A: Đồng bộ hóa chế độ game hiện tại (Active Game Mode) từ Backend (Khuyên dùng)

Lưu trữ một biến trạng thái `active_game_mode` trên server (hoặc session) để ghi nhận chế độ game mà Admin đang chọn.

- **Cơ chế hoạt động:**
  1. Thêm thuộc tính `active_game_mode` vào `GameStateMachine` trong [game_state.py](file:///Users/vinhcuong/Dev/gala-game/backend/game_state.py) (hoặc một singleton session).
  2. Tạo API endpoint mới `POST /api/game/mode` để Admin thông báo khi chuyển đổi tab chế độ chơi.
  3. Cập nhật logic trong API WebSocket của backend ([main.py](file:///Users/vinhcuong/Dev/gala-game/backend/main.py)): Khi tất cả các game đều ở trạng thái `WAITING`, server sẽ dựa vào `active_game_mode` để lấy trạng thái tương ứng (`matrix_game.get_full_state()`, `humming_game.get_full_state()`, hoặc `game.get_full_state()`).
  4. Phía Frontend, cập nhật [AdminPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/AdminPage.tsx) để gửi request lên endpoint trên khi Admin chuyển đổi tab.
  5. Cập nhật [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) để:
     - Hiển thị tiêu đề động dựa trên `gameState.game_mode` ở màn hình chờ (`state === 'WAITING'`).
     - Tự động phát `game1.mp3` nếu `game_mode === 'MATRIX'`.
- **Ưu điểm:**
  - Đồng bộ hóa hoàn hảo giữa màn hình Admin và Display ngay cả khi game đang ở trạng thái chờ (`WAITING`).
  - Tiêu đề màn hình chờ của Display Page tự động thay đổi tương ứng ("MÒ KIM BỂ CHỮ" / "GIAI ĐIỆU NGÂN NGA" / "TAM SAO THẤT BẢN").
  - Quản lý tập trung trên server, tránh việc hiển thị lệch pha giữa các Admin khác nhau.
- **Nhược điểm:**
  - Cần chỉnh sửa cả Backend và Frontend.

---

### Phương án B: Đồng bộ hóa trực tiếp qua Client-to-Client WebSocket Message

Cho phép Admin gửi một message trực tiếp qua WebSocket đến tất cả các clients khác để báo hiệu đang xem chế độ nào.

- **Cơ chế hoạt động:**
  1. Khi Admin chọn tab MATRIX, Admin gửi một tin nhắn dạng `{"type": "change_mode", "mode": "MATRIX"}` qua WebSocket.
  2. Server nhận tin nhắn này và broadcast lại cho tất cả clients.
  3. Display Page nhận tin nhắn, cập nhật state cục bộ để biết chế độ hiện tại là `MATRIX` và thực hiện phát nhạc.
- **Ưu điểm:**
  - Không cần sửa đổi cơ sở dữ liệu hay tạo thêm endpoint HTTP REST mới.
- **Nhược điểm:**
  - Trạng thái chế độ game là tạm thời (ephemeral). Nếu Display Page tải lại trang (F5) khi đang ở màn hình chờ, nó sẽ mất trạng thái và hiển thị mặc định `TAM_SAO` do không nhận được broadcast ban đầu.

---

### Phương án C: Phát nhạc dựa trên sự kiện kích hoạt trò chơi (Không thay đổi WAITING)

Chỉ phát nhạc khi game thực sự chuyển sang trạng thái hoạt động đầu tiên của game MATRIX (ví dụ: `PHASE_1`).

- **Cơ chế hoạt động:**
  1. Trong `DisplayPage.tsx`, khi nhận thấy `game_mode === 'MATRIX'` và `state === 'PHASE_1'`, kích hoạt phát nhạc.
- **Ưu điểm:**
  - Cực kỳ đơn giản, không cần thay đổi cơ chế đồng bộ hiện tại.
- **Nhược điểm:**
  - Không đáp ứng đúng yêu cầu của người dùng: Nhạc chỉ phát sau khi game đã bắt đầu (khi các ô chữ hiển thị), không phát trong thời gian chờ (WAITING) để MC giới thiệu luật chơi.

---

## 3. Giải pháp Frontend đề xuất cho việc Phát nhạc (Autoplay)

Do cơ chế chặn autoplay của trình duyệt, ta cần thực hiện các bước sau trong [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx):

1. **Import file âm thanh:**
   ```typescript
   import game1Audio from '@/assets/game1.mp3';
   ```
2. **Khai báo thẻ `<audio>` và `useRef`:**
   ```typescript
   const audioRef = useRef<HTMLAudioElement>(null);
   // ...
   <audio ref={audioRef} src={game1Audio} loop />
   ```
3. **Điều khiển play/pause bằng `useEffect`:**
   ```typescript
   useEffect(() => {
     if (gameState?.game_mode === 'MATRIX' && gameState?.state === 'WAITING') {
       audioRef.current?.play().catch(e => {
         console.warn("Autoplay audio blocked, waiting for user click:", e);
       });
     } else {
       audioRef.current?.pause();
       if (audioRef.current) audioRef.current.currentTime = 0;
     }
   }, [gameState?.game_mode, gameState?.state]);
   ```
4. **Bypass Autoplay Policy bằng sự kiện click màn hình:**
   ```typescript
   const handleInteract = () => {
     // ... (giữ nguyên logic intro video)
     if (gameState?.game_mode === 'MATRIX' && gameState?.state === 'WAITING') {
       audioRef.current?.play().catch(e => console.warn(e));
     }
   };
   ```

---

## 4. Kế hoạch xác thực (Verification Plan)

### Kiểm thử thủ công:
1. **Kiểm tra chuyển đổi:** Trên màn hình Admin, click chọn tab "MÒ KIM BỂ CHỮ". Quan sát màn hình Display Page tự động chuyển tiêu đề thành "MÒ KIM BỂ CHỮ".
2. **Kiểm tra phát nhạc:** Click một vị trí bất kỳ trên màn hình Display Page (tương tác đầu tiên), kiểm tra xem âm nhạc từ `game1.mp3` có được phát lặp lại (loop) hay không.
3. **Kiểm tra tắt nhạc:** Trên màn hình Admin, bấm "Bắt đầu trò chơi" (chuyển sang `PHASE_1`), kiểm tra xem âm nhạc có dừng phát ngay lập tức không.
4. **Kiểm tra quay lại:** Sau khi kết thúc game hoặc bấm hủy lượt, màn hình quay lại WAITING, kiểm tra xem nhạc có tự động phát lại không.
