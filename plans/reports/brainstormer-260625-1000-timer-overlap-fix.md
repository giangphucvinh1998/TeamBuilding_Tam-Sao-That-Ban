# Brainstorm: Khắc phục chồng lấn giữa bộ đếm thời gian và ma trận

Tài liệu này phân tích phương án khắc phục hiện tượng đồng hồ đếm thời gian đè lên viền trên của ma trận chữ.

---

## 1. Phân tích hiện trạng

- **Hiện tượng:** Qua ảnh chụp màn hình, viền bo tròn phía trên của ma trận chữ (`bg-white/10`) đang bị đè lên bởi góc dưới của hộp đồng hồ (`-top-20`).
- **Nguyên nhân:** Đồng hồ được căn chỉnh tuyệt đối (`absolute -top-20`) dựa trên mép trên của wrapper. Khi ma trận bắt đầu ngay sát mép trên của wrapper, hai phần tử này sẽ bị chồng lấn nhẹ.

---

## 2. Giải pháp khắc phục

Để tạo khoảng cách an toàn, thẩm mỹ giữa đồng hồ và ma trận mà không ảnh hưởng đến vị trí header của trang:

### Phương án: Thêm padding-top vào parent wrapper và căn chỉnh lại đồng hồ
1. **Thêm padding-top (`pt-16` hoặc `pt-12`) vào parent wrapper** trong [MatrixDisplay.tsx](file:///Users/vinhcuong/Dev/gala-game/frontend/src/components/display/MatrixDisplay.tsx):
   Điều này đẩy toàn bộ ma trận xuống dưới 48px - 64px, tạo ra một khoảng trống lý tưởng cho đồng hồ.
2. **Căn chỉnh lại vị trí tuyệt đối của đồng hồ:**
   Sử dụng `absolute top-0 -translate-y-1/2` hoặc `-top-10` để đồng hồ nằm ngay ngắn trong khoảng trống vừa tạo, đảm bảo không chạm vào header ở phía trên và không đè lên ma trận ở phía dưới.

---

## 3. Kế hoạch xác thực (Verification Plan)

1. **Khởi chạy & Tương tác:** Bật game Matrix.
2. **Quan sát trực quan:** Kiểm tra xem viền trên của ma trận chữ và hộp đồng hồ có khoảng trống tối thiểu 20px-30px hay không, đảm bảo không có bất kỳ điểm chồng lấn nào.
