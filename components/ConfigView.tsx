import React, { useState, useEffect } from 'react';
import { Order, AppUser, UserRole, AuditLogEntry } from '../types';
import { storageService } from '../services/storageService';
import { 
  Database, Download, Upload, Lock, Shield, Users, UserPlus, 
  Edit3, X, Save, History, Clock, UserCheck, 
  Smartphone, Globe, ExternalLink, Share, Monitor, CheckCircle2
} from 'lucide-react';

interface ConfigViewProps {
  currentUser: AppUser;
  orders: Order[];
  onImport: (orders: Order[]) => void;
  onUpdateUser: (updated: AppUser) => void;
}

const ConfigView: React.FC<ConfigViewProps> = ({ currentUser, orders, onImport, onUpdateUser }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    setUsers(storageService.getUsers());
    setLogs(storageService.getLogs());
  }, []);

  const handleSaveUser = (u: AppUser) => {
    let nextUsers;
    
    if (isAddingUser) {
      const newUser = { ...u, id: Math.random().toString(36).substr(2, 9), isActive: true };
      nextUsers = [...users, newUser];
      storageService.addLog({
        action: `Usuario nuevo creado`,
        performedBy: currentUser.name,
        targetUser: newUser.name
      });
    } else {
      nextUsers = users.map(user => user.id === u.id ? u : user);
      storageService.addLog({
        action: `Perfil actualizado`,
        performedBy: currentUser.name,
        targetUser: u.name
      });
    }
    
    setUsers(nextUsers);
    storageService.saveUsers(nextUsers);
    setLogs(storageService.getLogs());
    onUpdateUser(u);
    setEditingUser(null);
    setIsAddingUser(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(orders, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `Acanavela_Backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const toggleUserActive = (id: string) => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.id === id);
    if (!targetUser || targetUser.username === 'admin') return;

    const nextStatus = !targetUser.isActive;
    const updated = users.map(u => u.id === id ? { ...u, isActive: nextStatus } : u);
    
    storageService.addLog({
      action: nextStatus ? 'Usuario activado' : 'Usuario desactivado',
      performedBy: currentUser.name,
      targetUser: targetUser.name
    });

    setUsers(updated);
    storageService.saveUsers(updated);
    setLogs(storageService.getLogs());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in pb-24">
      
      {/* 1. GESTIÓN DE EQUIPO (MÁXIMA PRIORIDAD) */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Users size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestión de Equipo</h2>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Roles y permisos de acceso</p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => {
                setIsAddingUser(true);
                setEditingUser({ id: '', name: '', username: '', pin: '', role: 'VENDOR', isActive: true });
              }}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-100 transition-all text-sm"
            >
              <UserPlus size={18} /> Nuevo Usuario
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              currentUserId={currentUser.id}
              canEdit={isAdmin || currentUser.id === user.id}
              canDeactivate={isAdmin}
              onEdit={() => setEditingUser(user)}
              onToggleActive={() => toggleUserActive(user.id)} 
            />
          ))}
        </div>
      </div>

      {/* 2. REGISTRO DE ACTIVIDAD */}
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Registro de Actividad</h2>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Últimas acciones realizadas</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-8 py-5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-8 py-5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Acción</th>
                <th className="px-8 py-5 text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.slice(0, 8).map((log) => (
                <tr key={log.id} className="hover:bg-white/50 transition-colors">
                  <td className="px-8 py-5 text-xs font-medium text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-600">{log.action}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-semibold text-slate-800">{log.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. COPIA DE SEGURIDAD Y SEGURIDAD (GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Copia de Seguridad */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <Database size={24}/>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Copia de Seguridad</h2>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gestión de datos local</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={handleExport} className="flex flex-col items-center justify-center gap-4 py-8 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Download size={24} className="text-emerald-600" /></div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 group-hover:text-emerald-600">Exportar Datos</span>
              </button>
              <label className="flex flex-col items-center justify-center gap-4 py-8 bg-slate-50 border border-slate-100 rounded-[2rem] hover:bg-indigo-50 hover:border-indigo-200 transition-all group cursor-pointer">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform"><Upload size={24} className="text-indigo-600" /></div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 group-hover:text-indigo-600">Importar Datos</span>
                <input type="file" className="hidden" onChange={e => {/* Logic de importación */}}/>
              </label>
            </div>
        </div>

        {/* Auditoría y Seguridad */}
        <div className="bg-[#2D2E7C] text-white p-10 rounded-[2.5rem] relative overflow-hidden flex flex-col justify-center shadow-xl">
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <Shield size={24}/>
                </div>
                <h2 className="text-xl font-semibold tracking-tight leading-none">Seguridad del Sistema</h2>
              </div>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed mb-6">
                El sistema utiliza cifrado local para proteger tu base de datos y sesiones. Solo los administradores pueden gestionar pedidos críticos y eliminar registros.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl w-fit">
                <CheckCircle2 size={14} /> Sistema Protegido
              </div>
           </div>
           <Lock size={140} className="absolute bottom-[-10%] right-[-5%] opacity-10" />
        </div>
      </div>

      {/* 4. USO ONLINE E INSTALACIÓN (ÚLTIMA PRIORIDAD) */}
      <div className="bg-[#1a1c2c] rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-1000 pointer-events-none">
          <Globe size={240} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-12">
          {/* Icono Principal */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <Smartphone size={40} className="text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-10">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight">Uso Online e Instalación</h2>
              <p className="text-emerald-400 font-semibold text-xs uppercase tracking-[0.3em] mt-2">Convierte esta web en tu app</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Columna 1: Hosting */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-emerald-400" />
                  <h3 className="text-lg font-semibold uppercase tracking-widest text-white/90">1. ¿Cómo subirla a internet?</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Para usarla en varios dispositivos, debes subir este código a un hosting. Servicios como <span className="text-white font-medium">Vercel</span> o <span className="text-white font-medium">Netlify</span> te permiten hacerlo gratis en 2 minutos simplemente arrastrando la carpeta del proyecto.
                </p>
                <div className="flex gap-4">
                  <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-semibold text-xs uppercase tracking-widest">
                    Vercel <ExternalLink size={14} />
                  </a>
                  <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all font-semibold text-xs uppercase tracking-widest">
                    Netlify <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Columna 2: PWA */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Smartphone size={20} className="text-emerald-400" />
                  <h3 className="text-lg font-semibold uppercase tracking-widest text-white/90">2. ¿Cómo "Descargarla"?</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                  Una vez la tengas en una URL online, abre la página en tu móvil y sigue estos pasos:
                </p>
                <div className="grid grid-cols-1 gap-4 text-xs">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-emerald-400 font-semibold uppercase mb-1">iOS (Safari):</p>
                      <p className="text-slate-300">Pulsa el botón <Share size={12} className="inline mx-1"/> y luego <span className="text-white font-medium">"Añadir a pantalla de inicio"</span>.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-emerald-400 font-semibold uppercase mb-1">Android (Chrome):</p>
                      <p className="text-slate-300">Pulsa el menú <span className="text-white font-medium">⋮</span> y elige <span className="text-white font-medium">"Instalar aplicación"</span>.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditProfileModal 
          user={editingUser} 
          onClose={() => { setEditingUser(null); setIsAddingUser(false); }} 
          onSave={handleSaveUser}
          isNew={isAddingUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

const UserCard: React.FC<{ 
  user: AppUser;
  currentUserId: string;
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}> = ({ user, currentUserId, canEdit, canDeactivate, onEdit, onToggleActive }) => {
  const roleLabels: Record<UserRole, string> = { ADMIN: 'ADMIN', MANAGER: 'ENCARGADO', VENDOR: 'VENDEDOR' };
  const roleColors: Record<UserRole, string> = { ADMIN: 'bg-[#2D2E7C] text-white', MANAGER: 'bg-amber-500 text-white', VENDOR: 'bg-slate-200 text-slate-600' };

  return (
    <div className={`p-8 rounded-3xl border border-slate-100 shadow-sm relative transition-all ${!user.isActive ? 'opacity-50 grayscale' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-6">
        <span className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest ${roleColors[user.role]}`}>{roleLabels[user.role]}</span>
        {user.role !== 'ADMIN' && canDeactivate && (
          <button onClick={onToggleActive} className={`text-[9px] font-semibold uppercase tracking-widest ${user.isActive ? 'text-rose-500' : 'text-emerald-500'}`}>{user.isActive ? 'Desactivar' : 'Activar'}</button>
        )}
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">{user.name}</h3>
          {currentUserId === user.id && <span className="bg-emerald-100 text-emerald-600 text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase">TÚ</span>}
        </div>
        <p className="text-xs font-medium text-slate-400">@{user.username}</p>
      </div>
      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="text-[10px] font-medium text-slate-400">PIN: <span className="text-slate-900 ml-1">****</span></div>
        {canEdit && <button onClick={onEdit} className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all"><Edit3 size={16} /></button>}
      </div>
    </div>
  );
};

const EditProfileModal: React.FC<{ user: AppUser; onClose: () => void; onSave: (u: AppUser) => void; isNew: boolean; isAdmin: boolean; }> = ({ user, onClose, onSave, isNew, isAdmin }) => {
  const [formData, setFormData] = useState<AppUser>(user);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 flex items-center justify-between pb-4">
          <h3 className="text-2xl font-semibold text-slate-900">{isNew ? 'Nuevo Usuario' : 'Editar Perfil'}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 pt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input required disabled={!isAdmin && !isNew} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
            <div className="relative">
              <input required disabled={!isNew} type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().trim()})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium text-slate-400" />
              <Lock size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nuevo PIN (4 dígitos)</label>
            <input required type="password" maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-medium text-center tracking-[1em] text-lg" placeholder="••••" />
          </div>
          {isAdmin && (
            <div className="space-y-3">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Rol de Acceso</label>
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                {(['ADMIN', 'MANAGER', 'VENDOR'] as UserRole[]).map((r) => (
                  <button key={r} type="button" onClick={() => setFormData({...formData, role: r})} className={`flex-1 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-widest transition-all ${formData.role === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>
                    {r === 'MANAGER' ? 'Encargado' : r === 'VENDOR' ? 'Vendedor' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4 pt-6">
            <button type="submit" className="flex-[1.5] py-4 bg-indigo-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={20}/> Guardar Cambios</button>
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium rounded-2xl">Cerrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;