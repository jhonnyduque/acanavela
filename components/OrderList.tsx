import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  Search, Trash2, Edit3, Eye, MessageCircle, CheckSquare, Square, 
  Calendar, Printer, Clock, ChevronRight
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

const OrderList: React.FC<OrderListProps> = ({ orders, onDelete, onBulkDelete, onUpdateStatus, onEdit, onView, onBatchPrint }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => 
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.id.toString().includes(searchTerm)
    );
    result.sort((a, b) => `${a.pickupDate}T${a.pickupTime}`.localeCompare(`${b.pickupDate}T${b.pickupTime}`));
    return result;
  }, [orders, searchTerm]);

  const groupedOrders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const groups: { title: string, items: Order[] }[] = [
      { title: 'Hoy', items: [] }, { title: 'Mañana', items: [] }, { title: 'Próximos', items: [] }
    ];

    filteredOrders.forEach(o => {
      if (o.pickupDate === today) groups[0].items.push(o);
      else if (o.pickupDate === tomorrow) groups[1].items.push(o);
      else groups[2].items.push(o);
    });
    return groups.filter(g => g.items.length > 0);
  }, [filteredOrders]);

  const handleAdvanceStatus = (order: Order) => {
    const currentIndex = ORDER_STATUSES.findIndex(s => s.value === order.status);
    if (currentIndex !== -1 && currentIndex < ORDER_STATUSES.length - 1) {
      const nextStatus = ORDER_STATUSES[currentIndex + 1].value as OrderStatus;
      onUpdateStatus(order.id, nextStatus);
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input 
            type="text" 
            placeholder="Buscar por cliente, teléfono o #ID..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-semibold transition-all text-sm md:text-base" 
          />
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && onBatchPrint && (
            <button 
              onClick={() => onBatchPrint(orders.filter(o => selectedIds.has(o.id)))} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              <Printer size={18}/> Imprimir ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* VISTA DESKTOP (TABLA) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-6 w-12">
                  <button 
                    onClick={() => { if (selectedIds.size === filteredOrders.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredOrders.map(o => o.id))); }} 
                    className="text-slate-300 transition-colors hover:text-indigo-500"
                  >
                    {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={20} className="text-indigo-500"/> : <Square size={20}/>}
                  </button>
                </th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Referencia</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Entrega</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-6 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedOrders.map(group => (
                <React.Fragment key={group.title}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="px-6 py-3 border-l-4 border-indigo-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500"/>
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{group.title}</span>
                      </div>
                    </td>
                  </tr>
                  {group.items.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-6">
                        <button onClick={() => toggleSelect(order.id)} className="text-slate-200 transition-colors hover:text-indigo-400">
                          {selectedIds.has(order.id) ? <CheckSquare size={20} className="text-indigo-500"/> : <Square size={20}/>}
                        </button>
                      </td>
                      <td className="px-4 py-6 font-bold text-slate-900 text-lg">#{order.id}</td>
                      <td className="px-4 py-6">
                        {order.products.map((p, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            <span className="font-bold text-slate-800 block text-sm">{p.type}</span>
                            <span className="text-[10px] font-medium text-slate-400 uppercase">{p.portions}p · {p.edge} · {p.filling}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-6">
                        <div className="font-bold text-slate-800 text-sm">{order.customerName}</div>
                        <div className="text-[11px] font-medium text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="text-xs font-medium text-slate-500">{order.pickupDate}</div>
                        <div className="text-indigo-600 font-bold">{order.pickupTime}h</div>
                      </td>
                      <td className="px-4 py-6 text-center">
                        <button 
                          onClick={() => handleAdvanceStatus(order)} 
                          className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${
                            order.status === 'Elaborado' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 
                            order.status === 'En elaboración' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 
                            'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {order.status}
                        </button>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onView(order)} className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl shadow-sm"><Eye size={18}/></button>
                          <button onClick={() => window.open(`https://wa.me/34${order.customerPhone.replace(/\D/g, '')}`, '_blank')} className="p-2.5 text-emerald-500 bg-white border border-slate-100 rounded-xl shadow-sm"><MessageCircle size={18}/></button>
                          <button onClick={() => onEdit(order)} className="p-2.5 text-slate-400 hover:text-indigo-500 bg-white border border-slate-100 rounded-xl shadow-sm"><Edit3 size={18}/></button>
                          <button onClick={() => onDelete(order.id)} className="p-2.5 text-rose-500 bg-white border border-slate-100 rounded-xl shadow-sm"><Trash2 size={18}/></button>
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
               <Calendar size={14} className="text-indigo-500"/>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.title}</span>
            </div>
            {group.items.map(order => (
              <div 
                key={order.id} 
                className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${selectedIds.has(order.id) ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} shadow-sm space-y-5`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">#{order.id}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg leading-tight">{order.customerName}</h4>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-indigo-400"/> {order.pickupTime}h · {order.pickupDate.split('-').reverse().slice(0,2).join('/')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleSelect(order.id)} className="p-1">
                    {selectedIds.has(order.id) ? <CheckSquare size={26} className="text-indigo-600"/> : <Square size={26} className="text-slate-200"/>}
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                  {order.products.map((p, i) => (
                    <div key={i} className="flex justify-between items-start text-sm border-b border-slate-200/50 last:border-0 pb-2 last:pb-0">
                      <div>
                        <span className="font-bold text-slate-800 block">{p.type}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-medium">{p.edge} · {p.filling}</span>
                      </div>
                      <span className="text-[10px] bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold shadow-sm whitespace-nowrap">{p.portions}p</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button 
                    onClick={() => handleAdvanceStatus(order)} 
                    className={`flex-1 h-12 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      order.status === 'Elaborado' ? 'bg-emerald-500 text-white shadow-lg' : 
                      order.status === 'En elaboración' ? 'bg-amber-500 text-white shadow-lg' : 
                      'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {order.status}
                  </button>
                  <div className="flex gap-1.5">
                    <button onClick={() => onView(order)} className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><Eye size={20}/></button>
                    <button onClick={() => window.open(`https://wa.me/34${order.customerPhone.replace(/\D/g, '')}`, '_blank')} className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform"><MessageCircle size={20}/></button>
                    <button onClick={() => onEdit(order)} className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 flex items-center justify-center active:scale-90 transition-transform"><Edit3 size={18}/></button>
                    <button onClick={() => onDelete(order.id)} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 flex items-center justify-center active:scale-90 transition-transform"><Trash2 size={18}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;