
import React, { useState, useEffect, useMemo } from 'react';
import { Order, Product, OrderStatus, Customer, CatalogItem } from '../types';
import { storageService } from '../services/storageService';
import { 
  PICKUP_HOURS
} from '../constants';
import { 
  Plus, 
  Trash2, 
  Save, 
  User,
  ShoppingBag,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  UserCheck
} from 'lucide-react';

interface OrderFormProps {
  onSave: (order: Order) => void;
  onCancel: () => void;
  customers: Customer[];
  orders: Order[]; // Añadido para el ranking
  editingOrder?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSave, onCancel, customers, orders, editingOrder }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('11:00');
  const [status, setStatus] = useState<OrderStatus>('Recibido');
  const [products, setProducts] = useState<Product[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [productCatalog, setProductCatalog] = useState<CatalogItem[]>([]);
  const [edgeCatalog, setEdgeCatalog] = useState<CatalogItem[]>([]);
  const [fillingCatalog, setFillingCatalog] = useState<CatalogItem[]>([]);
  const [sortPrefs, setSortPrefs] = useState({ products: 'manual', edges: 'manual', fillings: 'manual' });

  // Fix: Load catalog data asynchronously and await getSortPrefs to match supabase implementation
  useEffect(() => {
    const initData = async () => {
      const [prods, edgs, fills, prefs] = await Promise.all([
        storageService.getProductsCatalog(),
        storageService.getEdgesCatalog(),
        storageService.getFillingsCatalog(),
        storageService.getSortPrefs()
      ]);
      setProductCatalog(prods);
      setEdgeCatalog(edgs);
      setFillingCatalog(fills);
      setSortPrefs(prefs);
    };
    
    initData();
    
    if (editingOrder) {
      setCustomerName(editingOrder.customerName);
      setCustomerPhone(editingOrder.customerPhone);
      setPickupDate(editingOrder.pickupDate);
      setPickupTime(editingOrder.pickupTime);
      setProducts(editingOrder.products);
      setStatus(editingOrder.status);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setPickupDate(new Date().toISOString().split('T')[0]);
      setPickupTime('11:00');
      setStatus('Recibido');
    }
  }, [editingOrder]);

  const usageStats = useMemo(() => {
    const prod: Record<string, number> = {};
    const edge: Record<string, number> = {};
    const fill: Record<string, number> = {};
    orders.forEach(o => o.products.forEach(p => {
      prod[p.type] = (prod[p.type] || 0) + 1;
      edge[p.edge] = (edge[p.edge] || 0) + 1;
      fill[p.filling] = (fill[p.filling] || 0) + 1;
    }));
    return { prod, edge, fill };
  }, [orders]);

  const sortList = (list: CatalogItem[], sortType: string, stats: Record<string, number>) => {
    return [...list].filter(i => i.isActive).sort((a, b) => {
      if (sortType === 'orders') {
        const cA = stats[a.name] || 0;
        const cB = stats[b.name] || 0;
        if (cA !== cB) return cB - cA;
      } else if (sortType === 'name') {
        return a.name.localeCompare(b.name);
      }
      return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
    });
  };

  const activeProducts = useMemo(() => sortList(productCatalog, sortPrefs.products, usageStats.prod), [productCatalog, sortPrefs.products, usageStats.prod]);
  const activeEdges = useMemo(() => sortList(edgeCatalog, sortPrefs.edges, usageStats.edge), [edgeCatalog, sortPrefs.edges, usageStats.edge]);
  const activeFillings = useMemo(() => sortList(fillingCatalog, sortPrefs.fillings, usageStats.fill), [fillingCatalog, sortPrefs.fillings, usageStats.fill]);

  useEffect(() => {
    if (!editingOrder && products.length === 0 && activeEdges.length > 0 && activeFillings.length > 0) {
      setProducts([createNewProduct()]);
    }
  }, [activeEdges, activeFillings, editingOrder]);

  const filteredSuggestions = useMemo(() => {
    if (customerName.length < 2) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerName.toLowerCase())
    ).slice(0, 5);
  }, [customerName, customers]);

  function createNewProduct(): Product {
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: '',
      portions: 8,
      edge: activeEdges.length > 0 ? activeEdges[0].name : 'Sin contorno',
      filling: activeFillings.length > 0 ? activeFillings[0].name : 'Sin relleno',
      glutenFree: false,
      message: ''
    };
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setCustomerName(val);
    setShowSuggestions(true);
    // Validación automática de nombre y apellido
    const trimmed = val.trim();
    if (trimmed && trimmed.split(/\s+/).filter(w => w.length > 0).length < 2) {
      setErrors(prev => ({ ...prev, customerName: 'Debe colocar nombre y apellido' }));
    } else {
      setErrors(prev => ({ ...prev, customerName: '' }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setCustomerPhone(val);
    
    // Validación automática de 9 dígitos
    if (val.length > 0 && val.length !== 9) {
      setErrors(prev => ({ ...prev, customerPhone: 'El número debe tener 9 dígitos' }));
    } else {
      setErrors(prev => ({ ...prev, customerPhone: '' }));
    }

    const found = customers.find(c => c.phone === val);
    if (found) {
      setCustomerName(found.name);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setShowSuggestions(false);
    setErrors({});
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    const index = products.findIndex(p => p.id === id);
    if (field === 'type' && value) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`product_${index}_type`];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      newErrors.customerName = "El nombre es obligatorio";
    } else if (trimmedName.split(/\s+/).filter(w => w.length > 0).length < 2) {
      newErrors.customerName = "Debe colocar nombre y apellido";
    }

    const trimmedPhone = customerPhone.trim();
    if (!trimmedPhone) {
      newErrors.customerPhone = "El teléfono es obligatorio";
    } else if (trimmedPhone.length !== 9) {
      newErrors.customerPhone = "El número debe tener 9 dígitos";
    }

    if (!pickupDate) newErrors.pickupDate = "La fecha es obligatoria";
    products.forEach((p, i) => {
      if (!p.type) newErrors[`product_${i}_type`] = "Seleccione un tipo de tarta";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !validate()) return;
    setIsSaving(true);
    setShowSuccess(true);
    const order: Order = {
      id: editingOrder?.id || 0,
      customerName: customerName.trim(),
      customerPhone,
      pickupDate,
      pickupTime,
      status,
      products,
      createdAt: editingOrder?.createdAt || new Date().toISOString()
    };
    setTimeout(() => onSave(order), 600);
  };

  return (
    <div className="relative max-w-4xl mx-auto pb-24 animate-in slide-in-from-bottom-4">
      {showSuccess && (
        <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center rounded-[3rem]">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center justify-center animate-in zoom-in-95 w-full max-w-2xl mx-4">
            <div className="p-6 bg-emerald-100 text-emerald-600 rounded-full mb-6"><CheckCircle size={56} className="animate-bounce" /></div>
            <p className="text-2xl font-semibold text-slate-800 text-center">¡Pedido guardado!</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-10 transition-all ${showSuccess ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
        <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">{editingOrder ? `Editar Pedido #${editingOrder.id}` : 'Nuevo Pedido'}</h2>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg"><ShoppingBag size={20} /></div>
            <h3 className="text-xl font-semibold text-slate-800">1. Selección de Productos</h3>
          </div>
          {products.map((product, index) => (
            <div key={product.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative group transition-all">
              {products.length > 1 && <button type="button" onClick={() => setProducts(products.filter(p => p.id !== product.id))} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 rounded-xl transition-colors"><Trash2 size={20} /></button>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Tipo de Tarta</label>
                  <select value={product.type} onChange={e => updateProduct(product.id, 'type', e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border ${errors[`product_${index}_type`] ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200'} rounded-2xl outline-none focus:bg-white font-medium transition-all`}>
                    <option value="">Seleccionar...</option>
                    {activeProducts.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    {product.type && !activeProducts.some(ap => ap.name === product.type) && <option value={product.type}>{product.type} (Inactivo)</option>}
                  </select>
                  {errors[`product_${index}_type`] && (
                    <p className="text-[11px] font-normal text-rose-500 mt-1.5 ml-1 leading-none animate-in slide-in-from-top-1 transition-all">
                      {errors[`product_${index}_type`]}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Raciones</label>
                  <input type="number" value={product.portions} onChange={e => updateProduct(product.id, 'portions', parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Contorno</label>
                  <select value={product.edge} onChange={e => updateProduct(product.id, 'edge', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium">
                    {activeEdges.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    {product.edge && !activeEdges.some(ae => ae.name === product.edge) && <option value={product.edge}>{product.edge} (Inactivo)</option>}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Relleno</label>
                  <select value={product.filling} onChange={e => updateProduct(product.id, 'filling', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium">
                    {activeFillings.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    {product.filling && !activeFillings.some(af => af.name === product.filling) && <option value={product.filling}>{product.filling} (Inactivo)</option>}
                  </select>
                </div>
                <div className="pt-6 flex items-center px-1"><label className="flex items-center gap-3 cursor-pointer font-medium"><input type="checkbox" checked={product.glutenFree} onChange={e => updateProduct(product.id, 'glutenFree', e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded-lg" /> Sin Gluten</label></div>
                <div className="md:col-span-3 space-y-2"><label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Observaciones</label><textarea value={product.message} onChange={e => updateProduct(product.id, 'message', e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-normal" placeholder="Poca nata, mensaje..." /></div>
              </div>
            </div>
          ))}
          <div className="flex justify-center"><button type="button" onClick={() => setProducts([...products, createNewProduct()])} className="flex items-center gap-2 px-8 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-100 transition-all"><Plus size={20} /> Añadir otro ítem</button></div>
        </div>

        <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center gap-3"><div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg"><User size={20} /></div><h3 className="text-xl font-semibold text-slate-800">2. Cliente y Recogida</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-slate-600 block ml-1">Nombre Completo</label>
              <div className="relative">
                <input type="text" value={customerName} onChange={handleNameChange} onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); validate(); }} placeholder="Juana Pérez" className={`w-full px-4 py-3 bg-slate-50 border ${errors.customerName ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200'} rounded-2xl font-semibold transition-all shadow-sm`} />
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
              {errors.customerName && (
                <p className="text-[11px] font-normal text-rose-500 mt-1.5 ml-1 leading-none animate-in slide-in-from-top-1 transition-all">
                  {errors.customerName}
                </p>
              )}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {filteredSuggestions.map(c => (
                    <button key={c.id} type="button" onClick={() => selectSuggestion(c)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-emerald-50 text-left transition-colors border-t border-slate-50">
                      <div><p className="font-semibold text-slate-800">{c.name}</p><p className="text-[11px] text-slate-500 font-medium">{c.phone}</p></div>
                      <UserCheck size={16} className="text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 block ml-1">Teléfono</label>
              <input type="text" value={customerPhone} onChange={handlePhoneChange} onBlur={validate} placeholder="600 000 000" className={`w-full px-4 py-3 bg-slate-50 border ${errors.customerPhone ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-200'} rounded-2xl font-semibold transition-all shadow-sm`} />
              {errors.customerPhone && (
                <p className="text-[11px] font-normal text-rose-500 mt-1.5 ml-1 leading-none animate-in slide-in-from-top-1 transition-all">
                  {errors.customerPhone}
                </p>
              )}
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 block ml-1"><Calendar size={14} className="inline mr-1"/> Fecha</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold shadow-sm" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 block ml-1"><Clock size={14} className="inline mr-1"/> Hora</label><select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold shadow-sm">{PICKUP_HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
          </div>
        </section>

        <div className="flex gap-4">
          <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-emerald-500 text-white font-semibold text-lg rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={24} /> {isSaving ? 'Guardando...' : 'Guardar Pedido'}</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-white border border-slate-200 text-slate-500 font-medium rounded-2xl hover:bg-slate-50 transition-colors">Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;