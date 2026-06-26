# Giai đoạn 1: Triển Khai Phương Án A với Cơ Chế Caching

## Tổng quan
* **Mức độ ưu tiên**: Cao
* **Trạng thái**: pending
* **Mục tiêu**: Xây dựng toàn bộ tính năng và đảm bảo ảnh 24MB được trình duyệt tải trước để hiển thị tức thì.

## Các tệp tin liên quan
* [game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/game_state.py)
* [humming_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/humming_game_state.py)
* [matrix_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/matrix_game_state.py)
* [models.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/models.py)
* [game.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/game.py)
* [AdminPage.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/pages/AdminPage.tsx)
* [DisplayPage.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/pages/DisplayPage.tsx)

## Các bước thực hiện

### 1. Cấu hình Backend
1. Thêm biến `show_speech` vào trạng thái máy chơi trong `backend/game_state.py`.
2. Bổ sung `show_speech` vào hàm chuyển đổi dữ liệu của `game_state.py`, `humming_game_state.py`, và `matrix_game_state.py`.
3. Bổ sung trường `show_speech` vào Pydantic model `GameStateResponse` trong `backend/models.py`.
4. Tạo API route `/toggle-speech` trong `backend/routers/game.py`.

### 2. Tích hợp Frontend
1. Tải trước ảnh (Preload image): Trong `DisplayPage.tsx`, thêm effect chạy một lần khi component mount khởi tạo `new Image()` trỏ tới file ảnh để trình duyệt tải trước và lưu vào bộ nhớ cache.
2. Thêm button `🎤 CHIẾU PHÁT BIỂU` tại trang `AdminPage.tsx`.
3. Render lớp ảnh phủ toàn màn hình tại `DisplayPage.tsx` khi `show_speech === true`.

## Danh sách công việc (Todo List)
- [ ] Cập nhật `game_state.py` (biến & method toggle)
- [ ] Cập nhật `models.py` (thêm trường cho schema)
- [ ] Cập nhật `humming_game_state.py` & `matrix_game_state.py` (trả về show_speech)
- [ ] Cập nhật `routers/game.py` (API endpoint)
- [ ] Cập nhật `AdminPage.tsx` (tích hợp nút bấm & toggle call)
- [ ] Cập nhật `DisplayPage.tsx` (preload ảnh & render overlay)
