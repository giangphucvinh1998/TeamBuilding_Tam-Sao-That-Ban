# Brainstorm: Hiển thị Đáp án khi trả lời đúng/kết thúc lượt Game 2 & Game 3

Chúng tôi đã phân tích yêu cầu tự động hiển thị đáp án lên màn hình máy chiếu (Display) khi kết thúc lượt hoặc khi có câu trả lời đúng cho Game 2 (Giai điệu vượt ngàn) và Game 3 (Mật mã lặng thinh).

---

## 🔍 Phân tích hiện trạng & Vấn đề

1. **Cơ chế bảo mật trên WebSocket (`backend/websocket_manager.py`):**
   * Hiện tại, để tránh lộ đề (cheating), Backend luôn loại bỏ hai trường `current_keyword` và `current_answer` trước khi gửi trạng thái qua WebSocket tới các client của màn hình máy chiếu (Display).
   * Điều này dẫn đến việc màn hình máy chiếu của Game 3 không nhận được từ khóa đáp án ngay cả khi lượt chơi đã kết thúc (`state === 'FINISHED'`).
2. **Game 2 (Giai điệu vượt ngàn):**
   * Đối với Game 2, đáp án (`title` của bài hát) nằm trong đối tượng `current_song`.
   * Đối tượng này hiện không bị lọc bỏ trong `websocket_manager.py`. Giao diện của Game 2 (`HummingDisplay.tsx`) đã có sẵn phần hiển thị đáp án khi `state === 'FINISHED'`:
     ```tsx
     <div className="text-3xl text-gray-300 mb-4">Đáp án:</div>
     <div className="text-5xl font-black text-white mb-8 bg-blue-900/50 px-8 py-4 rounded-2xl border-2 border-blue-400">
       {current_song?.title}
     </div>
     ```
   * Do đó, Game 2 đã hoạt động đúng như mong muốn ngay khi trạng thái chuyển sang `FINISHED`.
3. **Game 3 (Mật mã lặng thinh):**
   * Màn hình máy chiếu của Game 3 hiện tại chỉ hiển thị thông báo "KẾT THÚC LƯỢT CHƠI", số điểm cộng/trừ và Bảng điểm (Scoreboard). Chưa có phần hiển thị Mật mã đáp án.

---

## 🛠️ Giải pháp Thiết kế & Kỹ thuật đề xuất

### 1. Cập nhật Backend (`backend/websocket_manager.py`)
Cho phép gửi `current_keyword` và `current_answer` cho Display khi trạng thái là `FINISHED`:
```python
        # Display gets filtered state (no keyword, answer; hint only when visible)
        display_data = {**state_data}
        if display_data.get("state") != "FINISHED":
            display_data.pop("current_keyword", None)
            display_data.pop("current_answer", None)
            if not display_data.get("hint_visible", False):
                display_data.pop("current_hint", None)
```

### 2. Cập nhật Frontend (`frontend/src/pages/DisplayPage.tsx`)
Hiển thị mật mã đáp án của Game 3 trên màn hình trình chiếu ở trạng thái `FINISHED`:
```tsx
            {state === 'FINISHED' && (
              <div className="text-center w-full flex flex-col items-center">
                <div className="text-6xl font-black mb-8 text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                  KẾT THÚC LƯỢT CHƠI
                </div>
                
                {/* Bổ sung hiển thị Mật mã đáp án */}
                {gameState?.current_keyword && (
                  <div className="mb-8">
                    <div className="text-2xl text-gray-400 font-bold uppercase tracking-widest mb-3">Mật mã đáp án:</div>
                    <div className="text-5xl font-black text-white bg-purple-900/50 px-8 py-4 rounded-2xl border-2 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.4)] uppercase tracking-wide inline-block">
                      {gameState?.current_keyword}
                    </div>
                  </div>
                )}

                {lastEffect?.effect === 'correct' && (
                  <div className="text-4xl text-white font-bold bg-green-600/30 px-8 py-4 rounded-2xl border border-green-500/50 mb-8">
                    +{lastEffect?.points} Điểm cho đội {teams.find((t: any) => t.id === lastEffect?.team_id)?.name}
                  </div>
                )}
```

---

## 📋 Đánh giá Rủi ro & Lưu ý
* **Bảo mật dữ liệu:** Chỉ khi trạng thái game được đổi thành `FINISHED` (lượt chơi đã thực sự kết thúc), dữ liệu mật mã đáp án mới được gửi qua WebSocket. Vì vậy hoàn toàn không lo ngại rủi ro rò rỉ đề thi trong quá trình chơi.

---

## 🚀 Bước tiếp theo
Tôi đã chuẩn bị Kế hoạch triển khai chi tiết cho việc bổ sung hiển thị đáp án này. Bạn có muốn xem và phê duyệt kế hoạch triển khai không?
