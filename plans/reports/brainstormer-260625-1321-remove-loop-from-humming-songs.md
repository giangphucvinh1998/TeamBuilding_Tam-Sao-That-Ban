# Brainstorm: Tắt tính năng lặp bài hát (Loop) ở trò chơi Giai Điệu Vượt Ngàn

## Hiện trạng & Vấn đề

- Ở trò chơi **Giai Điệu Vượt Ngàn** (Game 2 - `HUMMING`), các bài hát/video nhạc gợi ý khi phát cho người chơi đang bị tự động lặp lại liên tục (Loop).
- **Yêu cầu**: Chỉ phát nhạc đúng 1 lần rồi dừng lại, không được tự động lặp.

## Nguyên nhân
Trong file [HummingDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/HummingDisplay.tsx), cả 2 thẻ `<video>` dùng để phát nhạc gợi ý (cho âm thanh thường và cho video ở lượt Live cuối) đều được thiết lập thuộc tính `loop`:
1. Thẻ phát âm thanh thường (dạng video ẩn kích thước 1px):
   ```tsx
   <video ref={mediaRef} src={current_song.media_url} loop playsInline className="w-px h-px" />
   ```
2. Thẻ phát video ở lượt Live cuối:
   ```tsx
   <video src={current_song.media_url} className="w-full h-full object-cover" autoPlay={is_media_playing} loop muted={false} ref={mediaRef} playsInline />
   ```

## Giải pháp đề xuất
Loại bỏ thuộc tính `loop` khỏi cả 2 thẻ `<video>` này trong file [HummingDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/HummingDisplay.tsx). Khi video/audio phát hết thời lượng bài hát, nó sẽ tự động dừng lại đúng 1 lần như yêu cầu.
