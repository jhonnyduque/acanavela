import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ orders, onOrderClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const yearStr = currentDate.getFullYear().toString();

  const years = useMemo(() => {
    const startYear = 2024;
    const endYear = 2030;
    const list = [];
    for (let i = startYear; i <= endYear; i++) list.push(i);
    return list;
  }, []);

  const getOrdersForDay = (day: number) => {
    const dateStr = `${yearStr}-${monthStr}-${day.toString().padStart(2, '0')}`;
    return orders.filter(o => o.pickupDate === dateStr);
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };

  const handleMonthChange = (monthIdx: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIdx, 1));
  };

  const days = [];
  for (let i = 0; i < adjustedFirstDay; i++) days.push(<div key={`empty-${i}`} className="h-20 md:h-32 bg-slate-50/20"></div>);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOrders = getOrdersForDay(d);
    days.push(
      <div key={d} className="h-24 md:h-32 border-t border-l border-slate-100 p-1 md:p-2 overflow-y-auto bg-white group hover:bg-slate-50/50 transition-colors">
        <span className="text-[10px] md:text-xs font-bold text-slate-400">{d}</span>
        <div className="mt-1 space-y-1">
          {dayOrders.map(o => (
            <button 
              key={o.id} 
              onClick={() => onOrderClick(o)}
              className="w-full text-left text-[8px] md:text-[9px] p-1 bg-emerald-50 text-emerald-700 rounded border-l-2 border-emerald-500 font-bold truncate hover:bg-emerald-500 hover:text-white transition-all"
            >
              <span className="hidden md:inline">{o.pickupTime} - </span>{o.customerName.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-500 pb-8">
      <div className="p-4 md:p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2.5 md:p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20"><CalendarIcon size={20} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <select 
                value={currentDate.getMonth()} 
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-base md:text-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {monthNames.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
              </select>
              <select 
                value={currentDate.getFullYear()} 
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-base md:text-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="flex-1 md:flex-none px-6 py-2 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            Hoy
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-r border-b border-slate-100">
        {['L','M','X','J','V','S','D'].map(d => (
          <div key={d} className="py-2 text-[10px] font-bold text-slate-400 text-center uppercase border-b border-slate-100 bg-slate-50/50">
            <span className="md:hidden">{d}</span>
            <span className="hidden md:inline">{d === 'L' ? 'Lun' : d === 'M' ? 'Mar' : d === 'X' ? 'Mié' : d === 'J' ? 'Jue' : d === 'V' ? 'Vie' : d === 'S' ? 'Sáb' : 'Dom'}</span>
          </div>
        ))}
        {days}
      </div>
    </div>
  );
};

export default CalendarView;