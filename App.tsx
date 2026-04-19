import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { storageService } from './services/storageService';
import { supabase } from './services/supabaseClient';
import { Order, Customer, AppUser, OrderStatus } from './types';

import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import PrivacyView from './components/PrivacyView';
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
  CheckCircle,
  RefreshCw,
  Users,
  LogOut,
  ShieldCheck
} from 'lucide-react';

import { ADMIN_PASSWORD } from './constants';

const CalendarView = lazy(() => import('./components/CalendarView'));
const StatsView = lazy(() => import('./components/StatsView'));
const ConfigView = lazy(() => import('./components/ConfigView'));

type NoticeType = 'success' | 'error' | 'warn';

interface SecurityModalState {
  isOpen: boolean;
  ids: number[];
  requiresPassword: boolean;
}

const LazyFallback: React.FC<{ text?: string }> = ({ text = 'Cargando...' }) => (
  <div className="w-full bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
    <div className="flex items-center gap-3 text-slate-500">
      <RefreshCw size={18} className="animate-spin text-emerald-500" />
      <span className="font-medium">{text}</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('acanavela_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('acanavela_auth') === 'true' && currentUser !== null;
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'register' | 'orders' | 'calendar' | 'stats' | 'config' | 'customers' | 'privacy'
  >('dashboard');

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const showNotification = (msg: string, type: NoticeType = 'success') => {
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current);
    const id = notifIdRef.current++;
    setNotification({ msg, type, id });
    notifTimerRef.current = window.setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedCustomers] = await Promise.all([
        storageService.getOrders(),
        storageService.getCustomers()
      ]);

      setOrders(fetchedOrders);
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error(err);
      showNotification('Error de conexión con la nube', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshData();

    const ordersSubscription = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refreshData();
      })
      .subscribe();

    const customersSubscription = supabase
      .channel('public:customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(customersSubscription);
    };
  }, [isAuthenticated]);

  const handleLogin = (user: AppUser) => {
    localStorage.setItem('acanavela_auth', 'true');
    localStorage.setItem('acanavela_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (!window.confirm('¿Deseas cerrar la sesión?')) return;
    localStorage.removeItem('acanavela_auth');
    localStorage.removeItem('acanavela_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleSaveOrder = async (order: Order): Promise<void> => {
    setIsLoading(true);

    try {
      const existingCustomer = customers.find(c => c.phone === order.customerPhone);

      if (!existingCustomer) {
        await storageService.saveCustomer({
          id: '',
          name: order.customerName,
          phone: order.customerPhone,
          email: '',
          createdAt: new Date().toISOString()
        });
      }

      await storageService.saveOrder(order);
      await refreshData();

      showNotification(editingOrder ? 'Pedido actualizado' : 'Pedido registrado', 'success');
      setEditingOrder(null);
      setActiveTab('orders');
    } catch (err) {
      console.error('Error al guardar en Supabase:', err);
      showNotification('Error al guardar en Supabase', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeletion = async () => {
    if (securityModal.requiresPassword && adminPassInput !== ADMIN_PASSWORD) {
      showNotification('Contraseña incorrecta', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await storageService.deleteOrders(securityModal.ids);
      await refreshData();
      showNotification('Registros eliminados de la nube', 'warn');
      setSecurityModal({ isOpen: false, ids: [], requiresPassword: false });
      setAdminPassInput('');
    } catch (err) {
      console.error('Error al eliminar datos:', err);
      showNotification('Error al eliminar datos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, s: OrderStatus) => {
    setIsLoading(true);

    try {
      await storageService.updateOrderStatus(id, s);
      await refreshData();
      showNotification(`Estado actualizado a: ${s}`, 'success');
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      showNotification('Error al actualizar estado', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Inicio', icon: LayoutDashboard },
      { id: 'register' as const, label: 'Nuevo Pedido', icon: PlusCircle },
      { id: 'orders' as const, label: 'Pedidos', icon: ListOrdered },
      { id: 'customers' as const, label: 'Clientes', icon: Users },
      { id: 'calendar' as const, label: 'Calendario', icon: CalendarIcon },
      { id: 'stats' as const, label: 'Informes', icon: BarChart3 },
      { id: 'config' as const, label: 'Ajustes', icon: Settings },
      { id: 'privacy' as const, label: 'Seguridad', icon: ShieldCheck }
    ],
    []
  );

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-[400] bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <RefreshCw size={16} className="text-emerald-500 animate-spin" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Nube conectada...
          </span>
        </div>
      )}

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[500] w-full max-w-[320px] animate-in slide-in-from-top-4">
          <div
            className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${notification.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : notification.type === 'error'
                  ? 'bg-rose-500 text-white border-rose-400'
                  : 'bg-amber-500 text-white border-amber-400'
              }`}
          >
            <CheckCircle size={20} />
            <p className="font-semibold text-sm">{notification.msg}</p>
          </div>
        </div>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-800/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-semibold text-xl shadow-lg shadow-emerald-500/20">
                A
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tighter">Acanavela</h1>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                  Backend Live
                </p>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scroll">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id
                    ? 'bg-emerald-500 text-white shadow-xl'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
              >
                <item.icon size={22} />
                <span className="font-medium text-[15px]">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
            >
              <LogOut size={22} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 p-2.5 rounded-xl bg-slate-100"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          <button
            onClick={() => {
              setEditingOrder(null);
              setActiveTab('register');
            }}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Nuevo Pedido</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scroll">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                orders={orders}
                onGoToOrders={() => setActiveTab('orders')}
              />
            )}

            {activeTab === 'register' && (
              <OrderForm
                onSave={handleSaveOrder}
                customers={customers}
                orders={orders}
                editingOrder={editingOrder}
                onCancel={() => {
                  setEditingOrder(null);
                  setActiveTab('orders');
                }}
              />
            )}

            {activeTab === 'orders' && (
              <OrderList
                orders={orders}
                onDelete={id =>
                  setSecurityModal({ isOpen: true, ids: [id], requiresPassword: true })
                }
                onBulkDelete={ids =>
                  setSecurityModal({ isOpen: true, ids, requiresPassword: true })
                }
                onUpdateStatus={handleUpdateStatus}
                onEdit={o => {
                  setEditingOrder(o);
                  setActiveTab('register');
                }}
                onView={setViewingOrder}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerList
                customers={customers}
                orders={orders}
                onSave={async () => {
                  await refreshData();
                }}
              />
            )}

            {activeTab === 'calendar' && (
              <Suspense fallback={<LazyFallback text="Cargando calendario..." />}>
                <CalendarView
                  orders={orders}
                  onOrderClick={setViewingOrder}
                />
              </Suspense>
            )}

            {activeTab === 'stats' && (
              <Suspense fallback={<LazyFallback text="Cargando informes..." />}>
                <StatsView orders={orders} />
              </Suspense>
            )}

            {activeTab === 'config' && (
              <Suspense fallback={<LazyFallback text="Cargando ajustes..." />}>
                <ConfigView
                  currentUser={currentUser}
                  orders={orders}
                  onImport={async () => {
                    await refreshData();
                  }}
                  onUpdateUser={async () => {
                    await refreshData();
                  }}
                  showNotification={showNotification}
                />
              </Suspense>
            )}

            {activeTab === 'privacy' && <PrivacyView />}
          </div>
        </main>
      </div>

      {securityModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-10 animate-in zoom-in-95 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Confirmación de Nube</h3>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción eliminará permanentemente los datos de la base de datos central en Supabase.
            </p>

            {securityModal.requiresPassword && (
              <input
                type="password"
                value={adminPassInput}
                onChange={e => setAdminPassInput(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Contraseña de Administrador"
              />
            )}

            <div className="flex gap-4">
              <button
                onClick={confirmDeletion}
                className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Eliminar Globalmente
              </button>
              <button
                onClick={() =>
                  setSecurityModal({ isOpen: false, ids: [], requiresPassword: false })
                }
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;