export default function PinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Enter PIN</h2>
        <div className="space-y-4">
          <input 
            type="password" 
            className="w-full text-center text-2xl p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="****" 
            maxLength={4}
          />
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">
            Access Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}
