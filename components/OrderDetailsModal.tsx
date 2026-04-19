import React from 'react';
import { Order } from '../types';
import {
  X,
  Printer,
  MessageCircle,
  Edit3,
  Trash2,
  Copy,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
  onDuplicate: (order: Order) => void;
}

const formatDate = (date: string): string => {
  if (!date) return 'Sin fecha';

  const parts = date.split('-');
  if (parts.length === 3) return parts.reverse().join('/');

  return date;
};

const normalizeSpanishPhone = (phone: string): string => {
  const clean = phone.replace(/\D/g, '');

  if (clean.startsWith('34')) return clean;
  if (clean.length === 9) return `34${clean}`;

  return clean;
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const handleWhatsApp = () => {
    const phone = normalizeSpanishPhone(order.customerPhone);
    if (!phone) return;

    const message = encodeURIComponent(
      `Hola ${order.customerName}, te contactamos por tu pedido #${order.id} de Acanavela.`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto custom-scroll">
          <div className="p-8 md:p-10 pb-6 flex items-start justify-between gap-6">
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-3">
                {order.status}
              </span>

              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Pedido #{order.id}
              </h2>

              <p className="text-sm font-medium text-slate-400 mt-2">
                Detalle completo del pedido registrado
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all shadow-sm shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-8 md:px-10 pb-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <User size={18} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">
                    Cliente
                  </h3>
                </div>

                <p className="text-lg font-bold text-slate-900">
                  {order.customerName}
                </p>

                <p className="text-sm font-semibold text-slate-500 mt-2 flex items-center gap-2">
                  <Phone size={15} />
                  {order.customerPhone}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <Calendar size={18} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest">
                    Recogida
                  </h3>
                </div>

                <p className="text-lg font-bold text-slate-900">
                  {formatDate(order.pickupDate)}
                </p>

                <p className="text-sm font-bold text-indigo-600 mt-2 flex items-center gap-2">
                  <Clock size={15} />
                  {order.pickupTime} Horas
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Productos
                </h3>

                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  {order.products.length} ítem(s)
                </span>
              </div>

              <div className="space-y-4">
                {order.products.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-5 right-5">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        {product.portions} raciones
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 pr-28">
                      {product.type || 'Producto sin nombre'}
                    </h4>

                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Contorno
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {product.edge || 'Sin contorno'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Relleno
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {product.filling || 'Sin relleno'}
                        </p>
                      </div>
                    </div>

                    {product.message && (
                      <div className="mt-5 pt-5 border-t border-slate-100">
                        <p className="text-sm italic text-slate-500 bg-slate-50 p-4 rounded-2xl border-l-4 border-indigo-200">
                          “{product.message}”
                        </p>
                      </div>
                    )}

                    {product.glutenFree && (
                      <div className="mt-4 flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={15} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          Sin gluten
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/60 border border-indigo-100 rounded-[2rem] p-6">
              <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-3">
                Registro
              </h3>

              <p className="text-sm font-semibold text-slate-600">
                Creado el:
              </p>

              <p className="text-sm font-bold text-slate-900 mt-1">
                {new Date(order.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="grid grid-cols-5 gap-3">
            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir"
              className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/20 active:scale-90 transition-all"
            >
              <Printer size={21} />
            </button>

            <button
              type="button"
              onClick={() => onDuplicate(order)}
              title="Duplicar pedido"
              className="w-12 h-12 md:w-14 md:h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-indigo-200"
            >
              <Copy size={21} />
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              title="WhatsApp"
              className="w-12 h-12 md:w-14 md:h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-emerald-200"
            >
              <MessageCircle size={21} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(order)}
              title="Editar"
              className="w-12 h-12 md:w-14 md:h-14 bg-slate-200 text-slate-500 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-slate-300"
            >
              <Edit3 size={21} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(order.id)}
              title="Eliminar"
              className="w-12 h-12 md:w-14 md:h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm active:scale-90 transition-all border border-rose-100"
            >
              <Trash2 size={21} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-4 bg-white border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;