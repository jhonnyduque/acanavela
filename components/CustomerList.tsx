import React, { useState, useMemo } from 'react';
import { Customer, Order } from '../types';
import { storageService } from '../services/storageService';
import { getClientTier, normalizeSpanishPhone } from '../utils';
import {
  Search, UserPlus, Edit3, Trash2, Phone, X, Save,
  MessageCircle, ChevronUp, ChevronDown, Star, TrendingUp, Trophy, Users,
  Download, Square, CheckSquare, AlertCircle, Mail, Calendar, UserMinus
} from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  orders: Order[];
  onSave: () => Promise<void> | void;
  onNewOrder?: () => void;
}

type SortField = 'name' | 'orderCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'new' | 'recurring' | 'frequent' | 'occasional';

const COMMON_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.es', 'icloud.com', 'yahoo.es', 'outlook.com', 'live.com'];

const CustomerList: React.FC<CustomerListProps> = ({ customers, orders, onSave }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

  const customerStats = useMemo(() => {
    const stats: Record<string, { count: number; lastDate: string }> = {};

    orders.forEach(order => {
      const phone = order.customerPhone;

      if (!stats[phone]) {
        stats[phone] = { count: 0, lastDate: order.pickupDate };
      }

      stats[phone].count += 1;

      if (order.pickupDate > stats[phone].lastDate) {
        stats[phone].lastDate = order.pickupDate;
      }
    });

    return stats;
  }, [orders]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getFidelityBadge = (count: number) => {
    const { label, badgeClass: cls, tier } = getClientTier(count);
    const iconMap = {
      frequent: Trophy,
      recurring: TrendingUp,
      new: Star,
      occasional: UserMinus
    };

    return { label, class: cls, icon: iconMap[tier] };
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let result = customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );

    if (filterType !== 'all') {
      result = result.filter(c => {
        const count = customerStats[c.phone]?.count || 0;
        return getClientTier(count).tier === filterType;
      });
    }

    result.sort((a, b) => {
      let valA: any = a[sortField as keyof Customer] || '';
      let valB: any = b[sortField as keyof Customer] || '';

      if (sortField === 'orderCount') {
        valA = customerStats[a.phone]?.count || 0;
        valB = customerStats[b.phone]?.count || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;

      return 0;
    });

    return result;
  }, [customers, searchTerm, sortField, sortOrder, filterType, customerStats]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedCustomers.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`¿Estás seguro de eliminar los ${selectedIds.size} clientes seleccionados?`)) return;

    try {
      await storageService.deleteCustomers(Array.from(selectedIds));
      setSelectedIds(new Set());
      await onSave();
    } catch (err) {
      console.error('Error eliminando clientes:', err);
      window.alert('No se pudieron eliminar los clientes. Inténtalo de nuevo.');
    }
  };

  const handleExportCSV = () => {
    const selectedCustomers = customers.filter(c => selectedIds.has(c.id));
    const target = selectedCustomers.length > 0 ? selectedCustomers : filteredAndSortedCustomers;

    if (target.length === 0) return;

    const headers = ["Nombre", "Telefono", "Email", "Pedidos Totales", "Ultimo Pedido", "Fecha Registro"].join(",");

    const rows = target.map(c => {
      const stats = customerStats[c.phone] || { count: 0, lastDate: '-' };

      return [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.email || ''}"`,
        stats.count,
        `"${stats.lastDate}"`,
        `"${new Date(c.createdAt).toLocaleDateString()}"`
      ].join(",");
    }).join("\n");

    const csvContent = "\uFEFF" + headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `Clientes_Acanavela_${new Date().toISOString().split('T')[0]}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNameInput = (val: string) => {
    const cleanVal = val.replace(/[0-9]/g, '');
    setEditingCustomer(prev => prev ? { ...prev, name: cleanVal } : null);

    if (nameError) setNameError(null);
  };

  const validateName = (val: string) => {
    const trimmed = val.trim();

    if (!trimmed) {
      setNameError("El nombre es obligatorio");
    } else if (trimmed.split(/\s+/).length < 2) {
      setNameError("Debe colocar nombre y apellido");
    } else {
      setNameError(null);
    }
  };

  const handlePhoneInput = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    setEditingCustomer(prev => prev ? { ...prev, phone: cleanVal } : null);

    if (phoneError) setPhoneError(null);
  };

  const validatePhone = (val: string) => {
    const trimmed = val.trim();

    if (!trimmed) {
      setPhoneError("Teléfono obligatorio");
    } else if (trimmed.length !== 9 || !['6', '7'].includes(trimmed.charAt(0))) {
      setPhoneError("Verificar número (9 dígitos, empieza por 6 o 7)");
    } else {
      setPhoneError(null);
    }
  };

  const handleEmailInput = (val: string) => {
    setEditingCustomer(prev => prev ? { ...prev, email: val } : null);

    if (val.includes('@')) {
      const parts = val.split('@');
      const userPart = parts[0];
      const domainPart = parts[1] || '';

      const filtered = COMMON_DOMAINS
        .filter(d => d.startsWith(domainPart))
        .map(d => `${userPart}@${d}`);

      setEmailSuggestions(filtered);
    } else {
      setEmailSuggestions([]);
    }
  };

  const selectEmailSuggestion = (fullEmail: string) => {
    setEditingCustomer(prev => prev ? { ...prev, email: fullEmail } : null);
    setEmailSuggestions([]);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;

    return sortOrder === 'asc'
      ? <ChevronUp size={14} className="ml-1" />
      : <ChevronDown size={14} className="ml-1" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setSelectedIds(new Set());
              }}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-semibold transition-all text-sm md:text-base"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-500 text-white font-semibold rounded-2xl shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all text-xs uppercase tracking-widest"
              >
                <Trash2 size={18} /> Eliminar ({selectedIds.size})
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white font-semibold rounded-2xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest"
            >
              <Download size={18} /> Exportar
            </button>

            <button
              onClick={() => {
                setNameError(null);
                setPhoneError(null);
                setEditingCustomer({ name: '', phone: '', email: '', createdAt: new Date().toISOString() });
              }}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-500 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all text-xs uppercase tracking-widest"
            >
              <UserPlus size={18} /> Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Todos', icon: Users },
            { id: 'frequent', label: 'Frecuentes (+8)', icon: Trophy },
            { id: 'recurring', label: 'Recurrentes (2-7)', icon: TrendingUp },
            { id: 'new', label: 'Nuevos (1)', icon: Star },
            { id: 'occasional', label: 'Ocasionales (0)', icon: UserMinus }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setFilterType(btn.id as FilterType);
                setSelectedIds(new Set());
              }}
              className={`whitespace-nowrap flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] md:text-[11px] font-semibold uppercase tracking-widest transition-all ${filterType === btn.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
              <btn.icon size={14} /> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* VISTA DESKTOP (TABLA) */}
      <div className="hidden md:block bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 w-14">
                  <button onClick={toggleSelectAll} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    {selectedIds.size === filteredAndSortedCustomers.length && filteredAndSortedCustomers.length > 0 ? (
                      <CheckSquare size={20} className="text-indigo-600" />
                    ) : (
                      <Square size={20} className="text-slate-300" />
                    )}
                  </button>
                </th>

                <th onClick={() => handleSort('name')} className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Nombre <SortIcon field="name" />
                  </div>
                </th>

                <th onClick={() => handleSort('orderCount')} className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Pedidos <SortIcon field="orderCount" />
                  </div>
                </th>

                <th onClick={() => handleSort('createdAt')} className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Registro <SortIcon field="createdAt" />
                  </div>
                </th>

                <th className="px-8 py-5 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {filteredAndSortedCustomers.map(c => {
                const stats = customerStats[c.phone] || { count: 0, lastDate: '-' };
                const fidelity = getFidelityBadge(stats.count);
                const isSelected = selectedIds.has(c.id);

                return (
                  <tr key={c.id} className={`group transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-5">
                      <button onClick={() => toggleSelect(c.id)} className="p-2 hover:bg-indigo-100 rounded-lg transition-colors">
                        {isSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} className="text-slate-200" />}
                      </button>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-lg ${fidelity.class}`}>
                          {c.name.charAt(0)}
                        </div>

                        <div>
                          <div className="font-semibold text-slate-800 text-lg leading-tight">{c.name}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                            <Phone size={12} /> {c.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold uppercase border ${fidelity.class}`}>
                        <fidelity.icon size={12} /> {fidelity.label} ({stats.count})
                      </span>
                    </td>

                    <td className="px-8 py-5">
                      <div className="text-sm font-medium text-slate-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setNameError(null);
                            setPhoneError(null);
                          }}
                          className="p-3 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>

                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar cliente?')) {
                              try {
                                await storageService.deleteCustomers([c.id]);
                                await onSave();
                              } catch {
                                window.alert('No se pudo eliminar. Inténtalo de nuevo.');
                              }
                            }
                          }}
                          className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL (CARDS) */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedCustomers.map(c => {
          const stats = customerStats[c.phone] || { count: 0, lastDate: '-' };
          const fidelity = getFidelityBadge(stats.count);
          const isSelected = selectedIds.has(c.id);

          return (
            <div
              key={c.id}
              className={`bg-white rounded-[2rem] p-6 border transition-all duration-300 ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/5' : 'border-slate-200'} shadow-sm space-y-5`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm ${fidelity.class}`}>
                    {c.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xl leading-tight">{c.name}</h4>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                      <Phone size={12} className="text-emerald-500" /> {c.phone}
                    </p>
                  </div>
                </div>

                <button onClick={() => toggleSelect(c.id)} className="p-1">
                  {isSelected ? <CheckSquare size={28} className="text-indigo-600" /> : <Square size={28} className="text-slate-200" />}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border ${fidelity.class}`}>
                  <fidelity.icon size={12} /> {fidelity.label} ({stats.count})
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase bg-slate-50 text-slate-500 border border-slate-100">
                  <Calendar size={12} className="text-indigo-400" /> Reg: {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.open(`https://wa.me/${normalizeSpanishPhone(c.phone)}`, '_blank')}
                  className="flex-1 h-14 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCustomer(c);
                      setNameError(null);
                      setPhoneError(null);
                    }}
                    className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Edit3 size={20} />
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm('¿Eliminar cliente?')) {
                        try {
                          await storageService.deleteCustomers([c.id]);
                          await onSave();
                        } catch {
                          window.alert('No se pudo eliminar. Inténtalo de nuevo.');
                        }
                      }
                    }}
                    className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[210] flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              if (nameError || phoneError) return;

              try {
                const customerToSave: Customer = editingCustomer.id
                  ? editingCustomer as Customer
                  : {
                    ...(editingCustomer as Customer),
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString()
                  };

                await storageService.saveCustomer(customerToSave);
                setEditingCustomer(null);
                await onSave();
              } catch (err) {
                console.error('Error guardando cliente:', err);
                window.alert('No se pudo guardar el cliente. Inténtalo de nuevo.');
              }
            }}
            className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300"
          >
            <div className="p-6 md:p-10 pb-4 flex items-center justify-between">
              <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
                {editingCustomer.id ? 'Ficha de Cliente' : 'Nuevo Registro'}
              </h3>

              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6 md:p-10 pt-6 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Nombre y Apellido
                </label>

                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Ej. Pedro Pérez"
                    value={editingCustomer.name}
                    onChange={e => handleNameInput(e.target.value)}
                    onBlur={e => validateName(e.target.value)}
                    className={`w-full px-6 py-5 bg-[#f8fafc] border ${nameError ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-100'} rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 font-semibold transition-all text-slate-700 placeholder:text-slate-300`}
                  />

                  {nameError && (
                    <div className="flex items-center gap-1.5 mt-2 ml-1 text-rose-500 animate-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest">{nameError}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Teléfono
                  </label>

                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="Ej. 604405615"
                      value={editingCustomer.phone}
                      onChange={e => handlePhoneInput(e.target.value)}
                      onBlur={e => validatePhone(e.target.value)}
                      className={`w-full px-6 py-5 bg-[#f8fafc] border ${phoneError ? 'border-rose-400 ring-2 ring-rose-50' : 'border-slate-100'} rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 font-semibold transition-all text-slate-700 placeholder:text-slate-300`}
                    />

                    {phoneError && (
                      <div className="flex items-center gap-1.5 mt-2 ml-1 text-rose-500 animate-in slide-in-from-top-1">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-semibold uppercase tracking-widest">{phoneError}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 relative">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Email
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Ej. pedro@gmail.com"
                      value={editingCustomer.email || ''}
                      onChange={e => handleEmailInput(e.target.value)}
                      className="w-full px-6 py-5 bg-[#f8fafc] border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-emerald-500/5 font-semibold transition-all text-slate-700 placeholder:text-slate-300"
                    />

                    {emailSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {emailSuggestions.map((email, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => selectEmailSuggestion(email)}
                            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-emerald-50 text-left transition-colors border-b border-slate-50 last:border-0"
                          >
                            <Mail size={16} className="text-emerald-500" />
                            <span className="font-semibold text-slate-600 text-sm">{email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 pt-4 pb-12 flex flex-col md:flex-row gap-4">
              <button
                type="submit"
                className="flex-[1.5] py-5 bg-[#10b981] text-white font-semibold rounded-[1.5rem] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
              >
                <Save size={24} /> Guardar Ficha
              </button>

              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="flex-1 py-5 bg-[#f1f5f9] text-[#64748b] font-semibold rounded-[1.5rem] hover:bg-slate-200 transition-all text-lg"
              >
                Cerrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomerList;