# TeamBuilding - Đoán Từ Khóa Đồng Đội (Tam Sao Thất Bản)

Hệ thống điều khiển và trình chiếu trò chơi "Đoán Từ Khóa Đồng Đội", phát triển theo cấu trúc chia tách **Frontend (React/Vite)** và **Backend (FastAPI)**.

## 🚀 Tính năng nổi bật
- Quản lý phiên chơi duy nhất (Single Session), thiết lập danh sách các đội tham gia.
- Bảng điều khiển (Admin Panel) trực quan dành cho MC/BTC: bốc từ khóa thủ công hoặc tự động, điều khiển vòng chơi, tính điểm theo thời gian thực.
- Màn hình Trình chiếu (Display Page) cho người chơi và khán giả với giao diện thiết kế theo phong cách hiện đại (Neon/Glassmorphism).
- Đồng bộ trạng thái tức thì giữa Admin và Display qua WebSocket (độ trễ <100ms).
- Upload và hiển thị Hình Ảnh Gợi Ý lớn trên màn hình chính hỗ trợ quá trình chơi.
- Quản lý và Import/Export danh sách từ khóa nhanh gọn từ file CSV.

## 🛠️ Công nghệ sử dụng
- **Backend:** Python 3, FastAPI, SQLite (aiosqlite), Uvicorn, WebSockets.
- **Frontend:** React 18, Vite, TypeScript, TailwindCSS v4.
- **Data/Sync:** State-machine qua WebSocket, REST APIs cho CRUD.

## 📦 Cài đặt và khởi chạy

### 1. Backend (FastAPI)
Yêu cầu: Python 3.10+
```bash
cd backend
python3 -m venv venv
# Active venv (Windows)
.\venv\Scripts\activate
# Active venv (Mac/Linux)
source venv/bin/activate

pip3 install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
API Documentation: `http://localhost:8000/docs`

### 2. Frontend (React)
Yêu cầu: Node.js 18+
```bash
cd frontend
npm install
npm run dev
```
Truy cập ứng dụng:
- Bảng Điều Khiển: `http://localhost:5173/admin`
- Màn Hình Chiếu: `http://localhost:5173/display`

*(Host đã được cấu hình proxy từ `/api`, `/ws`, và `/uploads` qua port 8000 của Backend).*

## ⚙️ Luồng hoạt động cơ bản (Game Flow)
1. **WAITING:** MC chờ ở màn hình khởi động. Chọn một Đội thi và một Từ khóa chưa sử dụng.
2. **READY:** Sẵn sàng bước vào câu hỏi.
3. **PREPARING:** Chạy đồng hồ 15 giây đếm ngược để đội chuẩn bị bước ra sân khấu.
4. **PLAYING:** Chạy đồng hồ thi đấu chính (số lượng thành viên × 10 giây). 
5. **ANSWER_CONFIRM:** Hết giờ thi đấu, MC xác nhận đáp án chính đúng hay sai.
6. **HINT (Gợi ý):** Nếu sai, hiển thị ảnh gợi ý và gợi ý bằng chữ. Đồng đội trợ giúp trả lời.
7. **STEAL (Cướp điểm):** Nếu vẫn sai, quyền trả lời chuyển sang cho các đội còn lại cướp điểm.
8. **FINISHED:** Vòng chơi kết thúc, cộng điểm, sau đó reset về WAITING để chọn đội tiếp theo.

## 📄 License
Internal VNPT Project.
