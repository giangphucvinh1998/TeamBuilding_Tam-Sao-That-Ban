# Brainstorm: Phục Hồi Session Khi Khởi Động Backend & Sửa Lỗi Hiển Thị Bảng Điểm Ở Màn Hình Chờ

Tài liệu này phân tích nguyên nhân danh sách đội trống khi khởi động lại server và lỗi bảng điểm tổng sắp không hiển thị khi game ở trạng thái `WAITING`.

---

## 1. Phục Hồi Active Session Khi Khởi Động Backend

### Triệu chứng & Nguyên nhân
- **Triệu chứng**: Giao diện quản lý đội chơi ở cột bên phải vẫn hiển thị danh sách đội chơi (vì gọi API HTTP GET trực tiếp tới DB). Tuy nhiên, phần chọn đội thi đấu ở các game (như Giai Điệu Vượt Ngàn, Mật Mã Lặng Thinh) lại trống trơn.
- **Nguyên nhân**: Khi server Backend khởi động lại hoặc tự động reload (do thay đổi code), toàn bộ biến lưu trong bộ nhớ RAM của Python bị xóa sạch, bao gồm `session_id` của các state machine: `game.session_id`, `humming_game.session_id`, và `matrix_game.session_id`.
  Do đó, khi clients kết nối qua WebSocket, Backend trả về state có `session_id: null` và `teams: []`. Frontend nhận danh sách đội trống từ WS nên dropdown chọn đội không có dữ liệu.

### Giải pháp
Bổ sung cơ chế tự động tìm và khôi phục (restore) session có trạng thái `ACTIVE` từ SQLite database ngay khi ứng dụng FastAPI khởi chạy trong hàm `lifespan`.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Khôi phục session đang ACTIVE
    db = await get_db()
    try:
        async with db.execute("SELECT id FROM sessions WHERE status = 'ACTIVE' LIMIT 1") as cursor:
            row = await cursor.fetchone()
            if row:
                active_id = row["id"]
                await main_game.set_session(active_id)
                await humming_game.set_session(active_id)
                await matrix_game.set_session(active_id)
    ...
```

---

## 2. Hiển Thị Bảng Điểm Ở Trạng Thế WAITING

### Triệu chứng & Nguyên nhân
- **Triệu chứng**: Khi bấm nút "HIỆN ĐIỂM CHIẾU" từ Admin Panel lúc game chưa bắt đầu (trạng thái `WAITING`), màn hình Display Page không hiển thị Bảng Điểm Tổng Sắp.
- **Nguyên nhân**: Trong `DisplayPage.tsx`, nếu trạng thái game là `WAITING`, component sẽ trả về sớm (early return) một khối giao diện chào mừng. Trong khối giao diện chào mừng này, chúng ta chưa khai báo render component `<ScoreboardOverlay />`.

### Giải pháp
Khai báo render `<ScoreboardOverlay show={gameState?.show_scoreboard} teams={gameState?.teams} />` vào cả 2 khối giao diện (khối early return khi `WAITING` và khối render chính khi đang chơi) trong `DisplayPage.tsx`.

---

## 3. Kế Hoạch Triển Khai Tiếp Theo

1. Cập nhật hàm `lifespan` trong `backend/main.py` để khôi phục active session khi khởi động.
2. Thêm `<ScoreboardOverlay />` vào khối render `WAITING` trong `frontend/src/pages/DisplayPage.tsx`.
3. Kiểm thử biên dịch và chạy thực tế.
