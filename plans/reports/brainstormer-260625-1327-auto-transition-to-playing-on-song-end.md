# Brainstorm: Tự động chuyển sang trạng thái Thi Đấu (PLAYING) khi bài hát kết thúc ở game Giai Điệu Vượt Ngàn

## Hiện trạng & Vấn đề

- Ở game **Giai Điệu Vượt Ngàn** (Game 2 - `HUMMING`), sau khi bài hát kết thúc (phát hết thời lượng), màn hình điều khiển của MC vẫn giữ nguyên ở trạng thái `READY` với nút "TẠM DỪNG ĐĨA NHẠC", và đĩa nhạc vẫn ở trạng thái quay. MC phải tự click nút "BẮT ĐẦU TÍNH GIỜ" để chuyển sang giai đoạn đoán bài hát.
- **Yêu cầu**: Khi nhạc phát hết, hệ thống cần tự động chuyển sang trạng thái thi đấu đoán tên bài hát (`PLAYING`) và chạy đồng hồ đếm ngược 60 giây.

## Giải pháp đề xuất

1. **Phía Frontend (Màn hình trình chiếu - `HummingDisplay.tsx`)**:
   - Cập nhật hàm `handleMediaEnded` để tự động kích hoạt API bắt đầu thi đấu nếu game đang ở trạng thái chuẩn bị (`READY`):
     ```tsx
     const handleMediaEnded = () => {
       if (state === 'READY') {
         api.post('/humming/start-playing').catch(console.error);
       } else {
         api.post('/humming/play-pause', { play: false }).catch(console.error);
       }
     };
     ```

2. **Phía Backend (Trạng thái game - `humming_game_state.py`)**:
   - Khi chuyển sang trạng thái `PLAYING` thông qua hàm `start_playing()`, cần thiết lập `is_media_playing = False` để đảm bảo hoạt cảnh đĩa nhạc dừng quay trên màn hình trình chiếu.
     ```python
     async def start_playing(self):
         self.state = GameState.PLAYING
         self.is_media_playing = False
         self.timer_info = TimerInfo(start_time=time.time(), duration=60, type="playing")
         # ...
     ```

## Luồng hoạt động mới:
- MC chọn đội và bài hát, bấm "Bắt đầu lượt mới". Game vào trạng thái `READY`.
- MC bấm phát nhạc. Nhạc phát trên máy chiếu.
- Khi nhạc chạy hết, sự kiện `ended` của video kích hoạt -> Gọi API `/api/humming/start-playing`.
- Backend chuyển game sang `PLAYING`, set `is_media_playing = False`, khởi chạy timer 60s và broadcast.
- Màn hình máy chiếu tự động chuyển sang màn hình đếm ngược 60s.
- Bảng điều khiển MC tự động cập nhật sang giao diện chấm điểm (Đúng/Sai).
