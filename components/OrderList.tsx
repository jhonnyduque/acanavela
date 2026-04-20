import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Order, OrderStatus } from '../types';
import {
  Search,
  Trash2,
  Edit3,
  Eye,
  MessageCircle,
  CheckSquare,
  Square,
  Calendar,
  Printer,
  Clock,
  X
} from 'lucide-react';
import { ORDER_STATUSES } from '../constants';

interface OrderListProps {
  orders: Order[];
  onDelete: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onUpdateStatus: (id: number, nextStatus: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onView: (order: Order) => void;
  onBatchPrint?: (orders: Order[]) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  onDelete,
  onBulkDelete,
  onUpdateStatus,
  onEdit,
  onView,
  onBatchPrint
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.blur();
  };

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const result = !normalizedSearch
      ? [...orders]
      : orders.filter(order => {
        const customerName = order.customerName.toLowerCase();
        const customerPhone = order.customerPhone;
        const orderId = order.id.toString();

        return (
          customerName.includes(normalizedSearch) ||
          customerPhone.includes(normalizedSearch) ||
          orderId.includes(normalizedSearch)
        );
      });

    result.sort((a, b) =>
      `${a.pickupDate}T${a.pickupTime}`.localeCompare(`${b.pickupDate}T${b.pickupTime}`)
    );

