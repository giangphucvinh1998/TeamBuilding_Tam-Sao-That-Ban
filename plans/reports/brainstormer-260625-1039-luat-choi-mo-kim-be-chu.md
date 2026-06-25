# Brainstorm: Luật Chơi Trực Quan Cho Game "Mò Kim Bể Chữ" & Cơ Chế Hiển Thị Trên Màn Hình Gala

Tài liệu này đề xuất phương án tối ưu văn phong luật chơi game "Mò Kim Bể Chữ" cho không khí Gala náo nhiệt, đồng thời thiết kế cơ chế hiển thị nút "Xem luật chơi" đồng bộ giữa màn hình Admin và Display Page.

---

## 1. Tối Ưu Văn Phong Luật Chơi (Game "Mò Kim Bể Chữ")

Văn phong gốc khá mang tính hành chính/kỹ thuật. Để phù hợp với không khí **Gala/Team Building sôi động**, nội dung cần được chuyển đổi sang dạng **kêu gọi hành động (call-to-action), sử dụng emoji sinh động, làm nổi bật tính ganh đua và rõ ràng về điểm số**.

### 🌟 Phương án Tối ưu (Khuyên dùng)
> **LUẬT CHƠI: MÒ KIM BỂ CHỮ**
> 
> * 📵 **CẤT ĐIỆN THOẠI:** Toàn bộ thành viên úp điện thoại xuống bàn. *Tuyệt đối không chụp ảnh đề thi!*
> * ⏱️ **SIÊU TỐC GHI NHỚ:** Ma trận đề thi chỉ xuất hiện trên màn hình lớn trong **1 phút 30 giây**. Hãy tập trung cao độ!
> * 🏃‍♂️ **TIẾP SỨC ĐỒNG ĐỘI:** Mỗi đội cử **3 chiến binh** lên sân khấu tiếp sức điền từ khóa vào ma trận 10x10 trống trên giấy A4.
> * 🏆 **ĐUA ĐIỂM VÀNG:** Điểm số được tính dựa trên số lượng từ khóa tìm được và điền đúng vị trí chính xác trên ma trận trống.

---

## 2. Giải Pháp Kỹ Thuật Hiển Thị Luật Chơi Trên Màn Hình Gala

Vì đây là trò chơi chạy song song 2 màn hình (Admin Điều Khiển và Display Trình Chiếu), việc hiển thị luật chơi cần được đồng bộ qua WebSocket để đảm bảo MC/BTC làm chủ sân khấu.

### Phân tích Các Phương Án Thiết Kế

| Phương án | Chi tiết | Ưu điểm | Nhược điểm | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **Phương án 1:**<br>Nút toggle trên **Admin**, đồng bộ hiển thị lên **Display** qua WS. | Admin có nút `BẬT/TẮT LUẬT CHƠI`. Khi bật, màn hình Display hiện Overlay/Modal full-screen phủ lên giao diện hiện tại. | - MC/BTC chủ động hoàn toàn khi hướng dẫn luật chơi.<br>- Giao diện Display cực kỳ sạch sẽ, không bị thừa nút bấm. | Cần bổ sung state `show_rules` vào Game State của Backend và đồng bộ qua WS. | **Khuyên dùng (Độ premium cao nhất)** |
| **Phương án 2:**<br>Nút bấm nổi trực tiếp trên màn hình **Display**. | Trên góc màn hình Display có nút nhỏ "Luật chơi". Click vào sẽ mở Modal luật chơi. | Đơn giản, dễ code, không cần đụng đến WebSocket/Backend. | - Màn hình lớn dùng máy chiếu/LED nên không có người đứng click trực tiếp.<br>- Phá vỡ tính tự động của Gala. | Không phù hợp cho màn hình trình chiếu Gala |
| **Phương án 3:**<br>Hiển thị luật chơi cố định ở màn hình chờ (`WAITING`). | Khi game ở trạng thái `WAITING`, luật chơi sẽ hiện ở một góc hoặc dạng slide chạy chữ bên cạnh Bảng điểm. | Người chơi có thể đọc luật từ sớm trong lúc chờ đợi. | Chiếm không gian của màn hình chờ (vốn đang cần hiển thị bảng điểm lớn hoặc logo). | Phù hợp làm phương án bổ trợ |

---

## 3. Kiến Trúc Đề Xuất (Theo Phương Án 1 - Đồng bộ Admin-Display)

### 🏗️ Backend State updates (FastAPI)
Thêm trường `show_rules` vào schema trạng thái game:
```python
# file: backend/models/game.py hoặc tương đương
class GameState(BaseModel):
    # ... các trường hiện tại ...
    show_rules: bool = False
```

Thêm API endpoint để bật/tắt luật chơi:
```python
# file: backend/routers/game.py
@router.post("/toggle-rules")
async def toggle_rules():
    # Toggle state.show_rules và broadcast_state() tới toàn bộ client
```

### 💻 Giao Diện Frontend (React)

#### A. Trình Chiếu (`DisplayPage.tsx`)
Khi `gameState.show_rules === true`, hiển thị một Overlay cực kỳ bắt mắt với phong cách **Glassmorphism & Neon Glow**:
```tsx
{gameState?.show_rules && (
  <div className="fixed inset-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-md flex items-center justify-center animate-fade-in p-8">
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-12 rounded-3xl max-w-4xl w-full shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 blur-[80px] rounded-full"></div>
      
      <h2 className="text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-8 tracking-wide uppercase">
        LUẬT CHƠI: {getGameName(gameState.game_mode)}
      </h2>
      
      <div className="space-y-6 text-xl text-gray-200">
        {/* Render nội dung luật chơi của game tương ứng ở đây */}
      </div>
    </div>
  </div>
)}
```

#### B. Điều khiển (`AdminPage.tsx` hoặc `MatrixController.tsx`...)
Thêm nút toggle trực quan ở hàng điều khiển trên cùng của mỗi controller:
```tsx
<button
  onClick={handleToggleRules}
  className={`px-4 py-2 rounded-lg font-bold transition-all border ${
    gameState?.show_rules
      ? 'bg-purple-600 text-white border-purple-500 animate-pulse'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
  }`}
>
  📜 {gameState?.show_rules ? 'ẨN LUẬT CHƠI MÁY CHIẾU' : 'HIỆN LUẬT CHƠI MÁY CHIẾU'}
</button>
```

---

## 4. Kế Hoạch Tiếp Theo

1. Thống nhất nội dung luật chơi cho cả 3 game (Mò Kim Bể Chữ, Giai Điệu Vượt Ngàn, Mật Mã Lặng Thinh).
2. Tạo cấu trúc lưu trữ nội dung luật chơi tập trung ở frontend (để dễ dàng render theo `game_mode`).
3. Thực hiện phát triển tính năng đồng bộ luật chơi qua WebSocket.
