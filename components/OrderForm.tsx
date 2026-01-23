import React, { useState, useEffect, useMemo } from 'react';
import { Order, Product, OrderStatus, Customer } from '../types';
import { 
  PRODUCT_TYPES, 
  EDGE_TYPES, 
  FILLING_TYPES,
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
  editingOrder?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSave, onCancel, customers, editingOrder }) => {
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

  useEffect(() => {
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
      setProducts([createNewProduct()]);
      setErrors({});
    }
  }, [editingOrder]);

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
      edge: 'Sin contorno',
      filling: 'Sin relleno',
      glutenFree: false,
      message: ''
    };
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    setCustomerName(val);
    setShowSuggestions(true);
    if (errors.customerName) setErrors(prev => ({ ...prev, customerName: '' }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomerPhone(val);
    if (errors.customerPhone) setErrors(prev => ({ ...prev, customerPhone: '' }));

    // Autocompletar si el teléfono existe
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
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = customerName.trim();
    const nameParts = trimmedName.split(/\s+/).filter(p => p.length > 1);
    
    if (!trimmedName) {
      newErrors.customerName = "El nombre es obligatorio";
    } else if (nameParts.length < 2) {
      newErrors.customerName = "Escribe nombre y apellido (Juana Pérez)";
    }

    if (!customerPhone.trim()) {
      newErrors.customerPhone = "El teléfono es obligatorio";
    } else if (customerPhone.length < 9) {
      newErrors.customerPhone = "Ingrese al menos 9 dígitos";
    }

    // Alerta de duplicado con distinto nombre
    const existing = customers.find(c => c.phone === customerPhone);
    if (existing && existing.name.toLowerCase() !== trimmedName.toLowerCase()) {
      newErrors.customerPhone = `Este número ya pertenece a: ${existing.name}`;
    }

    if (!pickupDate) newErrors.pickupDate = "La fecha es obligatoria";
    products.forEach((p, i) => {
      if (!p.type) newErrors[`product_${i}_type`] = "Tipo obligatorio";
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
          <div className="bg-white p-12 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] flex flex-col items-center justify-center border border-slate-100 animate-in zoom-in-95 w-full max-w-2xl mx-4">
            <div className="p-6 bg-emerald-100 text-emerald-600 rounded-full mb-6">
              <CheckCircle size={56} className="animate-bounce" />
            </div>
            <p className="text-2xl font-semibold text-slate-800 text-center">¡Pedido guardado!</p>
            <p className="text-sm font-medium text-slate-400 mt-2 uppercase tracking-widest text-center">La base de datos se ha actualizado correctamente.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-10 transition-all ${showSuccess ? 'opacity-20 blur-sm pointer-events-none' : ''}`}>
        <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">{editingOrder ? `Editar Pedido #${editingOrder.id}` : 'Nuevo Pedido'}</h2>

        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><ShoppingBag size={20} /></div>
            <h3 className="text-xl font-semibold text-slate-800">1. Selección de Productos</h3>
          </div>
          {products.map((product, index) => (
            <div key={product.id} className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative group">
              {products.length > 1 && <button type="button" onClick={() => setProducts(products.filter(p => p.id !== product.id))} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 rounded-xl"><Trash2 size={20} /></button>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Tipo</label>
                  <select value={product.type} onChange={e => updateProduct(product.id, 'type', e.target.value)} className={`w-full px-4 py-3 bg-slate-50 border ${errors[`product_${index}_type`] ? 'border-rose-500' : 'border-slate-200'} rounded-2xl outline-none focus:bg-white font-medium`}>
                    <option value="">Seleccionar...</option>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Raciones</label>
                  <input type="number" value={product.portions} onChange={e => updateProduct(product.id, 'portions', parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Contorno</label>
                  <select value={product.edge} onChange={e => updateProduct(product.id, 'edge', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium">{EDGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Relleno</label>
                  <select value={product.filling} onChange={e => updateProduct(product.id, 'filling', e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-medium">{FILLING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                <div className="pt-6 flex items-center px-1"><label className="flex items-center gap-3 cursor-pointer font-medium"><input type="checkbox" checked={product.glutenFree} onChange={e => updateProduct(product.id, 'glutenFree', e.target.checked)} className="w-5 h-5 accent-emerald-500 rounded-lg" /> Sin Gluten</label></div>
                <div className="md:col-span-3 space-y-2"><label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block ml-1">Observaciones</label><textarea value={product.message} onChange={e => updateProduct(product.id, 'message', e.target.value)} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white font-normal" placeholder="Ej: Poca nata..." /></div>
              </div>
            </div>
          ))}
          <div className="flex justify-center"><button type="button" onClick={() => setProducts([...products, createNewProduct()])} className="flex items-center gap-2 px-8 py-3 bg-indigo-50 text-indigo-600 font-semibold rounded-2xl hover:bg-indigo-100"><Plus size={20} /> Añadir otro producto</button></div>
        </div>

        <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="flex items-center gap-3"><div className="p-2 bg-indigo-500 text-white rounded-xl shadow-lg"><User size={20} /></div><h3 className="text-xl font-semibold text-slate-800">2. Cliente y Recogida</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-slate-600 block">Nombre Completo</label>
              <div className="relative">
                <input type="text" value={customerName} onChange={handleNameChange} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder="Juana Pérez" className={`w-full px-4 py-3 bg-slate-50 border ${errors.customerName ? 'border-rose-500' : 'border-slate-200'} rounded-2xl font-semibold`} />
                <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Clientes Sugeridos</div>
                  {filteredSuggestions.map(c => (
                    <button key={c.id} type="button" onClick={() => selectSuggestion(c)} className="w-full px-5 py-3 flex items-center justify-between hover:bg-emerald-50 text-left transition-colors border-t border-slate-50">
                      <div><p className="font-semibold text-slate-800">{c.name}</p><p className="text-[11px] text-slate-500 font-medium">{c.phone}</p></div>
                      <UserCheck size={16} className="text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
              {errors.customerName && <p className="text-rose-600 text-[11px] font-semibold mt-2 uppercase flex items-center gap-1.5"><AlertCircle size={14}/> {errors.customerName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 block">Teléfono</label>
              <input type="text" value={customerPhone} onChange={handlePhoneChange} placeholder="600 000 000" className={`w-full px-4 py-3 bg-slate-50 border ${errors.customerPhone ? 'border-rose-500' : 'border-slate-200'} rounded-2xl font-semibold`} />
              {errors.customerPhone && <p className="text-rose-600 text-[11px] font-semibold mt-2 uppercase flex items-center gap-1.5"><AlertCircle size={14}/> {errors.customerPhone}</p>}
            </div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 block"><Calendar size={14} className="inline mr-1"/> Fecha</label><input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold" /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-600 block"><Clock size={14} className="inline mr-1"/> Hora</label><select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-semibold">{PICKUP_HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
          </div>
        </section>

        <div className="flex gap-4">
          <button type="submit" disabled={isSaving} className={`flex-[2] py-4 bg-emerald-500 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 ${isSaving ? 'opacity-50' : ''}`}><Save size={24} /> {isSaving ? 'Guardando...' : 'Guardar Pedido'}</button>
          <button type="button" onClick={onCancel} className="flex-1 bg-white border border-slate-200 text-slate-500 font-medium rounded-2xl hover:bg-slate-50">Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;