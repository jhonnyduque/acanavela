import React, { useEffect, useMemo, useRef, useState } from 'react';
import { storageService } from './services/storageService';
import { orderService } from './services/orderService';

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
    localStorage.getItem('acanavela_auth') === 'true'
  );

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
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [notification, setNotification] = useState<{
    msg: string;
    type: NoticeType;
    id: number;
  } | null>(null);

  const notifTimerRef = useRef<number | null>(null);
  const notifIdRef = useRef(1);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // 🔄 CARGA INICIAL DESDE SUPABASE
  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [ordersDB, customersLS] = await Promise.all([
          orderService.getAll(),
          storageService.getCustomers()
        ]);
        if (!mounted) return;
        setOrders(ordersDB);
        setCustomers(customersLS);
      } catch (e) {
        console.error(e);
        showNotification('Error cargando datos', 'error');
      } finally {
        if (mounted) setIsLoadingData(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const showNotification = (msg: string, type: NoticeType = 'success') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    const id = notifIdRef.current++;
    setNotification({ msg, type, id });
    notifTimerRef.current = window.setTimeout(() => setNotification(null), 3500);
  };

  const handleLogin = (user: AppUser) => {
    localStorage.setItem('acanavela_auth', 'true');
    localStorage.setItem('acanavela_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // 💾 GUARDAR PEDIDO (SUPABASE)
  const handleSaveOrder = async (order: Order) => {
    try {
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
        await storageService.saveCustomers(nextCustomers);
      }

      await orderService.save(order);
      setOrders(await orderService.getAll());

      showNotification(editingOrder ? 'Pedido actualizado' : 'Pedido registrado', 'success');
      setEditingOrder(null);
      setActiveTab('orders');
    } catch (e) {
      console.error(e);
      showNotification('Error guardando pedido', 'error');
    }
  };

  const startDeleteAction = (ids: number[]) => {
    setSecurityModal({ isOpen: true, ids, requiresPassword: false });
    setAdminPassInput('');
  };

  const confirmDeletion = async () => {
    try {
      for (const id of securityModal.ids) {
        await orderService.delete(id);
      }
      setOrders(await orderService.getAll());
      showNotification('Pedido(s) eliminado(s)', 'warn');
      setSecurityModal({ isOpen: false, ids: [], requiresPassword: false });
    } catch (e) {
      console.error(e);
      showNotification('Error eliminando pedidos', 'error');
    }
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
    <div className="flex h-screen bg-slate-50">
      {isLoadingData && <div className="p-4">Cargando datos…</div>}

      {activeTab === 'dashboard' && <Dashboard orders={orders} />}
      {activeTab === 'register' && (
        <OrderForm
          onSave={handleSaveOrder}
          customers={customers}
          editingOrder={editingOrder}
          onCancel={() => setActiveTab('orders')}
        />
      )}
      {activeTab === 'orders' && (
        <OrderList
          orders={orders}
          onDelete={id => startDeleteAction([id])}
          onBulkDelete={startDeleteAction}
          onEdit={setEditingOrder}
          onView={setViewingOrder}
          onUpdateStatus={async (id, status) => {
            const order = orders.find(o => o.id === id);
            if (!order) return;
            await orderService.save({ ...order, status });
            setOrders(await orderService.getAll());
            showNotification(`Estado: ${status}`, 'success');
          }}
        />
      )}
      {activeTab === 'customers' && (
        <CustomerList
          customers={customers}
          orders={orders}
          onSave={async c => {
            setCustomers(c);
            await storageService.saveCustomers(c);
          }}
          onNewOrder={() => setActiveTab('register')}
        />
      )}
      {activeTab === 'calendar' && <CalendarView orders={orders} />}
      {activeTab === 'stats' && <StatsView orders={orders} />}
      {activeTab === 'config' && <ConfigView currentUser={currentUser} orders={orders} />}
    </div>
  );
};

export default App;
