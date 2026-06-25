# Brainstorm: Tự động khởi tạo đề thi & Gợi ý mặc định cho game Mật Mã Lặng Thinh

Tài liệu này ghi nhận và phân tích các phương án bổ sung đề thi và gợi ý mặc định tương ứng với các đội chơi trong game Mật Mã Lặng Thinh.

---

## 1. Yêu cầu chi tiết
Bổ sung danh sách 20 đề thi mặc định chia theo 5 đội chơi, mỗi đội gồm 4 từ khóa có độ dài khác nhau (2 từ khóa dài 2 từ, 2 từ khóa dài 4 từ) kèm gợi ý trong dấu ngoặc đơn:

1. **Đội Xanh biển:**
   * Ngủ gật (trạng thái của con người)
   * Khủng long (loài động vật)
   * Uống nước nhớ nguồn (biết ơn tổ tiên)
   * Ném đá giấu tay (hãm hại người khác)
2. **Đội Xanh ngọc:**
   * Vỗ tay (hành động của con người)
   * Sóng thần (hiện tượng tự nhiên)
   * Giận cá chém thớt (trút cơn bực tức)
   * Cưỡi ngựa xem hoa (hời hợt, qua loa)
3. **Đội Xanh lá:**
   * Ôm nhau (hành động của con người)
   * Xe tăng (phương tiện)
   * Chân lấm tay bùn (vất vả cực nhọc)
   * Tre già măng mọc (quy luật thế hệ)
4. **Đội Tim tím:**
   * Chạy bộ (hành động của con người)
   * Động đất (hiện tượng tự nhiên)
   * Cá lớn nuốt cá bé (quy luật mạnh yếu)
   * Nước chảy đá mòn (kiên trì, nhẫn nại)
5. **Đội Đo đỏ:**
   * Khóc lóc (hành động của con người)
   * Tàu ngầm (phương tiện)
   * Một vốn bốn lời (đầu tư, kinh doanh)
   * Há miệng chờ sung (lười biếng, thụ động)

---

## 2. Giải pháp kỹ thuật

### Tự động seed từ khóa mặc định (Backend)
Tương tự cơ chế tự động tạo đội chơi, chúng ta sẽ tự động chèn 20 từ khóa mặc định này vào SQLite khi danh sách từ khóa của phiên chơi được tải nhưng đang trống:
- **Tập tin cần sửa:** [keywords.py](file:///Users/vinhcuong/Dev/gala-game/backend/routers/keywords.py) (hàm `list_keywords`).
- **Gắn thẻ phân biệt đội:**
  - Vì bảng `keywords` trong database không có cột liên kết trực tiếp với Đội (do người điều hành chọn tự do), để MC dễ dàng chọn đúng câu hỏi của từng đội, ta sẽ thêm tiền tố tên đội vào trường `answer` hiển thị trên Admin Panel (ví dụ: `[Xanh biển] trạng thái của con người`).
  - Giao diện Display Page hiển thị trường `keyword` chính (ví dụ: `Ngủ gật`) và trường `hint` gợi ý (ví dụ: `Gợi ý (Đội Xanh biển): trạng thái của con người`) nên sẽ không bị ảnh hưởng xấu về mặt thẩm mỹ.

---

## 3. Kế hoạch xác thực (Verification Plan)
1. **Kiểm tra tự động chèn:** Tạo một session mới trên trang quản trị, truy cập tab "Từ Khóa (MMLT)".
2. **Xác nhận số lượng:** Kiểm tra xem 20 từ khóa mặc định đã được tạo chính xác hay chưa.
3. **Xác nhận nhãn hiển thị:** Đảm bảo trường đáp án trên giao diện Admin hiển thị rõ tiền tố đội như `[Xanh biển]`, `[Xanh ngọc]`,... giúp MC dễ chọn lựa.
