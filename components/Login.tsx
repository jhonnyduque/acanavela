import React, { useState } from 'react';
import { User, KeyRound, AlertCircle, Info } from 'lucide-react';
import { storageService } from '../services/storageService';
import { AppUser } from '../types';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usuario de respaldo para pruebas o primer acceso
  const MASTER_USER: AppUser = {
    id: 'master-admin',
    name: 'Administrador Pro',
    username: 'admin',
    pin: '2025',
    role: 'ADMIN',
    isActive: true
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    try {
      // Intentamos obtener usuarios de Supabase
      const users = await storageService.getUsers().catch(() => []);
      
      let foundUser = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase().trim() && 
        u.pin === password &&
        u.isActive
      );

      // Si no hay usuarios en la DB o falló la conexión, permitimos el admin maestro
      if (!foundUser && username.toLowerCase().trim() === MASTER_USER.username && password === MASTER_USER.pin) {
        foundUser = MASTER_USER;
      }

      if (foundUser) {
        onLogin(foundUser);
      } else {
        setError(true);
      }
    } catch (err) {
      // Si todo falla pero es el admin maestro, dejamos pasar
      if (username.toLowerCase().trim() === MASTER_USER.username && password === MASTER_USER.pin) {
        onLogin(MASTER_USER);
      } else {
        setError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#11132d] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[4rem] p-12 md:p-16 shadow-2xl flex flex-col items-center animate-in zoom-in-95">
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-semibold mb-8 shadow-xl shadow-indigo-500/20">A</div>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">A Canavela Fritida</h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Gestión de Obrador Pro</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
            <div className="relative">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                required 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full pl-16 pr-8 py-5 bg-[#f8fafc] border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all font-medium" 
                placeholder="admin" 
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pin de acceso</label>
            <div className="relative">
              <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                required 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-16 pr-8 py-5 bg-[#f8fafc] border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all tracking-[0.5em] font-bold" 
                placeholder="••••" 
                maxLength={4}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p className="text-[10px] font-bold uppercase tracking-tight">Credenciales incorrectas</p>
            </div>
          )}

          <div className="pt-2">
            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-[2rem] shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Autenticando..." : "Entrar al Sistema"}
            </button>
          </div>
        </form>

        <div className="mt-12 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
          <Info className="text-indigo-400 shrink-0" size={20} />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Acceso Demo</p>
            <p className="text-xs text-slate-500 leading-relaxed">Usa <b>admin</b> y PIN <b>2025</b> para explorar el sistema mientras conectas tu base de datos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;