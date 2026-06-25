import { motion, AnimatePresence } from 'framer-motion';

interface ColorTheme {
  text: string;
  bg: string;
  border: string;
  glow: string;
  isPlayingBg: string;
  isPlayingBorder: string;
}

const TEAM_THEMES: Record<string, ColorTheme> = {
  'XANH BIỂN': {
    text: 'text-blue-400',
    bg: 'bg-blue-950/20',
    border: 'border-blue-900/40',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
    isPlayingBg: 'bg-blue-900/40',
    isPlayingBorder: 'border-blue-500'
  },
  'XANH NGỌC': {
    text: 'text-cyan-400',
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-900/40',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    isPlayingBg: 'bg-cyan-900/40',
    isPlayingBorder: 'border-cyan-500'
  },
  'XANH LÁ': {
    text: 'text-green-400',
    bg: 'bg-green-950/20',
    border: 'border-green-900/40',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    isPlayingBg: 'bg-green-900/40',
    isPlayingBorder: 'border-green-500'
  },
  'TIM TÍM': {
    text: 'text-purple-400',
    bg: 'bg-purple-950/20',
    border: 'border-purple-900/40',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    isPlayingBg: 'bg-purple-900/40',
    isPlayingBorder: 'border-purple-500'
  },
  'ĐO ĐỎ': {
    text: 'text-red-400',
    bg: 'bg-red-950/20',
    border: 'border-red-900/40',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    isPlayingBg: 'bg-red-900/40',
    isPlayingBorder: 'border-red-500'
  }
};

const DEFAULT_THEME: ColorTheme = {
  text: 'text-white',
  bg: 'bg-black/40',
  border: 'border-gray-800',
  glow: 'shadow-[0_0_15px_rgba(168,85,247,0.4)]',
  isPlayingBg: 'bg-purple-900/40',
  isPlayingBorder: 'border-purple-500'
};

export default function Scoreboard({ teams, currentTeamId }: { teams: any[], currentTeamId?: string }) {
  // Sort teams by score descending
  const sortedTeams = [...(teams || [])].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mt-12 bg-gray-900/50 backdrop-blur-md rounded-2xl border border-gray-800 p-8 shadow-2xl">
      <h2 className="text-3xl font-black text-center uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
        BẢNG XẾP HẠNG
      </h2>
      
      <div className="space-y-4">
        <AnimatePresence>
          {sortedTeams.map((team, index) => {
            const isPlaying = team.id === currentTeamId;
            const theme = TEAM_THEMES[team.name.trim().toUpperCase()] || DEFAULT_THEME;
            
            const bgClass = isPlaying ? theme.isPlayingBg : theme.bg;
            const borderClass = isPlaying ? theme.isPlayingBorder : theme.border;
            const shadowClass = isPlaying ? `${theme.glow} scale-[1.02] ring-2 ring-white/10` : 'opacity-80';

            return (
              <motion.div 
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${bgClass} ${borderClass} ${shadowClass}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`text-3xl font-black ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                    #{index + 1}
                  </div>
                  <div className={`text-2xl font-bold ${theme.text}`}>
                    {team.name}
                    {isPlaying && <span className="ml-3 text-sm px-2 py-1 bg-white/20 text-white rounded uppercase animate-pulse">Đang thi</span>}
                  </div>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
                  {team.score}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
