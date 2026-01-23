import React, { useState, useMemo } from 'react';
import { Order } from '../types';
import { 
  ShoppingBag, Clock, Sparkles, CalendarDays, Utensils,
  Zap, TrendingUp, ChevronRight, PackageCheck
} from 'lucide-react';
import { analyzeSalesWithAI } from '../services/geminiService';

interface DashboardProps {
  orders: Order[];
  onGoToOrders: () => void;
}

type TimeFilter = 'hoy' | 'semana' | 'total';

const Dashboard: React.FC<DashboardProps> = ({ orders, onGoToOrders }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('hoy');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredStats = useMemo(() => {
    const current = orders.filter(o => {
      if (timeFilter === 'hoy') return o.pickupDate === todayStr;
      if (timeFilter === 'semana') {
        const d = new Date(o.pickupDate);
        const now = new Date();
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7 && diff >= 0;
      }
      return true;
    });

    return {
      total: current.length,
      received: current.filter(o => o.status === 'Recibido').length,
      inProgress: current.filter(o => o.status === 'En elaboración').length,
      portions: current.reduce((acc, o) => acc + o.products.reduce((pAcc, p) => pAcc + p.portions, 0), 0)
    };
  }, [orders, timeFilter]);

  const todayOrders = useMemo(() => 
    orders.filter(o => o.pickupDate === todayStr).sort((a,b) => a.pickupTime.localeCompare(b.pickupTime))
  , [orders]);

  const handleAIAnalysis = async () => {
    if (orders.length === 0) return;
    setLoadingAI(true);
    const analysis = await analyzeSalesWithAI(orders);
    setAiAnalysis(analysis || "Error al generar análisis.");
    setLoadingAI(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight">Panel Principal</h1>
          <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">Obrador Acanavela Fritida</p>
        </div>
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex gap-1">
          {(['hoy', 'semana', 'total'] as TimeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-semibold capitalize transition-all tracking-wider ${
                timeFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {f === 'hoy' ? 'Hoy' : f === 'semana' ? 'Esta Semana' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pedidos" value={filteredStats.total} icon={ShoppingBag} color="indigo" />
        <StatCard title="Pendientes" value={filteredStats.received} icon={Clock} color="amber" />
        <StatCard title="En Obrador" value={filteredStats.inProgress} icon={Utensils} color="violet" />
        <StatCard title="Raciones" value={filteredStats.portions} icon={Zap} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-3">
              <CalendarDays className="text-indigo-500" size={24} /> Próximas Entregas
            </h3>
            <button onClick={onGoToOrders} className="group text-indigo-600 font-semibold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              Ver todos <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scroll flex-1">
            {todayOrders.length > 0 ? todayOrders.map(order => (
              <div key={order.id} className="group flex items-center p-5 rounded-3xl bg-slate-50 border border-transparent hover:border-indigo-100 hover:bg-white transition-all duration-300 gap-4">
                <div className="w-14 h-14 bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-200 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <span className="text-[10px] font-semibold text-slate-400 leading-none">ID</span>
                  <span className="text-lg font-semibold text-indigo-600 leading-tight">#{order.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-lg truncate leading-tight">{order.customerName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg">{order.pickupTime}h</span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <PackageCheck size={10}/> {order.products.length} {order.products.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>
                </div>
                <div className={`hidden sm:flex px-4 py-2 rounded-xl text-[9px] font-semibold uppercase tracking-widest border shrink-0 ${
                  order.status === 'Recibido' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                  order.status === 'En elaboración' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {order.status}
                </div>
              </div>
            )) : (
              <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                <CalendarDays size={32} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-semibold text-xs uppercase tracking-widest">Sin entregas para hoy</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1a1c2c] rounded-[2.5rem] shadow-2xl p-8 text-white flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <TrendingUp size={160} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-400/30">
                <Sparkles className="text-indigo-400" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-tight leading-none">Consultor IA</h3>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-[0.2em] mt-1">Visión Estratégica</p>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] bg-white/5 rounded-3xl p-6 mb-8 border border-white/10 text-sm text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scroll prose prose-invert prose-sm">
              {loadingAI ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 animate-pulse">Analizando Producción...</p>
                </div>
              ) : (
                aiAnalysis || "Deja que la IA analice tus datos de venta para darte sugerencias de stock, tendencias y nuevas recetas exclusivas."
              )}
            </div>

            <button 
              onClick={handleAIAnalysis} 
              disabled={loadingAI || orders.length === 0} 
              className="group w-full bg-indigo-600 text-white font-semibold py-4 rounded-2xl transition-all shadow-xl hover:bg-indigo-500 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-amber-400 group-hover:animate-pulse"/>
              Generar Estrategia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600 shadow-indigo-500/20',
    amber: 'bg-amber-500 shadow-amber-500/20',
    violet: 'bg-violet-600 shadow-violet-500/20',
    emerald: 'bg-emerald-600 shadow-emerald-500/20'
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-xl transition-all duration-500 group">
      <div className={`${colorMap[color]} p-5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
        <p className="text-3xl font-semibold text-slate-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;