# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

# HỆ THỐNG WEB APP TƯƠNG TÁC TRÒ CHƠI TEAM BUILDING

## MODULE: ĐOÁN TỪ KHÓA ĐỒNG ĐỘI

**Version:** 1.0\
**Document Type:** Software Requirements Specification

------------------------------------------------------------------------

# 1. Giới thiệu

## 1.1. Mục đích tài liệu

Tài liệu mô tả yêu cầu chức năng và phi chức năng cho hệ thống web app
hỗ trợ vận hành trò chơi **Tam Sao Thất Bản**.

Hệ thống hỗ trợ Ban Tổ Chức (BTC) và MC:

-   Điều khiển toàn bộ quá trình chơi.
-   Quản lý đội thi.
-   Quản lý bộ câu hỏi.
-   Quản lý thời gian.
-   Ghi nhận điểm số.
-   Hiển thị thông tin tương tác lên màn hình trình chiếu.

------------------------------------------------------------------------

# 2. Phạm vi hệ thống

## 2.1. Mục tiêu

Hệ thống hỗ trợ:

-   Nhiều đội chơi trong cùng một phiên.
-   Điều khiển từng lượt thi.
-   Tính thời gian tự động.
-   Cập nhật điểm theo luật.
-   Đồng bộ màn hình BTC và màn hình trình chiếu.

## 2.2. Ngoài phạm vi

Không bao gồm:

-   Quản lý người tham gia.
-   Đăng ký sự kiện.
-   Livestream.
-   Thanh toán.

------------------------------------------------------------------------

# 3. Người dùng hệ thống

  Người dùng   Quyền
  ------------ --------------------
  Admin        Quản trị hệ thống
  BTC/MC       Điều hành trò chơi
  Display      Hiển thị sân khấu

------------------------------------------------------------------------

# 4. Quy tắc trò chơi

-   Mỗi đội có 06 lượt chơi.
-   Mỗi lượt có 01 từ khóa.
-   Từ khóa chọn ngẫu nhiên.
-   Mỗi câu đúng: 10 điểm.

Công thức thời gian:

    Thời gian thi = Số thành viên × 10 giây

Luồng:

    Chuẩn bị
     ↓
    Hiển thị từ khóa
     ↓
    15 giây chuẩn bị
     ↓
    Thi chính thức
     ↓
    Chốt đáp án
     ↓
    Đúng: +10 điểm
    Sai: mở gợi ý
     ↓
    Hỗ trợ / Cướp điểm
     ↓
    Kết thúc lượt

------------------------------------------------------------------------

# 5. Functional Requirements

## FR-01: Quản lý phiên chơi

BTC có thể:

-   Tạo phiên chơi.
-   Mở phiên.
-   Đóng phiên.
-   Reset phiên.

Thông tin:

-   Session ID
-   Tên chương trình
-   Danh sách đội
-   Trạng thái

------------------------------------------------------------------------

## FR-02: Quản lý đội chơi

Thông tin đội:

  Field          Ý nghĩa
  -------------- ---------------
  Team ID        Mã đội
  Team Name      Tên đội
  Member Count   Số thành viên
  Score          Điểm
  Order          Thứ tự

Chức năng:

-   Thêm đội.
-   Sửa đội.
-   Xóa đội.

------------------------------------------------------------------------

## FR-03: Quản lý từ khóa

Dữ liệu:

-   Keyword
-   Answer
-   Hint
-   Used Status

Quy tắc:

-   Random câu hỏi.
-   Không lặp trong session.

------------------------------------------------------------------------

## FR-04: Khởi tạo lượt chơi

Khi bắt đầu:

1.  Chọn đội.
2.  Chọn câu hỏi.
3.  Chuyển trạng thái:

```{=html}
<!-- -->
```
    READY

------------------------------------------------------------------------

## FR-05: Hiển thị từ khóa

Keyword chỉ hiển thị cho BTC.

Không hiển thị:

-   Màn hình trình chiếu.
-   Người chơi khác.

------------------------------------------------------------------------

## FR-06: Timer chuẩn bị

Giá trị:

    15 giây

Trạng thái:

    PREPARING

------------------------------------------------------------------------

## FR-07: Timer thi đấu

Công thức:

    memberCount × 10 giây

Trạng thái:

    PLAYING

------------------------------------------------------------------------

## FR-08: Chốt đáp án

Khi hết giờ:

-   Người chơi cuối cùng vẫn được trả lời.
-   MC đếm ngược 3-2-1.
-   BTC xác nhận kết quả.

Chỉ người cuối cùng có quyền trả lời.

------------------------------------------------------------------------

## FR-09: Tính điểm

  Tình huống          Điểm
  ----------------- ------
  Đúng lượt chính      +10
  Đúng sau hint         +5
  Cướp đúng             +5
  Sai                    0

------------------------------------------------------------------------

## FR-10: Gợi ý

Chỉ mở khi:

    Đáp án chính sai

BTC:

    SHOW_HINT

------------------------------------------------------------------------

## FR-11: Hỗ trợ đồng đội

Sau khi mở hint:

-   Đồng đội được trả lời.
-   Đúng: +5 điểm.
-   Sai: chuyển quyền.

------------------------------------------------------------------------

## FR-12: Cướp điểm

Đội khác được quyền trả lời.

Kết quả:

-   Đúng: +5 điểm.
-   Sai: 0 điểm.

------------------------------------------------------------------------

## FR-13: Màn hình trình chiếu

Hiển thị:

-   Đội đang chơi.
-   Timer.
-   Trạng thái.
-   Điểm.

Không hiển thị:

-   Keyword.
-   Answer.
-   Hint trước khi mở.

------------------------------------------------------------------------

## FR-14: Ranking

Hiển thị:

  Team     Score
  ------ -------

Cập nhật realtime.

------------------------------------------------------------------------

## FR-15: Lưu lịch sử

Lưu:

-   Session.
-   Team.
-   Question.
-   Result.
-   Score.
-   Timestamp.

------------------------------------------------------------------------

# 6. State Machine

    WAITING
     ↓
    READY
     ↓
    PREPARING
     ↓
    PLAYING
     ↓
    ANSWER_CONFIRM
     ↓
    HINT
     ↓
    STEAL
     ↓
    FINISHED

------------------------------------------------------------------------

# 7. Business Rules

## BR-01

Chỉ người chơi cuối cùng được trả lời.

## BR-02

Người chơi đầu tiên không được trả lời.

## BR-03

Hết giờ không kết thúc ngay.

Phải qua bước:

    ANSWER_CONFIRM

## BR-04

Chỉ mở hint sau khi xác nhận sai.

## BR-05

Một câu chỉ cộng điểm một lần.

------------------------------------------------------------------------

# 8. Non-functional Requirements

## Performance

-   Timer chính xác.
-   Update điểm nhanh.
-   Không lag khi trình chiếu.

## Availability

-   Lưu trạng thái session.
-   Khôi phục khi reload.

## UI/UX

-   Nút điều khiển lớn.
-   Ít thao tác.
-   Phù hợp sân khấu.

## Compatibility

Hỗ trợ:

-   Chrome
-   Edge
-   Firefox

------------------------------------------------------------------------

# 9. Tiêu chí nghiệm thu

-   Tạo session thành công.
-   Thêm đội chơi.
-   Random câu hỏi không trùng.
-   Timer chạy đúng.
-   Keyword được bảo mật.
-   Chỉ người cuối được trả lời.
-   Điểm cập nhật realtime.
-   Có hint và steal point.
-   Có bảng xếp hạng.
-   Lưu lịch sử.

------------------------------------------------------------------------

# End of Document
