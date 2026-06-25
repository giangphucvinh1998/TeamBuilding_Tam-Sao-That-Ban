# Brainstorm: Phát nhạc nền trong các giai đoạn đố chữ của game Mò Kim Bể Chữ

Tài liệu này ghi nhận ý kiến phản hồi từ người dùng và phân tích phương án phát nhạc nền `game1.mp3` trong các giai đoạn giải đố (PHASE_1, PHASE_2, PHASE_3) thay vì màn hình chờ.

---

## 1. Yêu cầu mới từ người dùng

- **Thời điểm phát nhạc:** Nhạc nền `game1.mp3` sẽ được phát trong lúc hiển thị ma trận chữ giải đố trên màn hình Display Page, tương ứng với 3 giai đoạn:
  - **Giai đoạn 1 (PHASE_1):** Bắt đầu điền Matrix (30 giây)
  - **Giai đoạn 2 (PHASE_2):** Ẩn/Hiện ngẫu nhiên (30 giây)
  - **Giai đoạn 3 (PHASE_3):** Phóng to/Thu nhỏ (30 giây)
- **Thời điểm tắt nhạc:** Dừng phát nhạc khi chuyển sang các trạng thái khác (ví dụ: `WAITING`, `SCORING`, `FINISHED`).

---

## 2. Phân tích kỹ thuật & Đơn giản hóa giải pháp

Do nhạc nền chỉ phát khi game đã thực sự bắt đầu và chạy qua các phase (`PHASE_1`, `PHASE_2`, `PHASE_3`):
1. **Không cần sửa đổi Backend:** Backend đã tự động đồng bộ hóa trạng thái `game_mode: "MATRIX"` và các `state` (`PHASE_1`, `PHASE_2`, `PHASE_3`) thông qua WebSocket khi trò chơi được bắt đầu từ Admin Page.
2. **Triển khai hoàn toàn ở Frontend:** Chúng ta chỉ cần sửa đổi component [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx) để lắng nghe sự thay đổi của game state và kích hoạt phát/dừng nhạc tương ứng.

---

## 3. Chi tiết triển khai Frontend đề xuất

Trong [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx):

### Bước 1: Import âm thanh
```typescript
import game1Audio from '@/assets/game1.mp3';
```

### Bước 2: Khai báo useRef cho thẻ audio
```typescript
const audioRef = useRef<HTMLAudioElement>(null);
```

### Bước 3: Điều khiển phát nhạc tự động bằng useEffect
```typescript
useEffect(() => {
  const isMatrixActivePhase = 
    gameState?.game_mode === 'MATRIX' && 
    ['PHASE_1', 'PHASE_2', 'PHASE_3'].includes(gameState?.state);

  if (isMatrixActivePhase) {
    audioRef.current?.play().catch(e => {
      console.warn("Autoplay audio blocked, waiting for user click:", e);
    });
  } else {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Tua lại đầu file
    }
  }
}, [gameState?.game_mode, gameState?.state]);
```

### Bước 4: Thêm thẻ `<audio>` vào JSX
```tsx
<audio ref={audioRef} src={game1Audio} loop />
```

### Bước 5: Cho phép người dùng click để bypass chính sách chặn autoplay của trình duyệt
```typescript
const handleInteract = () => {
  if (gameState?.show_intro) {
    if (videoRef1.current) videoRef1.current.play();
    if (videoRef2.current) videoRef2.current.play();
  }
  
  // Tự động play nhạc nếu đang ở các phase giải đố và bị block autoplay trước đó
  const isMatrixActivePhase = 
    gameState?.game_mode === 'MATRIX' && 
    ['PHASE_1', 'PHASE_2', 'PHASE_3'].includes(gameState?.state);

  if (isMatrixActivePhase) {
    audioRef.current?.play().catch(e => console.warn(e));
  }
};
```

---

## 4. Kế hoạch xác thực (Verification Plan)

1. **Khởi chạy ứng dụng:** Mở Admin Page và Display Page trên trình duyệt.
2. **Tương tác ban đầu:** Click một lần vào màn hình Display Page để cấp quyền phát âm thanh cho trình duyệt (user gesture).
3. **Bắt đầu game:** Trên Admin Page, vào tab "Mò Kim Bể Chữ", bấm "BẮT ĐẦU TRÒ CHƠI" (chuyển sang Giai đoạn 1).
4. **Kiểm tra phát nhạc:** Xác minh nhạc nền `game1.mp3` được phát lên ở Display Page.
5. **Kiểm tra chuyển giai đoạn:** Theo dõi khi game tự động chuyển từ Giai đoạn 1 sang Giai đoạn 2 rồi sang Giai đoạn 3, nhạc nền phải tiếp tục phát liên tục và không bị gián đoạn hay tải lại từ đầu.
6. **Kiểm tra tắt nhạc:** Khi kết thúc Giai đoạn 3 (chuyển sang trạng thái `SCORING` - Đang chấm điểm), nhạc nền phải dừng lại lập tức.
