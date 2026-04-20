import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Globe,
  History,
  Trash2,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { Order } from '../types';
import { storageService } from '../services/storageService';

interface PrivacyViewProps {
  onDataChange?: () => Promise<void> | void;
}

const PrivacyView: React.FC<PrivacyViewProps> = ({ onDataChange }) => {
  const [deletedOrders, setDeletedOrders] = useState<Order[]>([]);
  const [isLoadingDeletedOrders, setIsLoadingDeletedOrders] = useState(false);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [trashMessage, setTrashMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const loadDeletedOrders = async () => {
    setIsLoadingDeletedOrders(true);
    setTrashMessage(null);

    try {
      const orders = await storageService.getDeletedOrders();
      setDeletedOrders(orders);
    } catch (error) {
      console.error('Error cargando papelera:', error);
      setTrashMessage({
        text: 'No se pudo cargar la papelera de pedidos.',
        type: 'error'
      });
    } finally {
      setIsLoadingDeletedOrders(false);
    }
  };

  useEffect(() => {
    loadDeletedOrders();
  }, []);

  const handleRestoreOrder = async (order: Order) => {
    const confirmed = window.confirm(
      `¿Deseas restaurar el pedido #${order.id} de ${order.customerName}?`
    );

    if (!confirmed) return;

    setIsRestoring(order.id);
    setTrashMessage(null);

    try {
      await storageService.restoreOrders([order.id]);
      await loadDeletedOrders();
      await onDataChange?.();

      setTrashMessage({
        text: `Pedido #${order.id} restaurado correctamente.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error restaurando pedido:', error);
      setTrashMessage({
        text: 'No se pudo restaurar el pedido. Inténtalo nuevamente.',
        type: 'error'
      });
    } finally {
      setIsRestoring(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <ShieldCheck size={28} />
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Seguridad y privacidad
          </h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">
            Normativa interna, manejo de datos y recuperación
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Database size={24} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Datos en la nube
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            La información operativa se guarda en Supabase para mantener pedidos,
            clientes y catálogos sincronizados.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Lock size={24} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Acceso por usuario
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Cada usuario accede con su PIN. Las acciones sensibles se protegen
            con verificación administrativa adicional.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Cookies técnicas
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            La aplicación puede usar almacenamiento técnico necesario para
            mantener la sesión y mejorar la experiencia como PWA.
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <History size={24} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Historial operativo
          </h3>

          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Los registros históricos se conservan aunque se inactiven productos,
            contornos o rellenos, para proteger la trazabilidad.
          </p>
        </div>
      </div>

      <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
              <Trash2 size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Papelera de pedidos
              </h2>

              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Aquí aparecen los pedidos enviados a papelera. Puedes restaurarlos
                si fueron eliminados por error.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDeletedOrders}
            disabled={isLoadingDeletedOrders}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={isLoadingDeletedOrders ? 'animate-spin' : ''}
            />
            Actualizar
          </button>
        </div>

        {trashMessage && (
          <div
            className={`mx-6 md:mx-8 mt-6 px-4 py-3 rounded-2xl border flex items-center gap-3 ${trashMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : trashMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-100 text-rose-600'
                  : 'bg-slate-50 border-slate-100 text-slate-600'
              }`}
          >
            <AlertCircle size={18} />
            <p className="text-sm font-semibold">{trashMessage.text}</p>
          </div>
        )}

        <div className="p-6 md:p-8">
          {isLoadingDeletedOrders ? (
            <div className="flex items-center justify-center py-14 text-slate-400">
              <RefreshCw size={22} className="animate-spin mr-3" />
              <span className="text-sm font-semibold">
                Cargando pedidos eliminados...
              </span>
            </div>
          ) : deletedOrders.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PackageCheck size={28} />
              </div>

              <h3 className="text-lg font-bold text-slate-800">
                La papelera está vacía
              </h3>

              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Cuando envíes pedidos a papelera, aparecerán aquí para poder
                revisarlos o restaurarlos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedOrders.map(order => (
                <div
                  key={order.id}
                  className="border border-slate-200 rounded-[1.5rem] p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-5 hover:bg-slate-50/70 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest">
                        Pedido #{order.id}
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                        En papelera
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        {order.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {order.customerName}
                    </h3>

                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      {order.customerPhone} · Entrega: {order.pickupDate} a las{' '}
                      {order.pickupTime}h
                    </p>

                    <div className="mt-3 space-y-1">
                      {order.products.map((product, index) => (
                        <p
                          key={`${order.id}-${index}`}
                          className="text-xs text-slate-500"
                        >
                          <span className="font-bold text-slate-700">
                            {product.type}
                          </span>{' '}
                          · {product.portions}p · {product.edge} ·{' '}
                          {product.filling}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex md:justify-end">
                    <button
                      type="button"
                      onClick={() => handleRestoreOrder(order)}
                      disabled={isRestoring === order.id}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-60"
                    >
                      <RotateCcw
                        size={16}
                        className={isRestoring === order.id ? 'animate-spin' : ''}
                      />
                      {isRestoring === order.id ? 'Restaurando...' : 'Restaurar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PrivacyView;