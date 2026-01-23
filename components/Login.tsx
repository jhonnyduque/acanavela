import React, { useState } from 'react';
import { User, KeyRound, AlertCircle } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(false);

    const users = storageService.getUsers();
    const foundUser = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase().trim() && 
      u.isActive
    );

    setTimeout(() => {
      if (foundUser && foundUser.pin === password) {
        onLogin(foundUser);
      } else {
        setError(true);
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#11132d] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[4rem] p-12 md:p-16 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)] flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Logo "A" */}
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-semibold shadow-xl shadow-indigo-500/30 mb-8 select-none">
          A
        </div>

        {/* Títulos */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight mb-2">A Canavela Fritida</h1>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Portal de acceso obrador</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Usuario */}
          <div className="space-y-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Usuario</label>
            <div className="relative">
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-8 pr-14 py-5 bg-[#f8fafc] border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 text-slate-700 font-medium transition-all placeholder:text-slate-300"
                placeholder="Nombre de usuario"
              />
              <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            </div>
          </div>

          {/* PIN de Acceso */}
          <div className="space-y-3">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Pin de acceso</label>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-14 py-5 bg-[#f8fafc] border border-slate-100 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 text-slate-700 font-medium tracking-[0.5em] transition-all placeholder:text-slate-300"
                placeholder="* * * *"
              />
              <KeyRound className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-500 animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p className="text-[10px] font-semibold uppercase tracking-widest">Credenciales incorrectas</p>
            </div>
          )}

          {/* Botón */}
          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-[2rem] transition-all shadow-2xl shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-3 text-lg"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              "Entrar al Sistema"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;