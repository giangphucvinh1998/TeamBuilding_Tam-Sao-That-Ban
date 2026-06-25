# Brainstorm: Tự động chuyển trạng thái Dừng (Pause) khi phát hết bài hát ở game Giai Điệu Vượt Ngàn

## Hiện trạng & Vấn đề

- Ở game **Giai Điệu Vượt Ngàn** (Game 2 - `HUMMING`), khi bài hát/video phát hết thời lượng ở phía màn hình trình chiếu (Display Page), trạng thái trên bảng điều khiển của MC vẫn hiển thị nút "⏸ TẠM DỪNG ĐĨA NHẠC" và đĩa nhạc vẫn tiếp tục quay (vì biến `is_media_playing` trên backend vẫn là `True`).
- **Yêu cầu**: Khi bài hát phát hết, hệ thống phải tự động chuyển trạng thái về Dừng (Pause/Stop) trên cả màn hình trình chiếu và bảng điều khiển của MC.

## Giải pháp đề xuất

1. **Ở phía Frontend (Màn hình trình chiếu - `HummingDisplay.tsx`)**:
   - Nhận diện sự kiện kết thúc phát media qua thuộc tính `onEnded` của thẻ `<video>`:
     ```tsx
     const handleMediaEnded = () => {
       api.post('/humming/play-pause', { play: false }).catch(console.error);
     };
     ```
   - Thêm thuộc tính `onEnded={handleMediaEnded}` vào cả 2 thẻ `<video>` phát nhạc trong [HummingDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/HummingDisplay.tsx).

2. **Cách thức hoạt động**:
   - Khi bài hát chạy hết thời lượng, thẻ `<video>` trên Display Page kích hoạt sự kiện `ended`.
   - Trình duyệt tự động gọi API `/api/humming/play-pause` gửi `{ play: false }`.
   - Backend cập nhật trạng thái `is_media_playing = False` và broadcast trạng thái mới qua WebSocket.
   - Bảng điều khiển MC nhận trạng thái mới và lập tức chuyển nút bấm từ "TẠM DỪNG ĐĨA NHẠC" quay lại thành "PHÁT ĐĨA NHẠC".
   - Màn hình trình chiếu dừng hoạt cảnh đĩa nhạc tự quay.
