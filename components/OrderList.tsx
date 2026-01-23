import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  Search, Trash2, Edit3, Eye, MessageCircle, PlusCircle, CheckSquare, Square, 
  Calendar, Printer
} from 'lucide-react';
import { ORDER_STATUSES } from '../constants';

interface OrderListProps {
  orders: Order[];
  onDelete: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onUpdateStatus: (id: number, nextStatus: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onView: (order: Order) => void;
  onNewOrder: () => void;
  onBatchPrint?: (orders: Order[]) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onDelete, onBulkDelete, onUpdateStatus, onEdit, onView, onNewOrder, onBatchPrint }) => {
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

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 no-print">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
          <input type="text" placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-semibold transition-all" />
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && onBatchPrint && (
            <button onClick={() => onBatchPrint(orders.filter(o => selectedIds.has(o.id)))} className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white font-semibold rounded-2xl shadow-xl transition-all active:scale-95"><Printer size={20}/> Exportar ({selectedIds.size})</button>
          )}
          <button onClick={onNewOrder} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl active:scale-95"><PlusCircle size={24}/></button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-6 w-12"><button onClick={() => { if (selectedIds.size === filteredOrders.length) setSelectedIds(new Set()); else setSelectedIds(new Set(filteredOrders.map(o => o.id))); }} className="text-slate-300">{selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare size={20} className="text-indigo-500"/> : <Square size={20}/>}</button></th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-800 uppercase tracking-widest">Ref</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-800 uppercase tracking-widest">Producto</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-800 uppercase tracking-widest">Cliente</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-800 uppercase tracking-widest">Fecha/Hora</th>
                <th className="px-4 py-6 text-[10px] font-semibold text-slate-800 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-6 text-right text-[10px] font-semibold text-slate-800 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groupedOrders.map(group => (
                <React.Fragment key={group.title}>
                  <tr className="bg-slate-50/50"><td colSpan={7} className="px-6 py-3 border-l-4 border-indigo-500 flex items-center gap-2"><Calendar size={14} className="text-indigo-500"/><span className="text-[10px] font-semibold text-slate-700 uppercase tracking-widest">{group.title}</span></td></tr>
                  {group.items.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-6 py-6"><button onClick={() => { const next = new Set(selectedIds); if (next.has(order.id)) next.delete(order.id); else next.add(order.id); setSelectedIds(next); }} className="text-slate-200">{selectedIds.has(order.id) ? <CheckSquare size={20} className="text-indigo-500"/> : <Square size={20}/>}</button></td>
                      <td className="px-4 py-6 font-semibold text-slate-800 text-lg">{order.id}</td>
                      <td className="px-4 py-6 min-w-[200px]">
                        {order.products.map((p, i) => (
                          <div key={i} className="mb-1">
                            <span className="font-semibold text-slate-900 block">{p.type}</span>
                            <span className="text-[10px] font-medium text-slate-400">({p.portions}p) · {p.edge} · {p.filling}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-6"><div className="font-semibold text-slate-800 text-sm">{order.customerName}</div><div className="text-[11px] font-medium text-slate-400">{order.customerPhone}</div></td>
                      <td className="px-4 py-6 font-semibold text-slate-800 text-sm"><div>{order.pickupDate}</div><div className="text-indigo-500 font-semibold">{order.pickupTime}</div></td>
                      <td className="px-4 py-6 text-center">
                        <button onClick={() => handleAdvanceStatus(order)} className={`px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase tracking-widest ${order.status === 'Elaborado' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-500'}`}>{order.status}</button>
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
    </div>
  );
};

export default OrderList;