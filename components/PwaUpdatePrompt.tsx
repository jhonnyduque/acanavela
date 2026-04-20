import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, X, Wifi } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PwaUpdatePrompt: React.FC = () => {
  const [manualNeedRefresh, setManualNeedRefresh] = useState(false);
  const updateIntervalRef = useRef<number | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    immediate: true,

    onRegisteredSW(_swScriptUrl, registration) {
      console.log('[PWA] Service Worker registrado:', registration);

      if (!registration) return;

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        console.log('[PWA] updatefound:', newWorker);

        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          console.log('[PWA] nuevo SW state:', newWorker.state);

          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            console.log('[PWA] nueva versión esperando activación');
            setManualNeedRefresh(true);
          }
        });
      });

      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
      }

      updateIntervalRef.current = window.setInterval(() => {
        console.log('[PWA] Buscando actualización...');
        registration.update();
      }, 15 * 1000);
    },

    onRegisterError(error) {
      console.error('[PWA] Error registrando Service Worker:', error);
    }
  });

  useEffect(() => {
    if (needRefresh) {
      console.log('[PWA] needRefresh detectado por useRegisterSW');
      setManualNeedRefresh(true);
    }
  }, [needRefresh]);

  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  const close = () => {
    console.log('[PWA] Cerrando prompt');
    setOfflineReady(false);
    setNeedRefresh(false);
    setManualNeedRefresh(false);
  };

  const handleUpdate = async () => {
    try {
      console.log('[PWA] Usuario solicitó actualización');
      await updateServiceWorker(true);
    } catch (error) {
      console.error('[PWA] Error al actualizar Service Worker:', error);
    }
  };

  const shouldShowUpdate = needRefresh || manualNeedRefresh;

  if (!offlineReady && !shouldShowUpdate) return null;

  return (
    <div className="fixed left-4 right-4 bottom-24 lg:left-auto lg:right-6 lg:bottom-6 z-[700] pointer-events-none animate-in slide-in-from-bottom-4">
      <div className="relative z-[710] pointer-events-auto mx-auto lg:mx-0 max-w-md rounded-3xl bg-slate-950 text-white shadow-2xl border border-white/10 overflow-hidden">
        <div className="p-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
            {shouldShowUpdate ? <RefreshCw size={22} /> : <Wifi size={22} />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold tracking-tight">
              {shouldShowUpdate
                ? 'Nueva versión disponible'
                : 'Acanavela lista sin conexión'}
            </h3>

            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              {shouldShowUpdate
                ? 'Hay una actualización de Acanavela. Actualiza para cargar la versión más reciente.'
                : 'La aplicación quedó preparada para abrir más rápido y funcionar mejor como PWA.'}
            </p>

            <div className="flex gap-3 mt-4 relative z-[720]">
              {shouldShowUpdate && (
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  Actualizar ahora
                </button>
              )}

              <button
                type="button"
                onClick={close}
                className="px-4 py-3 rounded-2xl bg-white/10 text-white text-sm font-bold transition-all hover:bg-white/15 active:scale-95 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar aviso"
            className="w-9 h-9 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/15 flex items-center justify-center shrink-0 transition-all cursor-pointer relative z-[720]"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaUpdatePrompt;