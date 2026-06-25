# Brainstorm: Tự động lọc từ khóa theo Đội được chọn trong game Mật Mã Lặng Thinh

Tài liệu này đề xuất phương án cải tiến giao diện quản trị Admin để tự động lọc và hiển thị danh sách câu hỏi tương ứng với từng Đội khi MC lựa chọn Đội thi đấu.

---

## 1. Ý tưởng cải tiến
- Khi MC/BTC chọn Đội thi đấu (ví dụ: `XANH BIỂN`), danh sách từ khóa bên cột phải sẽ tự động lọc và chỉ hiển thị đúng 4 câu hỏi thuộc về đội đó.
- Việc này giúp giao diện gọn gàng, MC không cần tự tìm câu hỏi trong danh sách dài và hoàn toàn loại bỏ rủi ro chọn nhầm câu hỏi của đội khác.

---

## 2. Giải pháp thực hiện

### A. Dữ liệu từ khóa mặc định (Database Seeding)
Chúng ta sẽ tự động chèn 20 câu hỏi mặc định của 5 đội với cấu trúc:
- **`keyword`**: Từ khóa chính (ví dụ: `Ngủ gật`).
- **`answer`**: Đáp án chứa tag tên đội làm định danh lọc (ví dụ: `[Xanh biển] trạng thái của con người`).
- **`hint`**: Gợi ý không có tag tên đội để hiển thị lên màn hình Display (ví dụ: `trạng thái của con người`).

### B. Logic lọc tại Frontend ([GameController.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/admin/GameController.tsx))
Khi hiển thị danh sách từ khóa:
1. Xác định tên đội đang được chọn:
   ```typescript
   const selectedTeam = teams?.find(t => t.id === selectedTeamId);
   const selectedTeamName = selectedTeam ? selectedTeam.name : '';
   ```
2. Thực hiện lọc danh sách `keywords` trước khi map ra các nút bấm:
   ```typescript
   const filteredKeywords = keywords.filter(k => {
     if (!selectedTeamName) return true; // Nếu chưa chọn đội, hiển thị tất cả
     
     // Kiểm tra xem từ khóa này có gắn tag tên đội nào không
     const hasTag = k.answer.startsWith('[') && k.answer.includes(']');
     if (!hasTag) return true; // Từ khóa tự do (không có tag) thì luôn hiển thị
     
     // Chỉ hiển thị từ khóa có tag trùng với tên đội đang chọn
     return k.answer.toUpperCase().includes(`[${selectedTeamName.toUpperCase()}]`);
   });
   ```
3. Ở màn hình Display Page, khi hiển thị gợi ý (`current_hint`), ta sẽ lấy giá trị sạch (không chứa tag đội) từ database.

---

## 3. Kế hoạch xác thực (Verification Plan)
1. **Kiểm tra lọc trên Admin Page:**
   * Chọn đội `TIM TÍM`. Đảm bảo danh sách cột bên phải chỉ hiển thị đúng 4 câu hỏi có mô tả bắt đầu bằng `[Tim tím]`.
   * Đổi sang đội `ĐO ĐỎ`. Danh sách câu hỏi chuyển sang 4 câu hỏi của đội `ĐO ĐỎ`.
2. **Kiểm tra hiển thị Display Page:**
   * Bấm bắt đầu lượt chơi, mở gợi ý. Đảm bảo màn hình Display chỉ hiển thị chữ `"trạng thái của con người"` mà không chứa tiền tố `[Đội...]`.
