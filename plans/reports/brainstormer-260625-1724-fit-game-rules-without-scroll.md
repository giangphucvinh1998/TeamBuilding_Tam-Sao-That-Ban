# Brainstorm: Tối ưu hiển thị Luật chơi Game 2 & Game 3 không bị cuộn dọc

Chúng tôi đã phân tích yêu cầu tối ưu hóa phần hiển thị luật chơi của Game 2 và Game 3 trên màn hình Máy chiếu (Display Page). Hiện tại, do nội dung khá dài và được xếp trên một cột dọc dẫn đến tình trạng xuất hiện thanh cuộn (scroll). Phương án giải quyết là chuyển đổi sang bố cục hai cột (two-column layout), mở rộng chiều ngang của khung modal, và giảm các khoảng đệm (padding/margin) dư thừa.

---

## 🔍 Phân tích hiện trạng & Vấn đề

1. **Khung chứa modal hiện tại:**
   * Chiều ngang tối đa là `max-w-4xl` (khoảng 896px), khá hẹp trên màn hình trình chiếu 16:9.
   * Khoảng đệm bên ngoài khá lớn: `p-8 md:p-12`.
   * Khung chứa luật có `max-h-[60vh] overflow-y-auto` nên khi nội dung dài sẽ bị cuộn.
2. **Nội dung Game 2 (Giai điệu vượt ngàn):**
   * Có 4 điều khoản dài với nhiều gạch đầu dòng con (đặc biệt là mục 3 và 4), làm tăng đáng kể chiều cao.
3. **Nội dung Game 3 (Mật mã lặng thinh):**
   * Có 5 điều khoản chi tiết từ chuẩn bị đến cách tính điểm.
4. **Trải nghiệm người dùng:**
   * Khi trình chiếu trên máy chiếu hoặc màn hình lớn (TV), việc phải cuộn trang làm mất tính liền mạch và người xem ở xa khó bao quát toàn bộ luật chơi cùng lúc.

---

## 🛠️ Giải pháp Thiết kế & Kỹ thuật đề xuất

### 1. Nâng cấp Khung Modal luật chơi (`RulesOverlay`)
* **Mở rộng chiều ngang:** Tăng từ `max-w-4xl` lên `max-w-6xl` (1152px) hoặc `max-w-7xl` (1280px) để tận dụng toàn bộ diện tích màn hình ngang.
* **Giảm khoảng đệm:**
  * Giảm padding của modal từ `p-8 md:p-12` xuống `p-6 md:p-8`.
  * Giảm padding của hộp nội dung bên trong từ `p-6 md:p-8` xuống `p-4 md:p-6`.
  * Giảm margin-bottom của tiêu đề chính từ `mb-8` xuống `mb-4`.
  * Thay thế `max-h-[60vh] overflow-y-auto` bằng `overflow-visible` hoặc loại bỏ giới hạn chiều cao để nội dung hiển thị phẳng hoàn toàn.

### 2. Tái cấu trúc nội dung Luật chơi thành 2 cột (Grid Layout)

Chúng tôi sẽ sử dụng Grid của Tailwind CSS (`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8`) cho cả 3 Game:

#### **Game 1 (Mò kim bể chữ)**
* **Cột 1 (Quy trình chơi):**
  * 📵 **CẤT ĐIỆN THOẠI**
  * ⏱️ **SIÊU TỐC GHI NHỚ**
  * 🏃‍♂️ **TIẾP SỨC ĐỒNG ĐỘI**
* **Cột 2 (Phần thưởng & Điểm số):**
  * 🏆 **CÁCH TÍNH ĐIỂM:** Điểm số xếp hạng dựa trên số lượng từ khóa tìm được chính xác trên ma trận trống (Nhất, Nhì, Ba, Tư, Năm).

#### **Game 2 (Giai điệu vượt ngàn)**
* **Cột 1 (Luật chung & Lượt Live):**
  * 🎥 **HUMMING CA KHÚC:** Màn hình chiếu clip ngân nga giai điệu các bài hát từ BTC hai miền Bắc/Nam và nhân sự miền Trung.
  * 🎯 **ĐOÁN TÊN BÀI HÁT:** Các thành viên trong đội phối hợp đoán chính xác tên bài hát.
  * 🎤 **LƯỢT LIVE CUỐI (LIVE HUMMING):** 1 thành viên lên sân khấu ngân nga trực tiếp. Đoán đúng +20đ, đoán sai/bỏ qua không bị trừ.
* **Cột 2 (Vòng clip & Cách tính điểm chi tiết):**
  * ⏱️ **4 VÒNG CLIP QUAY SẴN (30S):** Đội thi có 15s trả lời. Đúng được +10đ. Sai nhận 1 gợi ý và thêm 10s suy nghĩ (Đúng sau gợi ý +5đ, sai -5đ hoặc bỏ qua không trừ). Nếu bỏ qua/sai sau gợi ý, quyền cướp điểm mở ra cho đội khác (Đúng +10đ, sai -5đ).

#### **Game 3 (Mật mã lặng thinh)**
* **Cột 1 (Đội hình & Diễn tả):**
  * 👥 **ĐỘI HÌNH THI ĐẤU:** Cử 4 thành viên lên sân khấu. MC đưa ra gợi ý trước (số lượng từ, chủ đề) trước khi bắt đầu.
  * ⏱️ **THẢO LUẬN NHỎ (30S):** 3 thành viên nhận mật mã và có 30 giây để thảo luận nhỏ.
  * 🚫 **DIỄN TẢ ĐỒNG ĐỘI (30S):** Có 30 giây để 3 thành viên diễn tả bằng cử chỉ/body language cho thành viên cuối cùng (không nói, không khẩu hình, không viết chữ).
* **Cột 2 (Đáp án & Điểm số):**
  * 🗣️ **ĐƯA RA ĐÁP ÁN (10S):** Thành viên đoán có đúng 10 giây để trả lời. Người đoán sẽ xoay vòng qua 4 câu hỏi - tương ứng 4 thành viên.
  * 🏆 **CÁCH TÍNH ĐIỂM & CƯỚP ĐIỂM:** Trả lời đúng nhận 10 điểm. Nếu sai, các đội khác có quyền cướp điểm (Đúng +10đ, sai bị trừ 5đ).

---

## 📋 Đánh giá Rủi ro & Lưu ý
* **Độ tương thích thiết bị:** Trên các thiết bị di động nhỏ (MC cầm iPad/điện thoại xem luật chơi), layout sẽ tự động xếp chồng về 1 column nhờ vào class `grid-cols-1 lg:grid-cols-2`, đảm bảo không bị vỡ giao diện.
* **Cỡ chữ:** Giữ nguyên hoặc giảm nhẹ cỡ chữ để nội dung trông gọn gàng và vừa vặn nhất.

---

## 🚀 Bước tiếp theo
Tôi đã sẵn sàng chuẩn bị Kế hoạch triển khai chi tiết cho việc tối ưu hóa giao diện luật chơi này. Bạn có muốn xem và phê duyệt kế hoạch triển khai không?
