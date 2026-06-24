import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import DisplayPage from './pages/DisplayPage';
import PinPage from './pages/PinPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/pin" element={<PinPage />} />
        <Route path="/display" element={<DisplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
