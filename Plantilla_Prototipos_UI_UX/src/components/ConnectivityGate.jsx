import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Loader2, RefreshCw, ServerCrash, WifiOff } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const HEALTH_URL = `${API_URL}/api/health`;
const POLL_INTERVAL_MS = 15_000;

export function ConnectivityGate({ children }) {
  const [status, setStatus] = useState('checking');
  const [detail, setDetail] = useState('');
  const checkingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      setDetail('');
      return;
    }
    if (checkingRef.current) return;

    checkingRef.current = true;
    setStatus((current) => current === 'ready' ? current : 'checking');
    try {
      const response = await axios.get(HEALTH_URL, {
        timeout: 5_000,
        withCredentials: false,
        headers: { Accept: 'application/json' },
      });
      if (!navigator.onLine) {
        setStatus('offline');
        setDetail('');
      } else if (response.status === 200 && response.data?.status === 'ok') {
        setStatus('ready');
        setDetail('');
      } else {
        setStatus('api-down');
        setDetail('El servidor respondió, pero su estado de salud no es correcto.');
      }
    } catch (error) {
      if (!navigator.onLine) {
        setStatus('offline');
        setDetail('');
      } else {
        setStatus('api-down');
        const httpStatus = error?.response?.status;
        setDetail(httpStatus
          ? `El servidor respondió con el código HTTP ${httpStatus}.`
          : 'La API no respondió dentro del tiempo esperado.');
      }
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setStatus('offline');
      setDetail('');
    };
    const handleOnline = () => checkConnection();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkConnection();
    };

    checkConnection();
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(checkConnection, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [checkConnection]);

  if (status === 'ready') return children;

  const isChecking = status === 'checking';
  const isOffline = status === 'offline';
  const Icon = isChecking ? Loader2 : isOffline ? WifiOff : ServerCrash;
  const title = isChecking
    ? 'Comprobando conexión'
    : isOffline
      ? 'No tienes conexión a Internet'
      : 'El servidor de Animayuks está apagado';
  const message = isChecking
    ? 'Estamos verificando que la tienda y sus servicios estén disponibles.'
    : isOffline
      ? 'Tu dispositivo está desconectado. Conéctate a una red Wi-Fi o de datos móviles para acceder a la página.'
      : 'Tu Internet funciona, pero la API de Animayuks no está disponible. Puede estar apagada, reiniciándose o en mantenimiento.';

  return (
    <div className="fixed inset-0 z-[10000] flex min-h-screen items-center justify-center overflow-hidden bg-[#061f09] p-3 sm:p-6 font-quicksand text-[#e6c59e]" role="alertdialog" aria-modal="true" aria-live="assertive">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(26,154,33,0.22),transparent_48%)]"></div>
      <div className="relative w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] border border-[#1a9a21]/40 bg-[#0a2e0d]/95 p-5 min-[390px]:p-6 sm:p-12 text-center shadow-[0_30px_90px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#03bbd3]/30 bg-[#061f09] shadow-[0_0_35px_rgba(3,187,211,0.14)]">
          <Icon className={`h-10 w-10 ${isChecking ? 'animate-spin text-[#03bbd3]' : isOffline ? 'text-[#ffce07]' : 'text-[#ec1676]'}`} />
        </div>
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-[#96c93e]">Estado del servicio</p>
        <h1 className="font-bungee text-2xl leading-tight text-white sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-md text-sm font-semibold leading-7 text-[#e6c59e]/75">{message}</p>
        {detail && <p className="mt-3 text-xs font-bold text-[#ec1676]">{detail}</p>}
        {!isChecking && (
          <button
            type="button"
            onClick={checkConnection}
            className="mx-auto mt-8 flex items-center justify-center gap-2 rounded-2xl bg-[#96c93e] px-7 py-4 font-black uppercase tracking-widest text-[#061f09] transition-all hover:bg-[#85b237] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar conexión
          </button>
        )}
        <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#e6c59e]/40">
          La página se habilitará automáticamente cuando el servicio regrese.
        </p>
      </div>
    </div>
  );
}
