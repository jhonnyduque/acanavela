import React, { useState, useEffect, useMemo } from 'react';
import { Order, AppUser, UserRole, AuditLogEntry, CatalogItem, SortOption, SortPrefs } from '../types';
import { storageService } from '../services/storageService';
import { hashPin } from '../utils';
import {
  Database, Download, Upload, Lock, Shield, Users, UserPlus,
  Edit3, X, Save, History, Clock, UserCheck,
  Plus, Power, AlertCircle, Info,
  Search, SortAsc, TrendingUp, Trophy, ArrowDownWideNarrow,
  Package, ListTree, CheckCircle2, Droplets,
  ChevronUp, ChevronDown, RefreshCw
} from 'lucide-react';

interface ConfigViewProps {
  currentUser: AppUser;
  orders: Order[];
  onImport: (orders: Order[]) => void;
  onUpdateUser: (updated: AppUser) => void;
  showNotification?: (msg: string, type?: 'success' | 'error' | 'warn') => void;
}

interface ItemStats {
  count: number;
  lastUsed: string | null;
}

const ConfigView: React.FC<ConfigViewProps> = ({ currentUser, orders, onImport, onUpdateUser, showNotification }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [edges, setEdges] = useState<CatalogItem[]>([]);
  const [fillings, setFillings] = useState<CatalogItem[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

  const [editingItem, setEditingItem] = useState<{ type: 'product' | 'edge' | 'filling', item: CatalogItem } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newEdgeName, setNewEdgeName] = useState('');
  const [newFillingName, setNewFillingName] = useState('');

  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSortOption, setProductSortOption] = useState<SortOption>('manual');

  const [edgeSearchTerm, setEdgeSearchTerm] = useState('');
  const [edgeSortOption, setEdgeSortOption] = useState<SortOption>('manual');

  const [fillingSearchTerm, setFillingSearchTerm] = useState('');
  const [fillingSortOption, setFillingSortOption] = useState<SortOption>('manual');

  const [pendingToggle, setPendingToggle] = useState<{ type: 'product' | 'edge' | 'filling', id: string } | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchData = async () => {
    const [u, l, p, e, f, prefs] = await Promise.all([
      storageService.getUsers(),
      storageService.getLogs(),
      storageService.getProductsCatalog(),
      storageService.getEdgesCatalog(),
      storageService.getFillingsCatalog(),
      storageService.getSortPrefs()
    ]);
    setUsers(u);
    setLogs(l);
    setProducts(p);
    setEdges(e);
    setFillings(f);

    setProductSortOption(prefs.products || 'manual');
    setEdgeSortOption(prefs.edges || 'manual');
    setFillingSortOption(prefs.fillings || 'manual');
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const prefs: SortPrefs = {
      products: productSortOption,
      edges: edgeSortOption,
      fillings: fillingSortOption
    };
    storageService.saveSortPrefs(prefs);
  }, [productSortOption, edgeSortOption, fillingSortOption]);

  const usageStats = useMemo(() => {
    const prodStats: Record<string, ItemStats> = {};
    const edgeStats: Record<string, ItemStats> = {};
    const fillStats: Record<string, ItemStats> = {};

    products.forEach(p => prodStats[p.name] = { count: 0, lastUsed: null });
    edges.forEach(e => edgeStats[e.name] = { count: 0, lastUsed: null });
    fillings.forEach(f => fillStats[f.name] = { count: 0, lastUsed: null });

    orders.forEach(order => {
      order.products.forEach(p => {
        if (prodStats[p.type]) {
          prodStats[p.type].count++;
          if (!prodStats[p.type].lastUsed || order.pickupDate > (prodStats[p.type].lastUsed ?? '')) {
            prodStats[p.type].lastUsed = order.pickupDate;
          }
        }
        if (edgeStats[p.edge]) {
          edgeStats[p.edge].count++;
          if (!edgeStats[p.edge].lastUsed || order.pickupDate > (edgeStats[p.edge].lastUsed ?? '')) {
            edgeStats[p.edge].lastUsed = order.pickupDate;
          }
        }
        if (fillStats[p.filling]) {
          fillStats[p.filling].count++;
          if (!fillStats[p.filling].lastUsed || order.pickupDate > (fillStats[p.filling].lastUsed ?? '')) {
            fillStats[p.filling].lastUsed = order.pickupDate;
          }
        }
      });
    });
    return { products: prodStats, edges: edgeStats, fillings: fillStats };
  }, [orders, products, edges, fillings]);

  const getProcessedList = (list: CatalogItem[], term: string, sort: SortOption, stats: Record<string, ItemStats>) => {
    let result = [...list].filter(i => i.name.toLowerCase().includes(term.toLowerCase()));
    result.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;

      if (sort === 'orders') {
        const cA = stats[a.name]?.count || 0;
        const cB = stats[b.name]?.count || 0;
        if (cA !== cB) return cB - cA;
      } else if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }

      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    });
    return result;
  };

  const processedProducts = useMemo(() => getProcessedList(products, productSearchTerm, productSortOption, usageStats.products), [products, productSearchTerm, productSortOption, usageStats.products]);
  const processedEdges = useMemo(() => getProcessedList(edges, edgeSearchTerm, edgeSortOption, usageStats.edges), [edges, edgeSearchTerm, edgeSortOption, usageStats.edges]);
  const processedFillings = useMemo(() => getProcessedList(fillings, fillingSearchTerm, fillingSortOption, usageStats.fillings), [fillings, fillingSearchTerm, fillingSortOption, usageStats.fillings]);

  const handleSaveCatalogItem = async (type: 'product' | 'edge' | 'filling') => {
    let name = '';
    if (type === 'product') name = newItemName;
    else if (type === 'edge') name = newEdgeName;
    else name = newFillingName;

    if (!name.trim()) return;

    const currentList = type === 'product' ? products : (type === 'edge' ? edges : fillings);
    const maxOrder = currentList.reduce((max, item) => Math.max(max, item.orderIndex ?? 0), 0);

    const newItem: CatalogItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      orderIndex: maxOrder + 1
    };

    if (type === 'product') {
      const updated = [...products, newItem];
      setProducts(updated);
      await storageService.saveProductsCatalog(updated);
      setNewItemName('');
    } else if (type === 'edge') {
      const updated = [...edges, newItem];
      setEdges(updated);
      await storageService.saveEdgesCatalog(updated);
      setNewEdgeName('');
    } else {
      const updated = [...fillings, newItem];
      setFillings(updated);
      await storageService.saveFillingsCatalog(updated);
      setNewFillingName('');
    }

    await storageService.addLog({ action: `Añadido ${type}: ${newItem.name}`, performedBy: currentUser.name, targetUser: '-' });
    if (showNotification) showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} añadido con éxito`, 'success');
  };

  const moveItem = async (type: 'product' | 'edge' | 'filling', id: string, direction: 'up' | 'down') => {
    const list = type === 'product' ? products : (type === 'edge' ? edges : fillings);
    const processed = type === 'product' ? processedProducts : (type === 'edge' ? processedEdges : processedFillings);

    const index = processed.findIndex(i => i.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === processed.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (processed[index].isActive !== processed[targetIndex].isActive) return;

    const currentItem = processed[index];
    const targetItem = processed[targetIndex];

    const newList = list.map(item => {
      if (item.id === currentItem.id) return { ...item, orderIndex: targetItem.orderIndex };
      if (item.id === targetItem.id) return { ...item, orderIndex: currentItem.orderIndex };
      return item;
    });

    if (type === 'product') {
      setProducts(newList);
      await storageService.saveProductsCatalog(newList);
    } else if (type === 'edge') {
      setEdges(newList);
      await storageService.saveEdgesCatalog(newList);
    } else {
      setFillings(newList);
      await storageService.saveFillingsCatalog(newList);
    }
  };

  const confirmToggleStatus = async (type: 'product' | 'edge' | 'filling', id: string) => {
    if (type === 'product') {
      const updated = products.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
      setProducts(updated);
      await storageService.saveProductsCatalog(updated);
    } else if (type === 'edge') {
      const updated = edges.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e);
      setEdges(updated);
      await storageService.saveEdgesCatalog(updated);
    } else {
      const updated = fillings.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f);
      setFillings(updated);
      await storageService.saveFillingsCatalog(updated);
    }
    setPendingToggle(null);
    if (showNotification) showNotification(`Estado actualizado`, 'success');
  };

  const handleToggleCatalogStatus = async (type: 'product' | 'edge' | 'filling', id: string) => {
    let item;
    if (type === 'product') item = products.find(i => i.id === id);
    else if (type === 'edge') item = edges.find(i => i.id === id);
    else item = fillings.find(i => i.id === id);

    if (!item) return;

    if (item.isActive) {
      const stats = type === 'product' ? usageStats.products[item.name] : (type === 'edge' ? usageStats.edges[item.name] : usageStats.fillings[item.name]);
      if (stats && stats.count > 0) {
        setPendingToggle({ type, id });
        return;
      }
    }
    await confirmToggleStatus(type, id);
  };

  const updateItemName = async (type: 'product' | 'edge' | 'filling', id: string, newName: string) => {
    if (!newName.trim()) return;
    if (type === 'product') {
      const updated = products.map(p => p.id === id ? { ...p, name: newName.trim() } : p);
      setProducts(updated);
      await storageService.saveProductsCatalog(updated);
    } else if (type === 'edge') {
      const updated = edges.map(e => e.id === id ? { ...e, name: newName.trim() } : e);
      setEdges(updated);
      await storageService.saveEdgesCatalog(updated);
    } else {
      const updated = fillings.map(f => f.id === id ? { ...f, name: newName.trim() } : f);
      setFillings(updated);
      await storageService.saveFillingsCatalog(updated);
    }
    setEditingItem(null);
    if (showNotification) showNotification(`Nombre actualizado`, 'success');
  };

  const toggleUserActive = async (id: string) => {
    if (!isAdmin) return;
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;

    const updatedUser = { ...targetUser, isActive: !targetUser.isActive };

    setIsSavingUser(true);
    try {
      await storageService.saveUser(updatedUser);
      await fetchData();

      await storageService.addLog({
        action: `${updatedUser.isActive ? 'Activado' : 'Desactivado'} usuario`,
        performedBy: currentUser.name,
        targetUser: updatedUser.name || '-'
      });
      if (showNotification) showNotification(`Usuario ${updatedUser.isActive ? 'activado' : 'desactivado'}`, 'success');
    } finally {
      setIsSavingUser(false);
    }
  };

  // ─── Guardar usuario con PIN hasheado ────────────────────────────────────
  const handleSaveUser = async (u: AppUser) => {
    setIsSavingUser(true);
    try {
      // Solo hashear el PIN si cambió (no es el hash anterior)
      // Si el PIN tiene 4 dígitos, es un PIN nuevo → hashear
      // Si tiene 64 caracteres (hex SHA-256), ya está hasheado → no tocar
      const pinNeedsHashing = u.pin.length <= 4;
      const hashedPin = pinNeedsHashing ? await hashPin(u.pin) : u.pin;

      const userToSave = {
        ...u,
        pin: hashedPin,
        isActive: u.isActive !== undefined ? u.isActive : true
      };

      await storageService.saveUser(userToSave);

      setEditingUser(null);
      setIsAddingUser(false);

      if (showNotification) showNotification(isAddingUser ? 'Nuevo usuario creado' : 'Perfil actualizado', 'success');

      if (userToSave.id === currentUser.id) {
        onUpdateUser(userToSave);
      }

      fetchData();

    } catch (err) {
      console.error("Error saving user:", err);
      if (showNotification) showNotification('Error al guardar usuario', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in pb-24">
      {isAdmin && (
        <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-16">
          <div className="flex items-center gap-5 border-b border-slate-50 pb-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ListTree size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestión de Catálogos</h2>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Configuración de productos, contornos y rellenos</p>
            </div>
          </div>

          <CatalogSection
            type="product"
            title="Productos"
            items={processedProducts}
            searchTerm={productSearchTerm}
            onSearchChange={setProductSearchTerm}
            sortOption={productSortOption}
            onSortChange={(val: SortOption) => setProductSortOption(val)}
            newItemValue={newItemName}
            onNewItemChange={setNewItemName}
            onAddItem={() => handleSaveCatalogItem('product')}
            placeholder="Agregar producto…"
            stats={usageStats.products}
            onEdit={(item: CatalogItem) => setEditingItem({ type: 'product', item })}
            onToggle={(id: string) => handleToggleCatalogStatus('product', id)}
            onMove={(id: string, dir: 'up' | 'down') => moveItem('product', id, dir)}
            editingId={editingItem?.type === 'product' ? editingItem.item.id : null}
            onSaveEdit={(id: string, name: string) => updateItemName('product', id, name)}
            icon={<Package size={24} className="text-emerald-500" />}
          />

          <CatalogSection
            type="edge"
            title="Contornos (Bordes)"
            items={processedEdges}
            searchTerm={edgeSearchTerm}
            onSearchChange={setEdgeSearchTerm}
            sortOption={edgeSortOption}
            onSortChange={(val: SortOption) => setEdgeSortOption(val)}
            newItemValue={newEdgeName}
            onNewItemChange={setNewEdgeName}
            onAddItem={() => handleSaveCatalogItem('edge')}
            placeholder="Agregar contornos."
            stats={usageStats.edges}
            onEdit={(item: CatalogItem) => setEditingItem({ type: 'edge', item })}
            onToggle={(id: string) => handleToggleCatalogStatus('edge', id)}
            onMove={(id: string, dir: 'up' | 'down') => moveItem('edge', id, dir)}
            editingId={editingItem?.type === 'edge' ? editingItem.item.id : null}
            onSaveEdit={(id: string, name: string) => updateItemName('edge', id, name)}
            icon={<ListTree size={24} className="text-emerald-500" />}
          />

          <CatalogSection
            type="filling"
            title="Rellenos"
            items={processedFillings}
            searchTerm={fillingSearchTerm}
            onSearchChange={setFillingSearchTerm}
            sortOption={fillingSortOption}
            onSortChange={(val: SortOption) => setFillingSortOption(val)}
            newItemValue={newFillingName}
            onNewItemChange={setNewFillingName}
            onAddItem={() => handleSaveCatalogItem('filling')}
            placeholder="Agregar relleno"
            stats={usageStats.fillings}
            onEdit={(item: CatalogItem) => setEditingItem({ type: 'filling', item })}
            onToggle={(id: string) => handleToggleCatalogStatus('filling', id)}
            onMove={(id: string, dir: 'up' | 'down') => moveItem('filling', id, dir)}
            editingId={editingItem?.type === 'filling' ? editingItem.item.id : null}
            onSaveEdit={(id: string, name: string) => updateItemName('filling', id, name)}
            icon={<Droplets size={24} className="text-emerald-500" />}
          />
        </div>
      )}

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Users size={28} /></div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Gestión de Equipo</h2>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Roles y permisos de acceso</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => { setIsAddingUser(true); setEditingUser({ id: '', name: '', username: '', pin: '', role: 'VENDOR', isActive: true }); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-100 transition-all text-sm">
              <UserPlus size={18} /> Nuevo Usuario
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {isSavingUser && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
              <RefreshCw className="text-indigo-600 animate-spin" size={32} />
            </div>
          )}
          {users.map((user) => (
            <UserCard key={user.id} user={user} currentUserId={currentUser.id} canEdit={isAdmin || currentUser.id === user.id} canDeactivate={isAdmin} onEdit={() => setEditingUser(user)} onToggleActive={() => toggleUserActive(user.id)} />
          ))}
        </div>
      </div>

      {pendingToggle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Info size={28} /></div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">Aviso de Inactivación</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elemento con historial</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">Este elemento tiene pedidos registrados. Al inactivarlo:</p>
            <ul className="space-y-2 mb-8 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={14} /> No aparecerá en nuevos pedidos</li>
              <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 size={14} /> El historial se mantendrá intacto</li>
            </ul>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => confirmToggleStatus(pendingToggle.type, pendingToggle.id)} className="py-4 bg-slate-900 text-white font-bold rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all">Inactivar</button>
              <button onClick={() => setPendingToggle(null)} className="py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <EditProfileModal
          user={editingUser}
          isSaving={isSavingUser}
          onClose={() => { setEditingUser(null); setIsAddingUser(false); }}
          onSave={handleSaveUser}
          isNew={isAddingUser}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

const CatalogSection = ({ title, items, searchTerm, onSearchChange, sortOption, onSortChange, newItemValue, onNewItemChange, onAddItem, placeholder, stats, onEdit, onToggle, onMove, editingId, onSaveEdit, icon }: any) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="w-full sm:w-48 pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all" />
          </div>
          <select value={sortOption} onChange={e => onSortChange(e.target.value as SortOption)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 outline-none cursor-pointer hover:bg-white transition-all">
            <option value="manual">Orden Manual</option>
            <option value="orders">Más usados</option>
            <option value="name">Alfabético</option>
          </select>
          <div className="flex gap-2">
            <input type="text" placeholder={placeholder} value={newItemValue} onChange={e => onNewItemChange(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:bg-white" />
            <button onClick={onAddItem} className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"><Plus size={24} /></button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: any, index: number) => {
          const itemStats = stats[item.name] || { count: 0, lastUsed: null };
          const isInactive = !item.isActive;
          const canMoveUp = index > 0 && items[index - 1].isActive === item.isActive;
          const canMoveDown = index < items.length - 1 && items[index + 1].isActive === item.isActive;

          return (
            <div key={item.id} className={`group p-6 rounded-[2rem] border transition-all duration-300 relative ${isInactive ? 'bg-slate-50 border-slate-200 opacity-60 grayscale' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  {editingId === item.id ? (
                    <input autoFocus type="text" defaultValue={item.name} onBlur={e => onSaveEdit(item.id, e.target.value)} onKeyDown={e => e.key === 'Enter' && onSaveEdit(item.id, e.currentTarget.value)} className="w-full bg-transparent border-b-2 border-emerald-500 outline-none font-bold text-slate-800 text-lg" />
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-lg truncate leading-tight">{item.name}</p>
                        {itemStats.count >= 10 && !isInactive && <Trophy size={14} className="text-amber-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${itemStats.count > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          <TrendingUp size={10} /><span className="text-[10px] font-bold uppercase tracking-tight">{itemStats.count} pedidos</span>
                        </div>
                        {isInactive && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[8px] font-bold uppercase tracking-widest">Inactivo</span>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <div className="flex gap-1.5">
                    <button onClick={() => onEdit(item)} className="p-2.5 text-slate-400 hover:text-indigo-500 bg-white border border-slate-100 rounded-xl transition-all shadow-sm"><Edit3 size={16} /></button>
                    <button onClick={() => onToggle(item.id)} className={`p-2.5 rounded-xl border transition-all shadow-sm ${item.isActive ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-slate-400 bg-slate-200 border-slate-200'}`}><Power size={16} /></button>
                  </div>

                  {sortOption === 'manual' && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        disabled={!canMoveUp}
                        onClick={() => onMove(item.id, 'up')}
                        className={`p-2 rounded-lg border transition-all ${canMoveUp ? 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' : 'text-slate-200 bg-slate-50 border-slate-100'}`}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        disabled={!canMoveDown}
                        onClick={() => onMove(item.id, 'down')}
                        className={`p-2 rounded-lg border transition-all ${canMoveDown ? 'text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100' : 'text-slate-200 bg-slate-50 border-slate-100'}`}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const UserCard = ({ user, currentUserId, canEdit, canDeactivate, onEdit, onToggleActive }: any) => {
  const roleLabels: Record<UserRole, string> = { ADMIN: 'ADMIN', MANAGER: 'ENCARGADO', VENDOR: 'VENDEDOR' };
  const roleColors: Record<UserRole, string> = { ADMIN: 'bg-[#2D2E7C] text-white', MANAGER: 'bg-amber-500 text-white', VENDOR: 'bg-slate-200 text-slate-600' };
  return (
    <div className={`p-8 rounded-3xl border border-slate-100 shadow-sm relative transition-all ${!user.isActive ? 'opacity-50 grayscale' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-6">
        <span className={`px-3 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-widest ${roleColors[user.role as UserRole]}`}>{roleLabels[user.role as UserRole]}</span>
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

const EditProfileModal = ({ user, onClose, onSave, isNew, isAdmin, isSaving }: any) => {
  const [formData, setFormData] = useState(user);
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 flex items-center justify-between pb-4">
          <h3 className="text-2xl font-semibold text-slate-900">{isNew ? 'Nuevo Usuario' : 'Editar Perfil'}</h3>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 pt-4 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
            <input required disabled={(!isAdmin && !isNew) || isSaving} type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-medium disabled:opacity-50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Nombre de Usuario</label>
            <input required disabled={!isNew || isSaving} type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().trim() })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium text-slate-400 disabled:opacity-50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1"> PIN (4 dígitos)</label>
            <input required disabled={isSaving} type="password" maxLength={4} value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-medium text-center tracking-[1em] text-lg disabled:opacity-50" placeholder="••••" />
          </div>
          {isAdmin && (
            <div className="space-y-3">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest ml-1">Rol de Acceso</label>
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                {(['ADMIN', 'MANAGER', 'VENDOR']).map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setFormData({ ...formData, role: r })}
                    className={`flex-1 py-3 rounded-xl text-[9px] font-semibold uppercase tracking-widest transition-all ${formData.role === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/50'} disabled:opacity-50`}
                  >
                    {r === 'MANAGER' ? 'Encargado' : r === 'VENDOR' ? 'Vendedor' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[1.5] py-4 bg-indigo-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-4 bg-slate-50 text-slate-500 font-medium rounded-2xl disabled:opacity-50">Cerrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigView;