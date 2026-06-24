import { motion, AnimatePresence } from 'framer-motion';

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
            return (
              <motion.div 
                key={team.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                  isPlaying 
                    ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] scale-[1.02]' 
                    : 'bg-black/40 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className={`text-3xl font-black ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-700' : 'text-gray-600'}`}>
                    #{index + 1}
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {team.name}
                    {isPlaying && <span className="ml-3 text-sm px-2 py-1 bg-purple-500 text-white rounded uppercase animate-pulse">Đang thi</span>}
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
