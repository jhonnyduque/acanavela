import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storageService } from './services/storageService';
import { Order, Customer, AppUser } from './types';

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
  Users,
  MessageCircle,
  Edit3,
  Phone,
  Clock,
  LogOut
} from 'lucide-react';

import { ADMIN_PASSWORD } from './constants';

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
    if (!isAuthenticated) return;
    setOrders(storageService.getOrders());
    setCustomers(storageService.getCustomers());
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
    notifTimerRef.current = window.setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveOrder = (order: Order) => {
    const existingCustomer = customers.find(c => c.phone === order.customerPhone);
    if (!existingCustomer) {
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: order.customerName,
        phone: order.customerPhone,
        createdAt: new Date().toISOString()
      };
      const nextCustomers = [...customers, newCustomer];
      setCustomers(nextCustomers);
      storageService.saveCustomers(nextCustomers);
    }

    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      const next = exists
        ? prev.map(o => (o.id === order.id ? order : o))
        : [...prev, { ...order, id: prev.length ? Math.max(...prev.map(o => o.id)) + 1 : 1 }];

      storageService.saveOrders(next);
      return next;
    });

    showNotification(editingOrder ? 'Pedido actualizado' : 'Pedido registrado', 'success');
    setEditingOrder(null);
    setActiveTab('orders');
  };

  const startDeleteAction = (ids: number[]) => {
    const hasAdvanced = orders.some(o => ids.includes(o.id) && o.status !== 'Recibido' && o.status !== 'Entregado');
    setSecurityModal({ isOpen: true, ids, requiresPassword: hasAdvanced });
    setAdminPassInput('');
  };

  const confirmDeletion = () => {
    if (securityModal.requiresPassword && adminPassInput !== ADMIN_PASSWORD) {
      showNotification('Contraseña incorrecta', 'error');
      return;
    }
    const updated = orders.filter(o => !securityModal.ids.includes(o.id));
    setOrders(updated);
    storageService.saveOrders(updated);
    showNotification('Pedido eliminado', 'warn');
    setSecurityModal({ isOpen: false, ids: [], requiresPassword: false });
  };

  const menuItems = useMemo(() => [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'register', label: 'Nuevo Pedido', icon: PlusCircle },
    { id: 'orders', label: 'Pedidos', icon: ListOrdered },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'stats', label: 'Informes', icon: BarChart3 },
    { id: 'config', label: 'Ajustes', icon: Settings }
  ], []);

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 🔔 NOTIFICACIONES */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-full max-w-[320px]">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-emerald-500 text-white' :
            notification.type === 'error' ? 'bg-rose-500 text-white' :
            'bg-amber-500 text-white'
          }`}>
            {notification.type === 'success' ? <CheckCircle size={20}/> :
             notification.type === 'error' ? <XCircle size={20}/> :
             <AlertTriangle size={20}/>}
            <p className="font-semibold text-sm">{notification.msg}</p>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Acanavela</h1>
              <p className="text-xs text-slate-400 uppercase">Obrador</p>
            </div>
            <button onClick={toggleSidebar} className="lg:hidden"><X /></button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'register') setEditingOrder(null);
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl ${
                  activeTab === item.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <item.icon size={20} /> {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-slate-400 mb-2">Identificado como</p>
            <p className="font-semibold text-emerald-400 truncate mb-3">{currentUser.name}</p>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 text-rose-400 hover:text-white">
              <LogOut size={20}/> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b flex items-center px-4">
          <button onClick={toggleSidebar} className="lg:hidden mr-4"><Menu /></button>
          <div className="flex-1 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
            <button
              onClick={() => { setEditingOrder(null); setActiveTab('register'); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl"
            >
              <Plus size={16}/> Nuevo Pedido
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard orders={orders} />}
          {activeTab === 'register' && <OrderForm onSave={handleSaveOrder} customers={customers} editingOrder={editingOrder} onCancel={() => setActiveTab('orders')} />}
          {activeTab === 'orders' && <OrderList orders={orders} onDelete={id => startDeleteAction([id])} onEdit={setEditingOrder} onView={setViewingOrder} />}
          {activeTab === 'customers' && <CustomerList customers={customers} orders={orders} onSave={c => { setCustomers(c); storageService.saveCustomers(c); }} />}
          {activeTab === 'calendar' && <CalendarView orders={orders} />}
          {activeTab === 'stats' && <StatsView orders={orders} />}
          {activeTab === 'config' && <ConfigView currentUser={currentUser} orders={orders} />}
        </main>
      </div>

      {/* MODAL ELIMINAR */}
      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full">
            <h3 className="font-bold mb-4">Confirmar eliminación</h3>
            {securityModal.requiresPassword && (
              <input
                type="password"
                value={adminPassInput}
                onChange={e => setAdminPassInput(e.target.value)}
                className="w-full p-3 border rounded-xl mb-4"
                placeholder="PIN Admin"
              />
            )}
            <div className="flex gap-3">
              <button onClick={confirmDeletion} className="flex-1 bg-rose-500 text-white p-3 rounded-xl">Eliminar</button>
              <button onClick={() => setSecurityModal({ isOpen: false, ids: [], requiresPassword: false })} className="flex-1 bg-slate-100 p-3 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
