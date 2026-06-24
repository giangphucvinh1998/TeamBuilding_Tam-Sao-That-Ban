import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '@/lib/websocket';
import { api } from '@/lib/api';
import SessionManager from '@/components/admin/SessionManager';
import TeamManager from '@/components/admin/TeamManager';
import KeywordManager from '@/components/admin/KeywordManager';
import SongManager from '@/components/admin/SongManager';
import GameController from '@/components/admin/GameController';
import HummingController from '@/components/admin/HummingController';
import MatrixController from '@/components/admin/MatrixController';

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'teams' | 'keywords' | 'songs' | 'settings'>('control');
  const [controlMode, setControlMode] = useState<'TAM_SAO' | 'HUMMING' | 'MATRIX'>('TAM_SAO');
  const { gameState } = useWebSocket('admin');

  const toggleIntro = async () => {
    try {
      await api.post('/game/toggle-intro', {});
    } catch (e) {
      console.error(e);
    }
  };

  // Simple auth check - just checking if we arrived here, we assume PIN was ok
  // In a real app we'd use a token or context
  useEffect(() => {
    const isAuth = sessionStorage.getItem('admin_auth');
    if (!isAuth && import.meta.env.PROD) { // Only enforce in prod to speed up dev
      // navigate('/admin/pin');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 text-foreground">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black text-purple-700 tracking-tight">ĐTKĐĐ - ADMIN PANEL</h1>
            {activeSession && (
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {activeSession.name}
              </div>
            )}
            <button 
              onClick={toggleIntro}
              className={`ml-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all border-2 ${gameState?.show_intro ? 'bg-red-50 text-red-600 border-red-500 animate-pulse' : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'}`}
              title="Bật/Tắt video Intro toàn màn hình trên máy chiếu"
            >
              📺 {gameState?.show_intro ? 'ĐANG PHÁT INTRO' : 'BẬT INTRO'}
            </button>
          </div>
          
          <nav className="flex gap-1">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'control' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('control')}
            >
              Điều Khiển
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'teams' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('teams')}
            >
              Đội Chơi
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'keywords' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('keywords')}
            >
              Từ Khóa (TSTB)
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'songs' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('songs')}
            >
              Bài Hát (Ngân Nga)
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'}`}
              onClick={() => setActiveTab('settings')}
            >
              Hệ Thống
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {!activeSession && activeTab !== 'settings' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6 flex justify-between items-center">
            <div>
              <strong className="font-bold">Chưa có phiên làm việc nào!</strong>
              <p>Vui lòng qua tab Hệ Thống để kích hoạt hoặc tạo phiên chơi mới.</p>
            </div>
            <button className="px-4 py-2 bg-yellow-500 text-white rounded font-medium" onClick={() => setActiveTab('settings')}>Tới Hệ Thống</button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'control' && activeSession && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white p-2 rounded-lg shadow-sm border mb-4 flex gap-2">
                  <button 
                    onClick={() => setControlMode('TAM_SAO')}
                    className={`flex-1 py-2 font-bold rounded ${controlMode === 'TAM_SAO' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    TAM SAO THẤT BẢN
                  </button>
                  <button 
                    onClick={() => setControlMode('HUMMING')}
                    className={`flex-1 py-2 font-bold rounded ${controlMode === 'HUMMING' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    GIAI ĐIỆU NGÂN NGA
                  </button>
                  <button 
                    onClick={() => setControlMode('MATRIX')}
                    className={`flex-1 py-2 font-bold rounded ${controlMode === 'MATRIX' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    MÒ KIM BỂ CHỮ
                  </button>
                </div>
                {controlMode === 'TAM_SAO' ? (
                  <GameController sessionId={activeSession?.id} gameState={gameState} />
                ) : controlMode === 'HUMMING' ? (
                  <HummingController sessionId={activeSession?.id} gameState={gameState} />
                ) : (
                  <MatrixController sessionId={activeSession?.id} gameState={gameState} />
                )}
              </div>
              <div className="lg:col-span-1 space-y-6">
                 {/* Mini Scoreboard could go here */}
                 <div className="p-4 border rounded-lg bg-card shadow-sm">
                    <h3 className="font-bold text-lg mb-2">Bảng Điểm Nhanh</h3>
                    <p className="text-sm text-gray-500">Xem điểm nhanh để điều phối trò chơi.</p>
                    <TeamManager sessionId={activeSession?.id} />
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'teams' && activeSession && (
            <TeamManager sessionId={activeSession?.id} />
          )}

          {activeTab === 'keywords' && activeSession && (
            <KeywordManager sessionId={activeSession?.id} />
          )}

          {activeTab === 'songs' && activeSession && (
            <SongManager sessionId={activeSession?.id} />
          )}

          {activeTab === 'settings' && (
            <SessionManager activeSession={activeSession} setActiveSession={setActiveSession} />
          )}
        </div>

      </main>
    </div>
  );
}
