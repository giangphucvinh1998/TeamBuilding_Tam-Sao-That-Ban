import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function TeamManager({ sessionId }: { sessionId: string }) {
  const [teams, setTeams] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [memberCount, setMemberCount] = useState(5);

  const fetchTeams = async () => {
    try {
      const data = await api.get(`/sessions/${sessionId}/teams`);
      setTeams(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (sessionId) fetchTeams();
  }, [sessionId]);

  const addTeam = async () => {
    if (!teamName.trim()) return;
    try {
      await api.post(`/sessions/${sessionId}/teams`, { name: teamName, member_count: memberCount });
      setTeamName('');
      setMemberCount(5);
      fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Chắc chắn xóa?')) return;
    try {
      await api.delete(`/teams/${id}`);
      fetchTeams();
    } catch (e) {
      console.error(e);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
      <h2 className="text-xl font-bold mb-4">Quản Lý Đội Chơi</h2>
      
      <div className="flex gap-2 mb-4">
        <input 
          className="flex-1 p-2 border rounded" 
          placeholder="Tên đội..." 
          value={teamName} 
          onChange={(e) => setTeamName(e.target.value)} 
        />
        <input 
          type="number" 
          className="w-24 p-2 border rounded" 
          title="Số thành viên"
          value={memberCount} 
          onChange={(e) => setMemberCount(parseInt(e.target.value) || 0)} 
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded font-medium" onClick={addTeam}>
          Thêm Đội
        </button>
      </div>

      <div className="space-y-2">
        {teams.map(t => (
          <div key={t.id} className="flex justify-between items-center p-3 border rounded bg-white">
            <div>
              <div className="font-medium text-lg">{t.name}</div>
              <div className="text-sm text-gray-500">
                Thành viên: {t.member_count} (=&gt; {t.member_count * 10}s) | Điểm: <strong className="text-blue-600">{t.score}</strong>
              </div>
            </div>
            <button 
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
              onClick={() => deleteTeam(t.id)}
            >
              Xóa
            </button>
          </div>
        ))}
        {teams.length === 0 && <div className="text-center text-gray-500 py-4">Chưa có đội nào</div>}
      </div>
    </div>
  );
}
