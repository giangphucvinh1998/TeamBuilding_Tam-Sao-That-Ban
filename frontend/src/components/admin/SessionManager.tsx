import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SessionManager({ activeSession, setActiveSession }: { activeSession: any, setActiveSession: (s: any) => void }) {
  const [hasData, setHasData] = useState(false);
  
  const fetchSession = async () => {
    try {
      const data = await api.get('/sessions');
      setHasData(data.length > 0);
      const active = data.find((s: any) => s.status === 'ACTIVE');
      if (active) {
        setActiveSession(active);
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const startSystem = async () => {
    try {
      const data = await api.get('/sessions');
      if (data.length > 0) {
        // Resume existing session
        await api.put(`/sessions/${data[0].id}/status`, { status: 'ACTIVE' });
      } else {
        // Create a default session
        const newSession = await api.post('/sessions', { name: "Sự Kiện Chính", pin: '1234', rounds_per_team: 6 });
        await api.put(`/sessions/${newSession.id}/status`, { status: 'ACTIVE' });
      }
      fetchSession();
    } catch (e) {
      console.error(e);
    }
  };

  const pauseSystem = async () => {
    if (!confirm('Bạn có chắc muốn kết thúc sự kiện? Toàn bộ ĐIỂM SỐ và TIẾN TRÌNH sẽ bị reset về 0 (danh sách Đội và Từ Khóa vẫn được giữ lại).')) return;
    try {
      if (activeSession) {
        await api.post(`/sessions/${activeSession.id}/reset`, {});
        await api.put(`/sessions/${activeSession.id}/status`, { status: 'CLOSED' });
      }
      setActiveSession(null);
      fetchSession();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteSystem = async () => {
    if (!confirm('CẢNH BÁO: Toàn bộ danh sách Đội, Từ Khóa và Điểm số sẽ bị XÓA SẠCH vĩnh viễn. Bạn có chắc chắn?')) return;
    try {
      const data = await api.get('/sessions');
      for (const s of data) {
         await api.delete(`/sessions/${s.id}`);
      }
      setActiveSession(null);
      fetchSession();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 border rounded-lg bg-card shadow-sm text-center">
      <h2 className="text-3xl font-black text-purple-700 mb-6">Trạng Thái Hệ Thống</h2>
      
      {activeSession ? (
        <div className="space-y-6 max-w-md mx-auto">
          <div className="p-6 bg-green-100 border border-green-300 text-green-800 rounded-lg text-2xl font-bold shadow-inner">
            <span className="inline-block w-4 h-4 bg-green-500 rounded-full animate-pulse mr-3"></span>
            HỆ THỐNG ĐANG CHẠY
          </div>
          <p className="text-gray-600 text-lg">Bạn có thể chuyển qua tab Đội Chơi và Từ Khóa để bắt đầu thiết lập dữ liệu cho sự kiện.</p>
          
          <div className="flex flex-col gap-4 mt-8">
            <button 
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xl transition-colors shadow-lg" 
              onClick={pauseSystem}
            >
              KẾT THÚC VÀ RESET ĐIỂM SỐ
            </button>
            <button 
              className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-lg transition-colors shadow-lg" 
              onClick={deleteSystem}
            >
              XÓA SẠCH TOÀN BỘ DỮ LIỆU
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-md mx-auto">
           <div className="p-6 bg-gray-100 border border-gray-300 text-gray-500 rounded-lg text-2xl font-bold shadow-inner">
            HỆ THỐNG ĐANG TẮT
          </div>
          <p className="text-gray-600 text-lg">Nhấn nút bên dưới để khởi động sự kiện.</p>
          
          <div className="flex flex-col gap-4 mt-8">
            <button 
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xl transition-colors shadow-lg" 
              onClick={startSystem}
            >
              {hasData ? 'TIẾP TỤC SỰ KIỆN ĐANG DANG DỞ' : 'KHỞI ĐỘNG HỆ THỐNG MỚI'}
            </button>
            
            {hasData && (
              <button 
                className="w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-lg transition-colors shadow-lg" 
                onClick={deleteSystem}
              >
                XÓA DỮ LIỆU CŨ TẠO LẠI TỪ ĐẦU
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
