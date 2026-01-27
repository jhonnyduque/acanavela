
import React from 'react';
import { ShieldCheck, Database, Lock, Globe, History } from 'lucide-react';

const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Seguridad y privacidad</h1>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Normativa interna y manejo de datos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sección 1 */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Datos en este dispositivo</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            La información se guarda en este dispositivo para operar la pastelería.
          </p>
        </div>

        {/* Sección 2 */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Acceso por usuario</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Cada usuario accede con su PIN según permisos asignados.
          </p>
        </div>

        {/* Sección 3 */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Globe size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Cookies técnicas</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            La aplicación puede usar almacenamiento técnico necesario para funcionar.
          </p>
        </div>

        {/* Sección 4 */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <History size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Historial</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Los registros históricos se conservan aunque se inactiven productos, contornos o rellenos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyView;
