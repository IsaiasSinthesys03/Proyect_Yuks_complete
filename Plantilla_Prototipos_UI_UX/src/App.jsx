import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import StoreApp from './pages/store/StoreApp';
import AdminApp from './pages/admin/AdminApp';
import { bootstrapSession } from './lib/api';
import { connectRealtime, disconnectRealtime } from './lib/ws';

export default function App() {
  // Bootstrap de sesión (Fase 38): al montar, intenta restaurar la sesión desde
  // la cookie HttpOnly vía un silent refresh. Corre en background — NO bloquea el
  // render, así el diseño del prototipo sigue idéntico mientras se resuelve.
  useEffect(() => {
    bootstrapSession();
    // Fase 46: conexión de tiempo real (Social Proof público). Un solo socket
    // por pestaña; los componentes se suscriben con `onRealtimeEvent`.
    connectRealtime();
    return () => disconnectRealtime();
  }, []);

  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/*" element={<StoreApp />} />
    </Routes>
  );
}
