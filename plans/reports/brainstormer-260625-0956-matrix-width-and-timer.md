# Brainstorm: Tăng kích thước ma trận chữ & Thiết kế lại bộ đếm thời gian game Mò Kim Bể Chữ

Tài liệu này đề xuất phương án thiết kế giao diện rộng hơn cho ma trận chữ và bố cục mới cho bộ đếm thời gian (90 giây hiển thị ở giữa màn hình) trong game "Mò Kim Bể Chữ" (MATRIX).

---

## 1. Tăng kích thước ma trận chữ (Width & Cell Size)

### Phân tích hiện trạng:
- Ma trận hiện tại có kích thước container tối đa là `max-w-6xl` (1152px).
- Mỗi ô chữ có kích thước cố định là `w-24 h-24` (96px). Với 10 cột, tổng chiều rộng là khoảng 1032px.
- Kích thước này khiến các từ dài bị xuống dòng lỗi font (ví dụ: "Vinaphon\ne", "Compute\nr").

### Phương án nâng cấp:
1. **Tăng kích thước ô chữ:** Chuyển kích thước mỗi ô từ `w-24 h-24` lên `w-28 h-28` (112px) hoặc `w-32 h-32` (128px) để chữ hiển thị trên 1 dòng đẹp hơn.
2. **Nới rộng container:** Thay đổi container chứa ma trận từ `max-w-6xl` lên `max-w-7xl` (1280px) hoặc `max-w-[95vw]` để tận dụng tối đa chiều rộng màn hình máy chiếu/tablet.
3. **Giảm kích thước font chữ tương đối:** Nếu từ khóa quá dài, sử dụng size font nhỏ hơn hoặc `line-clamp-2` để chữ vừa vặn.

---

## 2. Thiết kế lại bộ đếm thời gian (Timer)

### Yêu cầu:
- Hiển thị tổng thời gian 1p30s (90 giây) chạy liên tục cho cả 3 giai đoạn (Phase 1: 30s, Phase 2: 30s, Phase 3: 30s).
- Định vị bộ đếm ở giữa màn hình.

### Cơ chế tính thời gian (90 giây không cần sửa Backend):
- Trong `PHASE_1`: `Thời gian còn lại = Thời gian còn lại của Phase 1 + 60s`.
- Trong `PHASE_2`: `Thời gian còn lại = Thời gian còn lại của Phase 2 + 30s`.
- Trong `PHASE_3`: `Thời gian còn lại = Thời gian còn lại của Phase 3`.

Công thức tính toán trong React:
```typescript
const getRemainingTime = () => {
  if (!timer) return 0;
  const elapsed = Date.now() / 1000 - timer.start_time;
  const rem = Math.max(0, timer.duration - elapsed);
  
  if (state === 'PHASE_1') return Math.ceil(rem + 60);
  if (state === 'PHASE_2') return Math.ceil(rem + 30);
  if (state === 'PHASE_3') return Math.ceil(rem);
  return 0;
};
```

### Phương án vị trí hiển thị (Bố cục):

#### Phương án 1: Hiển thị ở chính giữa phía trên ma trận (Top Center - Khuyên dùng)
- **Thiết kế:** Đặt bộ đếm thời gian ngay phía trên ma trận chữ, căn giữa theo chiều ngang.
- **Phong cách:** Một hộp bo tròn viền Neon tím/hồng, chữ số màu vàng nổi bật, font chữ Mono lớn.
- **Ưu điểm:** Cực kỳ trực quan, dễ quan sát từ xa và **không che mất chữ** trong ma trận.

#### Phương án 2: Hiển thị đè ở chính giữa màn hình (Center Overlay)
- **Thiết kế:** Bộ đếm thời gian dạng chữ số siêu lớn, bán trong suốt (opacity thấp, ví dụ `opacity-10`) nằm ẩn phía sau ma trận chữ (z-index thấp hơn ma trận nhưng căn chính giữa màn hình).
- **Ưu điểm:** Rất nghệ thuật và tạo cảm giác áp lực thời gian tốt.
- **Nhược điểm:** Có thể gây rối mắt nếu màu sắc và độ tương phản không được căn chỉnh hoàn hảo.

---

## 3. Kế hoạch xác thực (Verification Plan)

1. **Giao diện ma trận:** Mở Display Page, kiểm tra xem ma trận đã rộng ra chưa, các từ dài như "Vinaphone", "Computer" đã nằm trên 1 dòng chưa.
2. **Bộ đếm thời gian:**
   - Khi bấm bắt đầu game, bộ đếm hiển thị `90s` (hoặc `01:30`) ở vị trí trung tâm.
   - Kiểm tra xem thời gian có đếm ngược liên tục khi chuyển giao các giai đoạn 1 -> 2 -> 3 hay không.
   - Khi kết thúc giai đoạn 3, bộ đếm thời gian ẩn đi.
