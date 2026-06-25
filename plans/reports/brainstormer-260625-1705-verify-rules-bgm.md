# Kết Quả Kiểm Tra: Phát Nhạc Nền Khi Hiển Thị Luật Chơi

Chúng tôi đã tiến hành rà soát mã nguồn (cả Frontend và Backend) cũng như tài nguyên âm thanh của dự án để kiểm tra tính năng phát nhạc nền khi mở màn hình luật chơi.

---

## 🔍 Kết quả rà soát

### 1. Tài nguyên âm thanh (Asset)
Tệp âm thanh nhạc nền luật chơi **đã tồn tại** tại đường dẫn:
* `frontend/src/assets/background-rule-game.mp3` (Kích thước: ~2.95 MB)

### 2. Logic Frontend (`DisplayPage.tsx`)
Nhạc nền đã được tích hợp đầy đủ thông qua cơ chế đồng bộ trạng thái từ Server:
* **Import tài nguyên:** `import backgroundRuleAudio from '@/assets/background-rule-game.mp3';`
* **Khai báo ref:** `const backgroundRuleRef = useRef<HTMLAudioElement>(null);`
* **Xử lý sự kiện (Autoplay Fallback):** Nhằm tránh chính sách chặn tự động phát âm thanh (Autoplay Policy) của trình duyệt:
  * Sự kiện click bất kỳ trên màn hình (`handleInteract`) sẽ kích hoạt phát nhạc:
    ```tsx
    if (gameState?.show_rules) {
      backgroundRuleRef.current?.play().catch(e => console.warn("Interactive rules play failed:", e));
    }
    ```
* **Đồng bộ thời gian thực (WebSocket Effect):** Khi trạng thái `show_rules` từ backend thay đổi:
  * **Khi hiển thị (`true`):** Tự động gọi `.play()`.
  * **Khi ẩn (`false`):** Tự động gọi `.pause()` và reset thời gian về `0` để lần sau phát lại từ đầu.
    ```tsx
    useEffect(() => {
      if (gameState?.show_rules) {
        backgroundRuleRef.current?.play().catch(e => {
          console.warn("Autoplay rules audio blocked, waiting for interaction:", e);
        });
      } else {
        backgroundRuleRef.current?.pause();
        if (backgroundRuleRef.current) {
          backgroundRuleRef.current.currentTime = 0;
        }
      }
    }, [gameState?.show_rules]);
    ```
* **HTML Audio Tag:** Đã được gắn vào DOM ở cả hai trạng thái render (Waiting screen và Main layout):
  ```tsx
  <audio ref={backgroundRuleRef} src={backgroundRuleAudio} loop />
  ```

### 3. Logic Backend (`game_state.py` & các màn chơi)
* Trạng thái `show_rules` được quản lý tập trung ở Backend Game State và tự động chuyển về `False` (Auto-hide) khi MC bấm nút bắt đầu trò chơi (ví dụ: chuyển từ `WAITING` sang `READY`).
* Khi đó, tín hiệu tắt luật chơi sẽ truyền xuống Display, tắt âm thanh nhạc nền luật chơi ngay lập tức để chuyển sang nhạc nền trận đấu (`game1Audio` hoặc `backgroundGame1Audio`), đảm bảo **không bị đè/lẫn âm thanh**.

---

## 💡 Đánh giá & Khuyến nghị
Cơ chế hiện tại đã được thiết kế tối ưu và tránh được hầu hết các lỗi đè âm thanh hoặc lỗi autoplay của trình duyệt. 

> [!NOTE]
> Khi MC bắt đầu trình chiếu màn hình `DisplayPage` trên máy chiếu, **hãy click chuột 1 lần vào bất kỳ đâu trên màn hình hiển thị** đó. Hành động này giúp trình duyệt cấp quyền phát âm thanh tự động (Unlock Autoplay), đảm bảo nhạc nền luật chơi và nhạc nền game sẽ phát mượt mà ngay khi được MC kích hoạt từ Admin Panel.