    return result;
  }, [orders, searchTerm]);

  const groupedOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const groups: { title: string; items: Order[] }[] = [
      { title: 'Hoy', items: [] },
      { title: 'Mañana', items: [] },
      { title: 'Próximos', items: [] }
    ];

    filteredOrders.forEach(order => {
      if (order.pickupDate === today) {
        groups[0].items.push(order);
      } else if (order.pickupDate === tomorrow) {
        groups[1].items.push(order);
      } else {
        groups[2].items.push(order);
      }
    });

    return groups.filter(group => group.items.length > 0);
  }, [filteredOrders]);

  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(orders.map(order => order.id));
      const next = new Set<number>();

      prev.forEach(id => {
        if (validIds.has(id)) next.add(id);
      });

      return next;
    });
  }, [orders]);

  const handleAdvanceStatus = (order: Order) => {
    const currentIndex = ORDER_STATUSES.findIndex(status => status.value === order.status);

    if (currentIndex !== -1 && currentIndex < ORDER_STATUSES.length - 1) {
      const nextStatus = ORDER_STATUSES[currentIndex + 1].value as OrderStatus;
      onUpdateStatus(order.id, nextStatus);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (filteredOrders.length === 0) return;

    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(filteredOrders.map(order => order.id)));
  };

  const handleView = (order: Order) => {
    clearSearch();
    onView(order);
  };

  const handleEdit = (order: Order) => {
    clearSearch();
    onEdit(order);
  };

  const handleDelete = (id: number) => {
    clearSearch();
    onDelete(id);
  };

  const handleWhatsApp = (order: Order) => {
    clearSearch();
    window.open(`https://wa.me/34${order.customerPhone.replace(/\D/g, '')}`, '_blank');
  };

  const handleBatchPrint = () => {
    if (!onBatchPrint) return;

    const selectedOrders = orders.filter(order => selectedIds.has(order.id));
    onBatchPrint(selectedOrders);
  };

  const hasSearch = searchTerm.trim().length > 0;
  const hasNoResults = filteredOrders.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 no-print">
        <div className="flex-1 relative">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />

          <input
            ref={searchInputRef}
            type="search"
            name="acanavela_order_search"
            id="acanavela_order_search"
            placeholder="Buscar por cliente, teléfono o #ID..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-full pl-14 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-semibold transition-all text-sm md:text-base"
          />

          {hasSearch && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all flex items-center justify-center"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {selectedIds.size > 0 && onBatchPrint && (
            <button
              type="button"
              onClick={handleBatchPrint}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <Printer size={18} /> Imprimir ({selectedIds.size})
            </button>
          )}

          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => onBulkDelete(Array.from(selectedIds))}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 text-rose-500 border border-rose-100 font-semibold rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <Trash2 size={18} /> Papelera ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {hasNoResults && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
            <Search size={22} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            {hasSearch ? 'No hay pedidos que coincidan' : 'No hay pedidos activos'}
          </h3>

          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            {hasSearch
              ? 'La búsqueda actual está filtrando la lista. Limpia el buscador para volver a ver todos los pedidos activos.'
              : 'Cuando registres nuevos pedidos, aparecerán aquí organizados por fecha de entrega.'}
          </p>

          {hasSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-5 px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 text-sm font-bold hover:bg-indigo-100 transition-all"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {!hasNoResults && (
        <>
          {/* VISTA DESKTOP (TABLA) */}
          <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-6 w-12">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-300 transition-colors hover:text-indigo-500"
                      >
                        {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                          <CheckSquare size={20} className="text-indigo-500" />
                        ) : (
                          <Square size={20} />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Referencia
                    </th>
                    <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Producto
                    </th>
                    <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Cliente
                    </th>
                    <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Entrega
                    </th>
                    <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">
                      Estado
                    </th>
                    <th className="px-6 py-6 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {groupedOrders.map(group => (
                    <React.Fragment key={group.title}>
                      <tr className="bg-slate-50/50">
                        <td colSpan={7} className="px-6 py-3 border-l-4 border-indigo-500">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                              {group.title}
                            </span>
                          </div>
                        </td>
                      </tr>

                      {group.items.map(order => (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/80 transition-all group"
                        >
                          <td className="px-6 py-6">
                            <button
                              type="button"
                              onClick={() => toggleSelect(order.id)}
                              className="text-slate-200 transition-colors hover:text-indigo-400"
                            >
                              {selectedIds.has(order.id) ? (
                                <CheckSquare size={20} className="text-indigo-500" />
                              ) : (
                                <Square size={20} />
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-6 font-bold text-slate-900 text-lg">
                            #{order.id}
                          </td>

                          <td className="px-4 py-6">
                            {order.products.map((product, index) => (
                              <div key={index} className="mb-1 last:mb-0">
                                <span className="font-bold text-slate-800 block text-sm">
                                  {product.type}
                                </span>
                                <span className="text-[10px] font-medium text-slate-400 uppercase">
                                  {product.portions}p · {product.edge} · {product.filling}
                                </span>
                              </div>
                            ))}
                          </td>

                          <td className="px-4 py-6">
                            <div className="font-bold text-slate-800 text-sm">
                              {order.customerName}
                            </div>
                            <div className="text-[11px] font-medium text-slate-400">
                              {order.customerPhone}
                            </div>
                          </td>

                          <td className="px-4 py-6">
                            <div className="text-xs font-medium text-slate-500">
                              {order.pickupDate}
                            </div>
                            <div className="text-indigo-600 font-bold">
                              {order.pickupTime}h
                            </div>
                          </td>

                          <td className="px-4 py-6 text-center">
                            <button
                              type="button"
                              onClick={() => handleAdvanceStatus(order)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${order.status === 'Elaborado'
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                  : order.status === 'En elaboración'
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                              {order.status}
                            </button>
                          </td>

                          <td className="px-6 py-6 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => handleView(order)}
                                className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm"
                              >
                                <Eye size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleWhatsApp(order)}
                                className="p-2.5 text-emerald-500 bg-white border border-slate-100 rounded-xl shadow-sm"
                              >
                                <MessageCircle size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEdit(order)}
                                className="p-2.5 text-slate-400 hover:text-indigo-500 bg-white border border-slate-100 rounded-xl shadow-sm"
                              >
                                <Edit3 size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(order.id)}
                                className="p-2.5 text-rose-500 bg-white border border-slate-100 rounded-xl shadow-sm"
                                title="Enviar a papelera"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* VISTA MÓVIL (CARDS) */}
          <div className="md:hidden space-y-8">
            {groupedOrders.map(group => (
              <div key={group.title} className="space-y-4">
                <div className="flex items-center gap-2 px-2 sticky top-0 bg-slate-50/80 backdrop-blur-sm py-2 z-10">
                  <Calendar size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {group.title}
                  </span>
                </div>

                {group.items.map(order => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${selectedIds.has(order.id)
                        ? 'border-indigo-500 ring-4 ring-indigo-500/5'
                        : 'border-slate-200'
                      } shadow-sm space-y-5`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
                          #{order.id}
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">
                            {order.customerName}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-indigo-400" /> {order.pickupTime}h ·{' '}
                            {order.pickupDate.split('-').reverse().slice(0, 2).join('/')}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSelect(order.id)}
                        className="p-1"
                      >
                        {selectedIds.has(order.id) ? (
                          <CheckSquare size={26} className="text-indigo-600" />
                        ) : (
                          <Square size={26} className="text-slate-200" />
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                      {order.products.map((product, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-start text-sm border-b border-slate-200/50 last:border-0 pb-2 last:pb-0"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {product.type}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">
                              {product.edge} · {product.filling}
                            </span>
                          </div>

                          <span className="text-[10px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold shadow-sm whitespace-nowrap">
                            {product.portions}p
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order)}
                        className={`flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${order.status === 'Elaborado'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : order.status === 'En elaboración'
                              ? 'bg-amber-500 text-white shadow-lg'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {order.status}
                      </button>

                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleView(order)}
                          className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleWhatsApp(order)}
                          className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                        >
                          <MessageCircle size={20} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(order)}
                          className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Edit3 size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 flex items-center justify-center active:scale-90 transition-transform"
                          title="Enviar a papelera"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderList;