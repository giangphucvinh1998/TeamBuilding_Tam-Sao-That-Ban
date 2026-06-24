import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAccess = () => {
    const validPin = import.meta.env.VITE_ADMIN_PIN || '1234';
    if (pin === validPin) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      navigate('/admin');
    } else {
      setError('Mã PIN không chính xác!');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Nhập mã PIN</h2>
        <div className="space-y-4">
          <input 
            type="password" 
            className="w-full text-center text-2xl p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="****" 
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAccess();
              }
            }}
          />
          {error && <p className="text-red-500 text-center">{error}</p>}
          <button 
            onClick={handleAccess}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Truy cập trang Quản trị
          </button>
        </div>
      </div>
    </div>
  );
}
