import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Board } from './pages/Board';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Usa il componente Board appena creato */}
        <Route path="/" element={<Board />} />
        
        {/* 2. AGGIUNGI LA NUOVA ROTTA DASHBOARD QUI */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* La rotta con l'asterisco (catch-all) deve stare sempre alla fine */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;