import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storageService } from './services/storageService';
import { Order, Customer, AppUser, OrderStatus } from './types';

import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import CalendarView from './components/CalendarView';
import StatsView from './components/StatsView';
import ConfigView from './components/ConfigView';
import CustomerList from './components/CustomerList';
import Login from './components/Login';

import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Calendar as CalendarIcon,
  BarChart3,
  Settings,
  Menu,
  X,
  Printer,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
  MessageCircle,
  Edit3,
  Phone,
  Clock,
  Calendar,
  ExternalLink,
  LogOut
} from 'lucide-react';

import { ADMIN_PASSWORD, ORDER_STATUSES } from './constants';

type NoticeType = 'success' | 'error' | 'warn';

interface SecurityModalState {
  isOpen: boolean;
  ids: number[];
  requiresPassword: boolean;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('acanavela_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return (
      localStorage.getItem('acanavela_auth') === 'true' &&
      localStorage.getItem('acanavela_user') !== null
    );
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'orders' | 'calendar' | 'stats' | 'config' | 'customers'
  >('dashboard');

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const [securityModal, setSecurityModal] = useState<SecurityModalState>({
    isOpen: false,
    ids: [],
    requiresPassword: false
  });

  const [adminPassInput, setAdminPassInput] = useState('');

  const [notification, setNotification] = useState<{
    msg: string;
    type: NoticeType;
    id: number;
  } | null>(null);

  const notifTimerRef = useRef<number | null>(null);
  const notifIdRef = useRef(1);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  useEffect(() => {
    if (isAuthenticated) {
      setOrders(storageService.getOrders());
      setCustomers(storageService.getCustomers());
    }
  }, [isAuthenticated]);

