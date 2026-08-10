import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Board } from './pages/Board';

// Un componente segnaposto temporaneo per la nostra Board
const BoardPlaceholder = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>🚀 BugBoard26</h1>
    <p>Se vedi questa pagina, il login ha funzionato!</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Usa il componente Board appena creato */}
        <Route path="/" element={<Board />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;