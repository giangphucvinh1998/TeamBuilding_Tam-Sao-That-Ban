# Brainstorm: Khắc Phục Lỗi Cắt Tiêu Đề Màn Hình & Đồng Bộ Bảng Điểm Tổng Sắp

Tài liệu này phân tích nguyên nhân lỗi hiển thị tiêu đề tiếng Việt bị cắt trên Display Page, đồng thời đề xuất giải pháp kỹ thuật tích hợp nút toggle "Hiển thị điểm tổng sắp" đồng bộ giữa Admin Panel và Display Page.

---

## 1. Khắc Phục Lỗi Cắt Tiêu Đề Tiếng Việt Trên Màn Hình Trình Chiếu

### Nguyên nhân
Khi sử dụng thuộc tính `bg-clip-text` kết hợp với `text-transparent` để tạo màu chữ gradient, trình duyệt sẽ vẽ một hộp clipping quanh văn bản.
- Nếu không có khoảng cách an toàn (padding/margin dọc), các ký tự có dấu thanh tiếng Việt nằm ở phía trên (dấu sắc, huyền, hỏi, ngã, mũ như `Ố`, `Ể`, `Ữ`) hoặc dấu nặng bên dưới (`Ự`, `Ệ`) sẽ bị cắt mất do vượt quá vùng vẽ (bounding box) của text.
- Thuộc tính `tracking-tighter` làm thu hẹp khoảng cách giữa các chữ cái, vô tình làm thu nhỏ vùng vẽ này thêm nữa.

### Giải pháp
1. Thêm khoảng cách đệm dọc (`py-4` hoặc `py-6`) cho thẻ tiêu đề `<h1>` để mở rộng vùng vẽ cho trình duyệt.
2. Thêm line-height an toàn (`leading-normal` hoặc `leading-relaxed`).
3. Điều chỉnh khoảng cách chữ thành `tracking-normal` hoặc `tracking-wide` để text hiển thị trọn vẹn và thoáng hơn trên màn hình LED lớn.

Ví dụ đoạn mã CSS/Tailwind tối ưu:
```tsx
<h1 className="text-8xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_25px_rgba(219,39,119,0.5)] mb-16 tracking-normal py-4 leading-normal z-10 relative uppercase">
```

---

## 2. Giải Pháp Đồng Bộ Bảng Điểm Tổng Sắp Từ Admin Lên Display Page

Để MC hoặc Ban tổ chức có thể công bố bảng điểm tổng sắp bất kỳ lúc nào (sau mỗi vòng chơi hoặc khi tổng kết), chúng ta cần tích hợp cơ chế đồng bộ hóa trạng thái hiển thị bảng điểm qua WebSocket.

### A. Cập Nhật Trạng Thái Hệ Thống (Backend)
1. Bổ sung trường `show_scoreboard: bool = False` vào `GameStateResponse` trong models.py.
2. Thêm `self.show_scoreboard = False` vào `GameStateMachine` trong game_state.py.
3. Cập nhật `get_full_state()` trong `game_state.py`, `matrix_game_state.py`, và `humming_game_state.py` để trả về `show_scoreboard`.
4. Thêm API endpoint `/api/game/toggle-scoreboard` trong `routers/game.py` để thay đổi trạng thái và broadcast tới toàn bộ client.

### B. Giao Diện Điều Khiển (Admin Panel)
Tích hợp nút bấm bật/tắt bảng điểm tổng sắp tại 2 vị trí tiện lợi:
1. **Header thanh công cụ chính** (cạnh nút Intro) để người dùng có thể kích hoạt nhanh từ bất kỳ đâu.
2. **Ngay phía trên Bảng Điểm Nhanh** ở cột phải để MC/Operator thao tác trực quan khi theo dõi điểm số.

### C. Màn Hình Trình Chiếu (Display Page Overlay)
Xây dựng một component `ScoreboardOverlay` hiển thị tràn màn hình với giao diện hiện đại dạng Glassmorphism & Neon phát sáng khi `show_scoreboard === true` tại `DisplayPage.tsx`.

---

## 3. Kế Hoạch Triển Khai Tiếp Theo

1. Cấu trúc lại schema Backend và bổ sung endpoint `/api/game/toggle-scoreboard`.
2. Sửa lỗi clipping tiêu đề game tại `DisplayPage.tsx` bằng cách thêm padding dọc và chỉnh line-height.
3. Tạo nút bật/tắt bảng điểm tổng sắp trên giao diện Admin.
4. Xây dựng Overlay bảng điểm tổng sắp đẹp mắt tại Display Page và kiểm thử hoạt động.
