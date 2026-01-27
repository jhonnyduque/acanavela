
import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';
import { 
  Filter, FileSpreadsheet, TrendingUp, ShoppingBag, 
  Utensils, Calendar, Trophy, ArrowUpRight
} from 'lucide-react';

interface StatsViewProps {
  orders: Order[];
}

const StatsView: React.FC<StatsViewProps> = ({ orders }) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Rango inicial: últimos 30 días hasta hoy
  const [range, setRange] = useState({ 
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
    end: today 
  });
  
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Resolvemos las fechas efectivas para que todos los componentes coincidan
  const resolvedRange = useMemo(() => {
    let actualStart = range.start;
    if (!actualStart) {
      if (orders.length > 0) {
        actualStart = orders.reduce((min, o) => o.pickupDate < min ? o.pickupDate : min, today);
      } else {
        actualStart = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
      }
    }
    const actualEnd = range.end || today;
    return { start: actualStart, end: actualEnd };
  }, [range, orders, today]);

  // Aplicamos el filtro resuelto a TODOS los datos (KPIs, Top Ventas y Gráfico)
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const okStart = o.pickupDate >= resolvedRange.start;
      const okEnd = o.pickupDate <= resolvedRange.end;
      return okStart && okEnd;
    });
  }, [orders, resolvedRange]);

  const kpis = useMemo(() => {
    const totalOrders = filteredOrders.length;
    let totalPortions = 0;
    const productCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};

    filteredOrders.forEach(o => {
      dayCounts[o.pickupDate] = (dayCounts[o.pickupDate] || 0) + 1;
      o.products.forEach(p => {
        totalPortions += p.portions;
        productCounts[p.type] = (productCounts[p.type] || 0) + p.portions;
      });
    });

    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';
    const peakDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';

    return { totalOrders, totalPortions, topProduct, peakDay };
  }, [filteredOrders]);

  const productData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach(o => o.products.forEach(p => {
      counts[p.type] = (counts[p.type] || 0) + p.portions;
    }));
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredOrders]);

  const timelineData = useMemo(() => {
    const daily: Record<string, { date: string, portions: number, orders: number }> = {};
    
    // Generar el eje X basado en el rango resuelto
    const curr = new Date(resolvedRange.start);
    const end = new Date(resolvedRange.end);
    
    let iterations = 0;
    while (curr <= end && iterations < 366) {
      const d = curr.toISOString().split('T')[0];
      daily[d] = { date: d.split('-').slice(1).reverse().join('/'), portions: 0, orders: 0 };
      curr.setDate(curr.getDate() + 1);
      iterations++;
    }

    filteredOrders.forEach(o => {
      if (daily[o.pickupDate]) {
        daily[o.pickupDate].orders += 1;
        o.products.forEach(p => {
          daily[o.pickupDate].portions += p.portions;
        });
      }
    });

    return Object.values(daily);
  }, [filteredOrders, resolvedRange]);

  const exportToCSV = () => {
    if (productData.length === 0) return;
    const summary = `REPORTE ACANAVELA FRITIDA\nPeriodo: ${resolvedRange.start} al ${resolvedRange.end}\n\n`;
    const kpiRow = `KPIs: Total Pedidos: ${kpis.totalOrders}, Raciones Totales: ${kpis.totalPortions}, Producto Estrella: ${kpis.topProduct}, Dia Pico: ${kpis.peakDay}\n\n`;
    const headers = "Producto,Raciones Totales,Porcentaje del Total\n";
    const rows = productData.map(d => {
      const pct = ((d.value / kpis.totalPortions) * 100).toFixed(1);
      return `"${d.name}",${d.value},${pct}%`;
    }).join("\n");

    const blob = new Blob(["\uFEFF" + summary + kpiRow + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Produccion_${resolvedRange.start}_${resolvedRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in pb-24">
      <div className="bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 no-print shadow-sm">
        <div className="flex items-center gap-4 md:gap-6 flex-1 w-full">
          <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl hidden md:block"><Filter size={20} /></div>
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Desde</label>
              <input type="date" value={range.start} onChange={e => setRange({...range, start: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-xs md:text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Hasta</label>
              <input type="date" value={range.end} onChange={e => setRange({...range, end: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-xs md:text-sm" />
            </div>
          </div>
        </div>
        <button 
          onClick={exportToCSV} 
          disabled={productData.length === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-30 text-xs uppercase tracking-widest"
        >
          <FileSpreadsheet size={18}/> Exportar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Pedidos" value={kpis.totalOrders} icon={ShoppingBag} color="indigo" />
        <KPICard title="Raciones" value={kpis.totalPortions} icon={Utensils} color="emerald" />
        <KPICard title="Estrella" value={kpis.topProduct} icon={Trophy} color="amber" isText />
        <KPICard title="Día Pico" value={kpis.peakDay} icon={Calendar} color="rose" isText />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Tendencia</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Producción diaria</p>
            </div>
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
          <div className="h-[250px] md:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorPortions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: '700' }}
                />
                <Area type="monotone" dataKey="portions" name="Raciones" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPortions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Top Ventas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ranking productos</p>
            </div>
            <ArrowUpRight className="text-indigo-500" size={24} />
          </div>
          <div className="flex-1 space-y-4 md:space-y-5 overflow-y-auto max-h-[300px] lg:max-h-none pr-2 custom-scroll">
            {productData.map((item, idx) => {
              const pct = kpis.totalPortions > 0 ? ((item.value / kpis.totalPortions) * 100).toFixed(0) : "0";
              return (
                <div key={item.name} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-slate-700 truncate mr-2">{item.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{item.value} r. <span className="text-indigo-500 ml-1">({pct}%)</span></span>
                  </div>
                  <div className="h-2 md:h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${pct}%`, 
                        backgroundColor: COLORS[idx % COLORS.length] 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon: Icon, color, isText = false }: any) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-indigo-500 border-indigo-100',
    emerald: 'bg-emerald-500 text-emerald-500 border-emerald-100',
    amber: 'bg-amber-500 text-amber-500 border-amber-100',
    rose: 'bg-rose-500 text-rose-500 border-rose-100'
  };

  return (
    <div className="bg-white p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4 md:gap-5 hover:shadow-xl transition-all duration-300">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-opacity-10 ${colorMap[color]} shrink-0`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className={`font-bold text-slate-800 leading-tight truncate ${isText ? 'text-sm md:text-lg' : 'text-xl md:text-2xl'}`}>
          {isText && typeof value === 'string' && value.includes('-') ? value.split('-').reverse().join('/') : value}
        </p>
      </div>
    </div>
  );
};

export default StatsView;
