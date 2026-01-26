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

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    localStorage.getItem('acanavela_auth') === 'true' &&
    localStorage.getItem('acanavela_user') !== null
  );

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'orders' | 'calendar' | 'stats' | 'config' | 'customers'
  >('dashboard');

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  /** 🔐 BLINDAJE CLAVE (evita pantalla blanca) */
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

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

  const toggleSidebar = () => setIsSidebarOpen(p => !p);

  useEffect(() => {
    if (isAuthenticated) {
      setOrders(storageService.getOrders() || []);
      setCustomers(storageService.getCustomers() || []);
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
    localStorage.clear();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsSidebarOpen(false);
  };

  const showNotification = (msg: string, type: NoticeType = 'success') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    const id = notifIdRef.current++;
    setNotification({ msg, type, id });
    notifTimerRef.current = window.setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveOrder = (order: Order) => {
    const existingCustomer = safeCustomers.find(c => c.phone === order.customerPhone);

    if (!existingCustomer) {
      const updatedCustomers = [
        ...safeCustomers,
        {
          id: crypto.randomUUID(),
          name: order.customerName,
          phone: order.customerPhone,
          createdAt: new Date().toISOString()
        }
      ];
      setCustomers(updatedCustomers);
      storageService.saveCustomers(updatedCustomers);
    }

    setOrders(prev => {
      const base = Array.isArray(prev) ? prev : [];
      const exists = base.some(o => o.id === order.id);
      const next = exists
        ? base.map(o => (o.id === order.id ? order : o))
        : [...base, { ...order, id: base.length ? Math.max(...base.map(o => o.id)) + 1 : 1 }];

      storageService.saveOrders(next);
      return next;
    });

    showNotification(editingOrder ? 'Pedido actualizado' : 'Pedido registrado');
    setEditingOrder(null);
    setActiveTab('orders');
  };

  const startDeleteAction = (ids: number[]) => {
    const targets = safeOrders.filter(o => ids.includes(o.id));
    if (!targets.length) return;
    const requiresPassword = targets.some(o => o.status !== 'Recibido' && o.status !== 'Entregado');
    setSecurityModal({ isOpen: true, ids, requiresPassword });
    setAdminPassInput('');
  };

  const confirmDeletion = () => {
    if (securityModal.requiresPassword && adminPassInput !== ADMIN_PASSWORD) {
      showNotification('Contraseña incorrecta', 'error');
      return;
    }
    const remaining = safeOrders.filter(o => !securityModal.ids.includes(o.id));
    setOrders(remaining);
    storageService.saveOrders(remaining);
    showNotification('Pedido(s) eliminado(s)', 'warn');
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
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition`}>
        <nav className="p-6 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl ${
                activeTab === item.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl">
            <LogOut size={20}/> Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && <Dashboard orders={safeOrders} onGoToOrders={() => setActiveTab('orders')} />}
        {activeTab === 'register' && <OrderForm onSave={handleSaveOrder} customers={safeCustomers} editingOrder={editingOrder} onCancel={() => setActiveTab('orders')} />}
        {activeTab === 'orders' && <OrderList orders={safeOrders} onDelete={id => startDeleteAction([id])} onBulkDelete={startDeleteAction} onEdit={setEditingOrder} onView={setViewingOrder} onNewOrder={() => setActiveTab('register')} />}
        {activeTab === 'customers' && <CustomerList customers={safeCustomers} orders={safeOrders} onSave={setCustomers} onNewOrder={() => setActiveTab('register')} />}
        {activeTab === 'calendar' && <CalendarView orders={safeOrders} onOrderClick={setViewingOrder} />}
        {activeTab === 'stats' && <StatsView orders={safeOrders} />}
        {activeTab === 'config' && <ConfigView currentUser={currentUser} orders={safeOrders} onImport={setOrders} onUpdateUser={setCurrentUser} />}
      </main>

      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md text-center">
            <ShieldAlert size={40} className="mx-auto text-rose-500 mb-4"/>
            <p className="mb-4">Eliminar {securityModal.ids.length} pedido(s)</p>
            {securityModal.requiresPassword && (
              <input type="password" value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)} className="w-full border p-3 rounded-xl mb-4"/>
            )}
            <div className="flex gap-4">
              <button onClick={confirmDeletion} className="flex-1 bg-rose-500 text-white py-3 rounded-xl">Eliminar</button>
              <button onClick={() => setSecurityModal({ isOpen:false, ids:[], requiresPassword:false })} className="flex-1 bg-slate-100 py-3 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
