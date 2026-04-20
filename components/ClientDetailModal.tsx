import React, { useMemo } from 'react';
import { Customer, Order } from '../types';
import { getClientTier, normalizeSpanishPhone } from '../utils';
import {
  X,
  User,
  Phone,
  Mail,
  CalendarClock,
  ShoppingBag,
  MessageCircle,
  Copy,
  History,
  Package,
  TrendingUp,
  Star,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface ClientDetailModalProps {
  customer: Customer;
  orders: Order[];
  onClose: () => void;
  onViewOrder?: (order: Order) => void;
}

const formatDate = (date: string): string => {
  if (!date) return 'Sin fecha';

  const parts = date.split('-');
  if (parts.length === 3) return parts.reverse().join('/');

  try {
    return new Date(date).toLocaleDateString('es-ES');
  } catch {
    return date;
  }
};


const getDaysSince = (date: string): number | null => {
  if (!date) return null;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const today = new Date();
  const diffMs = today.getTime() - parsedDate.getTime();

  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  customer,
  orders,
  onClose,
  onViewOrder
}) => {
  const customerOrders = useMemo(() => {
    return orders
      .filter(order => order.customerPhone === customer.phone)
      .sort((a, b) => {
        const dateA = `${a.pickupDate} ${a.pickupTime}`;
        const dateB = `${b.pickupDate} ${b.pickupTime}`;
        return dateB.localeCompare(dateA);
      });
  }, [orders, customer.phone]);

  const stats = useMemo(() => {
    const totalOrders = customerOrders.length;

    const totalItems = customerOrders.reduce((acc, order) => {
      return acc + order.products.length;
    }, 0);

    const totalPortions = customerOrders.reduce((acc, order) => {
      return (
        acc +
        order.products.reduce((sum, product) => {
          return sum + Number(product.portions || 0);
        }, 0)
      );
    }, 0);

    const lastOrder = customerOrders[0] ?? null;
    const daysSinceLastOrder = lastOrder ? getDaysSince(lastOrder.pickupDate) : null;

    const mostOrderedProduct = (() => {
      const productCount: Record<string, number> = {};

      customerOrders.forEach(order => {
        order.products.forEach(product => {
          if (!product.type) return;
          productCount[product.type] = (productCount[product.type] || 0) + 1;
        });
      });

      const sorted = Object.entries(productCount).sort((a, b) => b[1] - a[1]);
      return sorted[0]?.[0] ?? 'Sin datos';
    })();

    const clientType = getClientTier(totalOrders).label;

    return {
      totalOrders,
      totalItems,
      totalPortions,
      lastOrder,
      daysSinceLastOrder,
      mostOrderedProduct,
      clientType
    };
  }, [customerOrders]);

  const handleWhatsApp = () => {
    const phone = normalizeSpanishPhone(customer.phone);
    if (!phone) return;

    const message = encodeURIComponent(
      `Hola ${customer.name}, te contactamos desde Acanavela.`
    );

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(customer.phone);
    } catch {
      console.warn('No se pudo copiar el teléfono');
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        <div className="flex-1 overflow-y-auto custom-scroll">
          <div className="p-8 md:p-10 pb-6 flex items-start justify-between gap-6">
            <div className="flex items-start gap-5 min-w-0">
              <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                <span className="text-3xl font-bold">
                  {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                    {stats.clientType}
                  </span>

                  {stats.totalOrders > 0 && (
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                      Cliente activo
                    </span>
                  )}
                </div>

                <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  {customer.name}
                </h2>

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-2">
                    <Phone size={15} />
                    {customer.phone}
                  </span>

                  {customer.email && (
                    <span className="flex items-center gap-2">
                      <Mail size={15} />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all shadow-sm shrink-0"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-8 md:px-10 pb-8 space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/20">
                  <ShoppingBag size={21} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Pedidos
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalOrders}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <Package size={21} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Ítems
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalItems}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
                  <TrendingUp size={21} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Raciones
                </p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalPortions}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-violet-600/20">
                  <Star size={21} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Favorito
                </p>
                <p className="text-sm font-bold text-slate-900 mt-2 leading-tight line-clamp-2">
                  {stats.mostOrderedProduct}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-6">
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6">
                  <div className="flex items-center gap-2 text-slate-500 mb-5">
                    <User size={18} />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">
                      Datos del cliente
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Nombre
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {customer.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Teléfono
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {customer.phone}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Email
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {customer.email || 'Sin email registrado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Fecha de registro
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {formatDate(customer.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-[2rem] p-6">
                  <div className="flex items-center gap-2 text-indigo-500 mb-5">
                    <CalendarClock size={18} />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">
                      Actividad
                    </h3>
                  </div>

                  {stats.lastOrder ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Último pedido
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          Pedido #{stats.lastOrder.id}
                        </p>
                        <p className="text-xs font-semibold text-indigo-600 mt-1">
                          {formatDate(stats.lastOrder.pickupDate)} · {stats.lastOrder.pickupTime}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-indigo-100">
                        <p className="text-xs font-medium text-slate-500">
                          {stats.daysSinceLastOrder === 0
                            ? 'Este cliente tiene actividad hoy.'
                            : `Han pasado ${stats.daysSinceLastOrder} días desde su último pedido.`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-500">
                      Este cliente todavía no tiene pedidos registrados.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div className="flex items-center gap-2 text-slate-600">
                    <History size={18} />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest">
                      Historial de pedidos
                    </h3>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {customerOrders.length} registros
                  </span>
                </div>

                {customerOrders.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scroll pr-1">
                    {customerOrders.map(order => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => onViewOrder?.(order)}
                        className="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-[1.5rem] p-4 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              Pedido #{order.id}
                            </p>

                            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                              <Clock size={13} />
                              {formatDate(order.pickupDate)} · {order.pickupTime}
                            </p>
                          </div>

                          <span className="px-3 py-1 rounded-full bg-white text-slate-500 border border-slate-200 text-[9px] font-bold uppercase tracking-widest shrink-0">
                            {order.status}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {order.products.slice(0, 2).map((product, index) => (
                            <div
                              key={`${order.id}-${product.id}-${index}`}
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="font-semibold text-slate-700 truncate">
                                {product.type || 'Producto sin nombre'}
                              </span>

                              <span className="font-bold text-indigo-600 shrink-0">
                                {product.portions} r.
                              </span>
                            </div>
                          ))}

                          {order.products.length > 2 && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              +{order.products.length - 2} producto(s) más
                            </p>
                          )}
                        </div>

                        {order.status === 'Entregado' && (
                          <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 size={13} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              Pedido entregado
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-[280px] flex flex-col items-center justify-center text-center bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
                    <ShoppingBag size={34} className="text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-500">
                      Sin pedidos todavía
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Cuando este cliente realice pedidos, aparecerán aquí.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="px-5 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={18} />
              WhatsApp
            </button>

            <button
              type="button"
              onClick={handleCopyPhone}
              className="px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Copy size={18} />
              Copiar
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

export default ClientDetailModal;