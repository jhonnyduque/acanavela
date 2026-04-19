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
import { createSessionToken, validateSessionToken } from './utils';

import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import OrderDetailsModal from './components/OrderDetailsModal';
import PrivacyView from './components/PrivacyView';
import CustomerList from './components/CustomerList';
import Login from './components/Login';
import PwaUpdatePrompt from './components/PwaUpdatePrompt';

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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

const CalendarView = lazy(() => import('./components/CalendarView'));
const StatsView = lazy(() => import('./components/StatsView'));
const ConfigView = lazy(() => import('./components/ConfigView'));

type NoticeType = 'success' | 'error' | 'warn';

type ActiveTab =
  | 'dashboard'
  | 'register'
  | 'orders'
  | 'calendar'
  | 'stats'
  | 'config'
  | 'customers'
  | 'privacy';

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
    const token = localStorage.getItem('acanavela_session');
    const userId = validateSessionToken(token);
    const savedUser = localStorage.getItem('acanavela_user');

    if (!userId || !savedUser) return false;

    try {
      const user: AppUser = JSON.parse(savedUser);
      return user.id === userId;
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('acanavela_sidebar_collapsed') === 'true';
  });
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('acanavela_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const handleLogin = (user: AppUser) => {
    const token = createSessionToken(user.id);
    localStorage.setItem('acanavela_session', token);
    localStorage.setItem('acanavela_user', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (!window.confirm('¿Deseas cerrar la sesión?')) return;

    localStorage.removeItem('acanavela_session');
    localStorage.removeItem('acanavela_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setIsMobileMoreOpen(false);
    setIsSidebarOpen(false);
  };

  const goToTab = (tab: ActiveTab) => {
    if (tab === 'register') {
      setEditingOrder(null);
    }

    setActiveTab(tab);
    setIsSidebarOpen(false);
    setIsMobileMoreOpen(false);
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

  const handleDuplicateOrder = (order: Order) => {
    const duplicatedOrder: Order = {
      ...order,
      id: 0,
      status: 'Recibido',
      createdAt: new Date().toISOString()
    };

    setViewingOrder(null);
    setEditingOrder(duplicatedOrder);
    setActiveTab('register');
  };

  const confirmDeletion = async () => {
    if (securityModal.requiresPassword) {
      setIsLoading(true);

      try {
        const { data: isValid, error } = await supabase.rpc('verify_admin_password', {
          input_password: adminPassInput.trim()
        });

        if (error || !isValid) {
          showNotification('Contraseña incorrecta', 'error');
          setIsLoading(false);
          return;
        }
      } catch {
        showNotification('Error al verificar contraseña', 'error');
        setIsLoading(false);
        return;
      }
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

  const mobileMainItems = useMemo(
    () => [
      { id: 'dashboard' as const, label: 'Inicio', icon: LayoutDashboard },
      { id: 'register' as const, label: 'Nuevo', icon: PlusCircle },
      { id: 'orders' as const, label: 'Pedidos', icon: ListOrdered },
      { id: 'customers' as const, label: 'Clientes', icon: Users }
    ],
    []
  );

  const mobileMoreItems = useMemo(
    () => [
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
        <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[400] bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
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

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transform transition-all duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isSidebarCollapsed ? 'lg:w-24' : 'lg:w-72'} w-72`}
      >
        <div className="flex flex-col h-full">
          <div
            className={`border-b border-slate-800/50 flex items-center ${isSidebarCollapsed ? 'lg:px-4 lg:py-6 lg:justify-center' : 'p-8 justify-between'
              }`}
          >
            <div
              className={`flex items-center ${isSidebarCollapsed ? 'lg:justify-center' : 'gap-4'
                }`}
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center font-semibold text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                A
              </div>

              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-semibold tracking-tighter">Acanavela</h1>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                    Backend Live
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(prev => !prev)}
                className={`hidden lg:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${isSidebarCollapsed
                    ? 'absolute top-6 right-[-18px] bg-slate-900 border border-slate-800 shadow-xl'
                    : ''
                  }`}
                title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
              >
                {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-slate-300 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <nav
            className={`flex-1 py-8 space-y-1.5 overflow-y-auto custom-scroll ${isSidebarCollapsed ? 'lg:px-3' : 'px-4'
              }`}
          >
            {menuItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToTab(item.id)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-2xl transition-all ${isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-4' : 'gap-4 px-5 py-4'
                  } ${activeTab === item.id
                    ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/15'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
              >
                <item.icon size={22} className="shrink-0" />
                {!isSidebarCollapsed && (
                  <span className="font-medium text-[15px]">{item.label}</span>
                )}
              </button>
            ))}
          </nav>

          <div
            className={`p-4 border-t border-slate-800/50 ${isSidebarCollapsed ? 'lg:px-3' : ''
              }`}
          >
            <button
              type="button"
              onClick={handleLogout}
              title={isSidebarCollapsed ? 'Cerrar Sesión' : undefined}
              className={`w-full flex items-center rounded-2xl text-rose-400 hover:bg-rose-500 hover:text-white transition-all ${isSidebarCollapsed ? 'lg:justify-center lg:px-0 lg:py-4' : 'gap-4 px-5 py-4'
                }`}
            >
              <LogOut size={22} className="shrink-0" />
              {!isSidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 p-2.5 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition-all"
            >
              <Menu size={24} />
            </button>

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest truncate">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => goToTab('register')}
            className="flex items-center gap-2 px-5 md:px-6 py-3 bg-emerald-500 text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.15em] rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            <PlusCircle size={18} />
            <span className="hidden sm:inline">Nuevo Pedido</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 lg:pb-10 custom-scroll">
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

      <nav className="fixed bottom-0 left-0 right-0 z-[350] lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_35px_rgba(15,23,42,0.08)] px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="grid grid-cols-5 gap-1">
          {mobileMainItems.map(item => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goToTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'
                  }`}
              >
                <item.icon size={21} />
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all ${['calendar', 'stats', 'config', 'privacy'].includes(activeTab)
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-slate-400'
              }`}
          >
            <MoreHorizontal size={22} />
            <span className="text-[10px] font-bold tracking-tight">Más</span>
          </button>
        </div>
      </nav>

      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-[520] lg:hidden">
          <button
            type="button"
            aria-label="Cerrar más opciones"
            onClick={() => setIsMobileMoreOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
          />

          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[2rem] shadow-2xl border-t border-slate-100 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] animate-in slide-in-from-bottom-4">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Más opciones</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Accesos secundarios de Acanavela
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mobileMoreItems.map(item => {
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToTab(item.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isActive
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                        }`}
                    >
                      <item.icon size={20} />
                    </div>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="col-span-2 flex items-center gap-3 p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 transition-all"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-rose-400">
                  <LogOut size={20} />
                </div>
                <span className="font-semibold text-sm">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingOrder && (
        <OrderDetailsModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onEdit={(order) => {
            setViewingOrder(null);
            setEditingOrder(order);
            setActiveTab('register');
          }}
          onDelete={(id) => {
            setViewingOrder(null);
            setSecurityModal({
              isOpen: true,
              ids: [id],
              requiresPassword: true
            });
          }}
          onDuplicate={handleDuplicateOrder}
        />
      )}

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
                type="button"
                onClick={confirmDeletion}
                className="flex-1 py-4 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Eliminar Globalmente
              </button>

              <button
                type="button"
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

      <PwaUpdatePrompt />
    </div>
  );
};

export default App;