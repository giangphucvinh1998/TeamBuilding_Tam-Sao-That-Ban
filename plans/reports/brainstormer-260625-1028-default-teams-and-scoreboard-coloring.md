# Brainstorm: Tự động khởi tạo đội chơi & Tô màu bảng xếp hạng theo tên đội

Tài liệu này ghi nhận và phân tích các phương án thiết kế tính năng tự động tạo 5 đội chơi mặc định và áp dụng màu sắc đồng bộ của các đội lên giao diện bảng xếp hạng (Scoreboard) và tiêu đề.

---

## 1. Yêu cầu chi tiết
1. **Khởi tạo đội chơi mặc định:** Hệ thống cần tự động tạo sẵn 5 đội chơi sau cho mỗi phiên chơi (session):
   * `XANH BIỂN`
   * `XANH NGỌC`
   * `XANH LÁ`
   * `TIM TÍM`
   * `ĐO ĐỎ`
2. **Cơ chế chơi:**
   * **Trò 1 (Mò kim bể chữ):** Chơi chung (không hiển thị tên một đội cụ thể đang chơi ở đầu màn hình).
   * **Trò 2 (Giai điệu ngân nga) & Trò 3 (Mật mã lặng thinh):** Chơi theo lượt (hiển thị tên đội đang chơi ở đầu màn hình Display Page).
3. **Màu sắc đồng bộ:** Bảng xếp hạng (Scoreboard) và tiêu đề hiển thị tên đội cần sử dụng đúng màu tương ứng với tên đội đó để tạo hiệu ứng thị giác hiện đại và nhất quán.

---

## 2. Giải pháp kỹ thuật

### 2.1. Khởi tạo đội chơi mặc định (Backend)
Thay vì bắt Admin phải nhập thủ công 5 đội chơi mới cho mỗi Session, ta sẽ tự động tạo chúng ở Backend bất cứ khi nào danh sách đội được truy vấn nhưng đang trống:
- **Tập tin cần sửa:** `backend/routers/teams.py` (hàm `list_teams`).
- **Logic:** Khi truy vấn danh sách đội của một `session_id` từ SQLite:
  - Nếu kết quả trả về rỗng (`rows` trống):
    * Thực hiện chèn 5 đội mặc định vào database với số lượng thành viên mặc định (ví dụ: 5) và thứ tự lượt chơi (`play_order` từ 1 đến 5).
    * Thực hiện `commit()` và truy vấn lại danh sách để trả về cho Client.
  - Cách làm này đảm bảo tính tương thích ngược với các session cũ và tự động hoạt động cho mọi session mới tạo mà không cần thay đổi API hay UI thêm đội.

### 2.2. Cơ chế hiển thị tên đội (Frontend)
Hiện tại:
- Trò 1 (Mò kim bể chữ) không trả về `current_team` trong API/WebSocket state. Do đó, phần hiển thị tên đội ở [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx#L97-L103) đã tự động ẩn đi. Điều này khớp hoàn hảo với yêu cầu "chơi chung".
- Trò 2 và 3 đều lưu trữ và cập nhật `current_team_id` trên server khi MC bấm bắt đầu lượt chơi mới cho đội đó. Do đó, tên đội đang chơi đã tự động hiển thị ở đầu trang Display Page. Yêu cầu này đã được đáp ứng sẵn bởi kiến trúc hiện tại.

### 2.3. Tô màu giao diện theo tên đội (Frontend)
Chúng ta sẽ xây dựng bảng cấu hình màu sắc tương ứng cho 5 đội trong Frontend:

```typescript
const TEAM_THEMES = {
  'XANH BIỂN': {
    text: 'text-blue-400',
    bg: 'bg-blue-950/20',
    border: 'border-blue-900/40',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    isPlayingBg: 'bg-blue-900/40',
    isPlayingBorder: 'border-blue-500'
  },
  'XANH NGỌC': {
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-900/40',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    isPlayingBg: 'bg-cyan-900/40',
    isPlayingBorder: 'border-cyan-500'
  },
  ...
}
```

#### A. Cập nhật bảng xếp hạng [Scoreboard.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/Scoreboard.tsx)
- Đọc tên đội từ `team.name.trim().toUpperCase()`.
- Áp dụng các màu `text`, `bg`, `border`, `glow` tương ứng vào container `<motion.div>` và thẻ hiển thị tên đội.
- Khi một đội đang trong lượt chơi (`isPlaying === true`), hiển thị màu sắc sáng hơn (sử dụng `isPlayingBg` và `isPlayingBorder`) kết hợp với hiệu ứng phóng to nhẹ và đổ bóng (glow) rực rỡ hơn.

#### B. Cập nhật tiêu đề góc phải màn hình chiếu [DisplayPage.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/pages/DisplayPage.tsx)
- Áp dụng màu văn bản tương ứng vào thẻ hiển thị tên đội đang chơi:
  ```tsx
  Đội: <span className={getTeamColorClass(current_team.name)}>{current_team.name}</span>
  ```

---

## 3. Kế hoạch xác thực (Verification Plan)
1. **Tạo Session mới:** Truy cập Admin -> Hệ thống -> Tạo một session mới và kích hoạt.
2. **Kiểm tra tự động tạo đội:** Vào tab "Đội Chơi". Đảm bảo 5 đội `XANH BIỂN`, `XANH NGỌC`, `XANH LÁ`, `TIM TÍM`, `ĐO ĐỎ` đã tự động xuất hiện.
3. **Kiểm tra màu sắc Scoreboard:** Mở Display Page (màn hình chờ). Đảm bảo mỗi dòng của bảng xếp hạng hiển thị màu chữ, viền và nền khớp với tên đội tương ứng.
4. **Kiểm tra khi thi đấu:**
   - MC chọn một đội thi đấu trong game Giai Điệu Ngân Nga hoặc Mật Mã Lặng Thinh và bấm bắt đầu.
   - Kiểm tra xem tên đội hiển thị trên header của Display Page có được tô đúng màu hay không.
   - Kiểm tra xem dòng của đội đó trong bảng xếp hạng khi kết thúc lượt đấu có sáng viền và đổ bóng đúng màu hay không.
