# Brainstorm: Bổ sung Button Ẩn/Hiện Ảnh Phát Biểu Toàn Màn Hình

## 1. Yêu Cầu & Bối Cảnh (Problem Statement)
* **Mục tiêu**: Thêm nút điều khiển trên trang Admin để Bật/Tắt một hình ảnh phát biểu toàn màn hình (`back-phat-bieu.jpg`) trên màn hình Máy chiếu (Display Page).
* **Cơ chế hoạt động**: Hoạt động tương tự nút **Bật/Tắt Intro** hiện tại (sử dụng WebSocket sync trạng thái `show_speech`).
* **Vấn đề kỹ thuật đặc biệt**: File ảnh gốc `back-phat-bieu.jpg` hiện tại có kích thước cực lớn (~24.1 MB). Việc tải trực tiếp một file 24MB lên trình duyệt máy chiếu mỗi khi bật/tắt sẽ gây hiện tượng lag, màn hình đen tạm thời hoặc giật khung hình do độ trễ truyền tải dữ liệu lớn qua mạng cục bộ.

---

## 2. Các Phương Án Giải Quyết (Evaluated Approaches)

### Phương Án A: Import và hiển thị trực tiếp ảnh gốc 24MB
* **Cách thực hiện**: Import `back-phat-bieu.jpg` trong `DisplayPage.tsx` và render trong một thẻ `<img>` phủ toàn màn hình (`fixed inset-0 z-50 bg-black`).
* **Ưu điểm**: Không cần xử lý ảnh trước, code cực kỳ nhanh gọn.
* **Nhược điểm**: 
  * Tải chậm (tốn 2-5 giây tùy tốc độ mạng LAN).
  * Tiêu thụ bộ nhớ trình duyệt lớn, có nguy cơ gây đơ trang Display nếu máy tính cấu hình yếu.
  * Trải nghiệm người dùng kém (ảnh xuất hiện chậm hoặc load từng phần).

### Phương Án B: Nén và Tối ưu hóa ảnh trước khi hiển thị (Khuyên dùng)
* **Cách thực hiện**: Nén ảnh gốc `back-phat-bieu.jpg` từ 24.1MB xuống còn khoảng 800KB - 1.5MB dưới định dạng WebP hoặc Progressive JPEG chất lượng cao mà không làm giảm đáng kể độ sắc nét khi hiển thị trên màn hình chiếu Full HD / 4K.
* **Ưu điểm**:
  * Ảnh tải tức thì (gần như không có độ trễ).
  * Chuyển cảnh mượt mà, đồng bộ trạng thái cực nhanh giữa Admin và Display.
  * Tiết kiệm băng thông và bộ nhớ.
* **Nhược điểm**: Cần thực hiện bước nén ảnh trước khi code hoặc chạy một script tối ưu hóa.

---

## 3. Giải Pháp Đề Xuất (Recommended Solution)
Kết hợp **Phương án B** với luồng đồng bộ WebSocket hiện có của hệ thống:

### Bước 1: Tối ưu hóa ảnh
* Nén ảnh `back-phat-bieu.jpg` xuống định dạng WebP hoặc JPEG nén cao (ví dụ: kích thước tối đa 2560px chiều ngang, dung lượng < 1.5 MB).

### Bước 2: Cấu trúc Backend
* Bổ sung thuộc tính `show_speech: bool = False` vào lớp `GameStateMachine` trong [game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/game_state.py).
* Cập nhật hàm `get_full_state()` trong `game_state.py`, [humming_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/humming_game_state.py), và [matrix_game_state.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/matrix_game_state.py) để trả về giá trị `show_speech` cho frontend.
* Thêm route POST `/api/game/toggle-speech` trong [game.py](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/backend/routers/game.py) để đảo trạng thái biến `show_speech` và broadcast cho các client qua WebSocket.

### Bước 3: Giao Diện Admin
* Thêm nút `🎤 CHIẾU PHÁT BIỂU` bên cạnh nút `📺 BẬT INTRO` và `📊 HIỂN THỊ ĐIỂM` trong header của [AdminPage.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/pages/AdminPage.tsx).
* Giao diện nút sẽ thay đổi màu sắc linh hoạt (ví dụ: chuyển sang màu indigo nhấp nháy khi đang chiếu ảnh phát biểu).

### Bước 4: Giao Diện Trình Chiếu (Display Page)
* Trong [DisplayPage.tsx](file:///Users/macintoshhd/VNPT_Project/TeamBuilding_Tam-Sao-That-Ban/frontend/src/pages/DisplayPage.tsx), khi `gameState?.show_speech` bằng `true`, hiển thị một lớp overlay phủ lên toàn bộ giao diện:
```tsx
{gameState?.show_speech && (
  <div className="fixed inset-0 z-45 bg-black flex items-center justify-center pointer-events-none">
    <img src={backPhatBieu} className="w-full h-full object-cover animate-fade-in" alt="Speech Screen" />
  </div>
)}
```
* **Lưu ý Thứ Tự Lớp (Z-Index)**:
  * Đặt z-index của ảnh phát biểu thấp hơn Intro Video (`z-50`) nhưng cao hơn giao diện chính (`z-45`). Điều này đảm bảo nếu MC bật Intro thì Intro vẫn đè lên trên ảnh phát biểu.

---

## 4. Rủi ro & Lưu ý bổ sung
* **Xung đột nút bấm**: Nếu MC vô tình bật cả Intro và Ảnh phát biểu, ảnh phát biểu sẽ bị che mất bởi Intro Video (nếu z-index Intro cao hơn). Ta có thể giải quyết đơn giản bằng cách tự động tắt trạng thái đối lập khi bật trạng thái kia (ví dụ bật Intro thì tắt Speech và ngược lại) hoặc giữ nguyên phân cấp z-index và hướng dẫn MC sử dụng.
* **Tải trước ảnh (Preloading)**: Để tối ưu tuyệt đối, trình duyệt Display Page có thể tải trước ảnh này trong bộ nhớ để khi nhấn nút show, ảnh hiện ra ngay lập tức mà không phải chờ render.

---

## 5. Các bước tiếp theo (Next Steps)
1. Thống nhất lựa chọn nén ảnh tự động hoặc thủ công.
2. Thiết lập cấu trúc dữ liệu `show_speech` trên Backend.
3. Tạo API endpoint và tích hợp nút bấm trên Admin Panel.
4. Tích hợp màn hiển thị ảnh trên Display Page.