  const handleLogin = (user: AppUser) => {
    localStorage.setItem('acanavela_auth', 'true');
    localStorage.setItem('acanavela_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!window.confirm('¿Deseas cerrar la sesión actual?')) return;
    localStorage.removeItem('acanavela_auth');
    localStorage.removeItem('acanavela_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const showNotification = (msg: string, type: NoticeType = 'success') => {
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current);
    const id = notifIdRef.current++;
    setNotification({ msg, type, id });
    notifTimerRef.current = window.setTimeout(() => {
      setNotification(null);
      notifTimerRef.current = null;
    }, 3500);
  };

  const handleSaveOrder = (order: Order) => {
    const existingCustomer = customers.find(c => c.phone === order.customerPhone);
    if (!existingCustomer) {
      const newCustomer: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name: order.customerName,
        phone: order.customerPhone,
        createdAt: new Date().toISOString()
      };
      const updatedCustomers = [...customers, newCustomer];
      setCustomers(updatedCustomers);
      storageService.saveCustomers(updatedCustomers);
    }

    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      let nextOrders;
      if (exists) {
        nextOrders = prev.map(o => (o.id === order.id ? order : o));
      } else {
        const lastId = prev.reduce((max, o) => (o.id > max ? o.id : max), 0);
        order.id = lastId + 1;
        nextOrders = [...prev, order];
      }
      storageService.saveOrders(nextOrders);
      return nextOrders;
    });

    showNotification(editingOrder ? 'Pedido actualizado' : 'Pedido registrado', 'success');
    setEditingOrder(null);
    setActiveTab('orders');
  };

  const handleEditRequest = (order: Order) => {
    setEditingOrder(order);
    setActiveTab('register');
  };

  const handleSaveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    storageService.saveCustomers(newCustomers);
  };

  const startDeleteAction = (ids: number[]) => {
    const ordersToDelete = orders.filter(o => ids.includes(o.id));
    if (ordersToDelete.length === 0) return;
    const hasAdvanced = ordersToDelete.some(o => o.status !== 'Recibido' && o.status !== 'Entregado');
    setSecurityModal({ isOpen: true, ids, requiresPassword: hasAdvanced });
    setAdminPassInput('');
  };

  const confirmDeletion = () => {
    if (securityModal.requiresPassword) {
      if (adminPassInput !== ADMIN_PASSWORD) {
        showNotification('Contraseña incorrecta', 'error');
        return;
      }
    }
    const idsToRemove = securityModal.ids;
    setOrders(prev => {
      const updated = prev.filter(o => !idsToRemove.includes(o.id));
      storageService.saveOrders(updated);
      return updated;
    });
    showNotification(idsToRemove.length > 1 ? `${idsToRemove.length} pedidos eliminados` : 'Pedido eliminado', 'warn');
    setSecurityModal({ isOpen: false, ids: [], requiresPassword: false });
  };

  const handlePrintOrder = (order: Order) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
            body { font-family: 'Courier Prime', monospace; padding: 20px; color: #000; max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
            .order-id { font-size: 28px; font-weight: 700; margin: 10px 0; }
            .section { margin-bottom: 25px; }
            .label { font-size: 11px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #000; display: inline-block; margin-bottom: 8px; }
            .val { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
            .product-card { padding: 15px 0; border-bottom: 1px dashed #ccc; }
            .portions { float: right; border: 1px solid #000; padding: 2px 8px; font-size: 14px; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; border-top: 1px solid #000; pt: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>A CANAVELA FRITIDA</div>
            <div class="order-id">ORDEN #${order.id}</div>
            <div>ENTREGA: ${order.pickupDate} @ ${order.pickupTime}</div>
          </div>
          <div class="section">
            <div class="label">CLIENTE</div>
            <div class="val">${order.customerName.toUpperCase()}</div>
            <div>Tel: ${order.customerPhone}</div>
          </div>
          <div class="section">
            <div class="label">PRODUCTOS</div>
            ${order.products.map(p => `
              <div class="product-card">
                <span class="portions">${p.portions} RACIONES</span>
                <div style="font-size: 18px; font-weight: 700;">${p.type.toUpperCase()}</div>
                <div>BASE: ${p.edge} | RELLENO: ${p.filling}</div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const menuItems = useMemo(() => [
    { id: 'dashboard' as const, label: 'Inicio', icon: LayoutDashboard },
    { id: 'register' as const, label: 'Nuevo Pedido', icon: PlusCircle },
    { id: 'orders' as const, label: 'Pedidos', icon: ListOrdered },
    { id: 'customers' as const, label: 'Clientes', icon: Users },
    { id: 'calendar' as const, label: 'Calendario', icon: CalendarIcon },
    { id: 'stats' as const, label: 'Informes', icon: BarChart3 },
    { id: 'config' as const, label: 'Ajustes', icon: Settings }
  ], []);

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-[320px] animate-in slide-in-from-top-4">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
            notification.type === 'error' ? 'bg-rose-500 text-white border-rose-400' :
            'bg-amber-500 text-white border-amber-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20}/> : notification.type === 'error' ? <XCircle size={20}/> : <AlertTriangle size={20}/>}
            <p className="font-semibold text-sm">{notification.msg}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR RESPONSIVO */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static border-r border-slate-800 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-semibold text-xl">A</div>
              <div><h1 className="text-xl font-semibold tracking-tighter">Acanavela</h1><p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Obrador</p></div>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
          </div>
          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scroll">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if (isSidebarOpen) toggleSidebar(); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={22} /><span className="font-medium text-[15px]">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800/50">
             <div className="px-5 py-4 mb-2">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-1">Identificado como</p>
                <p className="text-sm font-semibold text-emerald-400 truncate">{currentUser.name}</p>
             </div>
            <button 
              onClick={(e) => handleLogout(e)} 
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all group"
            >
              <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
              <span className="font-medium text-[15px]">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* BACKDROP PARA MÓVIL */}
      {isSidebarOpen && (
        <div onClick={toggleSidebar} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"></div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER RESPONSIVO */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 no-print shrink-0">
          <button onClick={toggleSidebar} className="lg:hidden mr-4 p-2.5 rounded-xl bg-slate-100 text-slate-600 active:scale-90 transition-transform"><Menu size={24} /></button>
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest truncate">{menuItems.find(m => m.id === activeTab)?.label}</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab('register')} className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <Plus size={16} /> <span className="hidden sm:inline">Nuevo Pedido</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scroll">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === 'dashboard' && <Dashboard orders={orders} onGoToOrders={() => setActiveTab('orders')} />}
            {activeTab === 'register' && <OrderForm onSave={handleSaveOrder} customers={customers} editingOrder={editingOrder} onCancel={() => { setEditingOrder(null); setActiveTab('orders'); }} />}
            {activeTab === 'orders' && <OrderList orders={orders} onDelete={id => startDeleteAction([id])} onBulkDelete={startDeleteAction} onUpdateStatus={(id, s) => {
               const updated = orders.map(o => o.id === id ? {...o, status: s} : o);
               setOrders(updated);
               storageService.saveOrders(updated);
               showNotification(`Estado: ${s}`, 'success');
            }} onEdit={handleEditRequest} onView={setViewingOrder} />}
            {activeTab === 'customers' && <CustomerList customers={customers} orders={orders} onSave={handleSaveCustomers} onNewOrder={() => setActiveTab('register')} />}
            {activeTab === 'calendar' && <CalendarView orders={orders} onOrderClick={setViewingOrder} />}
            {activeTab === 'stats' && <StatsView orders={orders} />}
            {activeTab === 'config' && <ConfigView currentUser={currentUser} orders={orders} onImport={newOrders => { setOrders(newOrders); storageService.saveOrders(newOrders); showNotification('Base de datos restaurada', 'success'); }} onUpdateUser={(updated) => {
               if(currentUser && currentUser.id === updated.id) {
                 setCurrentUser(updated);
                 localStorage.setItem('acanavela_user', JSON.stringify(updated));
               }
               showNotification('Perfil actualizado', 'success');
            }} />}
          </div>
        </main>
      </div>

      {/* MODAL DETALLE DE PEDIDO (Optimizado Responsive) */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] w-full max-w-2xl shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 border border-slate-100 max-h-[92vh] flex flex-col">
            
            <div className="bg-[#0f172a] p-6 md:p-10 flex items-center justify-between relative shrink-0">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#10b981] rounded-xl md:rounded-2xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-lg">
                  #{viewingOrder.id}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl md:text-3xl font-bold text-white tracking-tight truncate">{viewingOrder.customerName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{viewingOrder.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingOrder(null)} className="p-2 text-white/50 hover:text-white transition-colors">
                <X size={28}/>
              </button>
            </div>

            <div className="p-6 md:p-10 space-y-8 overflow-y-auto custom-scroll flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-[#f8fafc] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Contacto</p>
                  <div className="flex items-center gap-3 text-slate-800 font-bold text-lg md:text-xl mb-3">
                    <Phone size={20} className="text-emerald-500" /> {viewingOrder.customerPhone}
                  </div>
                  <a 
                    href={`https://wa.me/34${viewingOrder.customerPhone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:underline w-fit"
                  >
                    <MessageCircle size={16}/> WhatsApp
                  </a>
                </div>

                <div className="bg-[#f8fafc] p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recogida</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 text-slate-800 font-bold text-lg md:text-xl">
                      <CalendarIcon size={20} className="text-indigo-500" /> {viewingOrder.pickupDate}
                    </div>
                    <div className="flex items-center gap-3 text-slate-800 font-bold text-lg md:text-xl">
                      <Clock size={20} className="text-indigo-500" /> {viewingOrder.pickupTime} h
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Productos del Pedido</p>
                <div className="space-y-3">
                  {viewingOrder.products.map((p, idx) => (
                    <div key={idx} className="p-5 md:p-6 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1">
                        <h4 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{p.type}</h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2.5 py-1 bg-slate-50 text-[9px] font-bold text-slate-500 rounded-lg border border-slate-100 uppercase">{p.edge}</span>
                          <span className="px-2.5 py-1 bg-slate-50 text-[9px] font-bold text-slate-500 rounded-lg border border-slate-100 uppercase">{p.filling}</span>
                          {p.glutenFree && (
                            <span className="px-2.5 py-1 bg-amber-50 text-[9px] font-bold text-amber-600 rounded-lg border border-amber-100">SIN GLUTEN</span>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 shrink-0">
                        {p.portions} Raciones
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 shrink-0">
                <button 
                  onClick={() => handlePrintOrder(viewingOrder)} 
                  className="flex-1 py-4 md:py-5 bg-[#0f172a] text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-sm md:text-lg"
                >
                  <Printer size={20}/> Imprimir
                </button>
                <button 
                  onClick={() => {
                    handleEditRequest(viewingOrder);
                    setViewingOrder(null);
                  }} 
                  className="flex-1 py-4 md:py-5 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all text-sm md:text-lg"
                >
                  <Edit3 size={20}/> Editar
                </button>
                <button 
                  onClick={() => setViewingOrder(null)} 
                  className="sm:px-8 py-4 md:py-5 bg-[#f1f5f9] text-[#64748b] font-bold rounded-2xl active:scale-95 transition-all text-sm md:text-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[350] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 md:p-10 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><ShieldAlert size={32}/></div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Confirmar Eliminación</h3>
            <p className="text-sm text-slate-500 mb-8">Vas a eliminar {securityModal.ids.length} registro(s).</p>
            {securityModal.requiresPassword && (
              <input type="password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl mb-4 font-bold text-center tracking-widest" placeholder="PIN Admin" />
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={confirmDeletion} className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl active:scale-95 transition-transform">Eliminar</button>
              <button onClick={() => setSecurityModal({isOpen: false, ids: [], requiresPassword: false})} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl active:scale-95 transition-transform">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;