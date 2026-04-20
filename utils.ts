// ─── Hash de PIN con SHA-256 ───────────────────────────────────────────────
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'acanavela-salt-2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Tokens de sesión ──────────────────────────────────────────────────────
export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    timestamp: Date.now(),
    expires: Date.now() + 8 * 60 * 60 * 1000 // 8 horas
  };
  return btoa(JSON.stringify(payload));
}

export function validateSessionToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token));
    if (Date.now() > payload.expires) return null;
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

// ─── Teléfono español ──────────────────────────────────────────────────────────────────//
/** Normaliza un número de teléfono a formato internacional +34 para WhatsApp */
export function normalizeSpanishPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('34')) return clean;
  if (clean.length === 9) return `34${clean}`;
  return clean;
}

// ─── Clasificación de cliente (fidelidad) ────────────────────────────────────────//
export type ClientTier = 'frequent' | 'recurring' | 'new' | 'occasional';

export interface ClientTierInfo {
  tier: ClientTier;
  label: string;
  badgeClass: string;
}

/**
 * Devuelve la clasificación de fidelidad de un cliente según su número de pedidos.
 * Fuente única de verdad para CustomerList y ClientDetailModal.
 *
 * frequent  : ≥ 8 pedidos
 * recurring : 2–7 pedidos
 * new       : 1 pedido
 * occasional: 0 pedidos
 */
export function getClientTier(orderCount: number): ClientTierInfo {
  if (orderCount >= 8) return { tier: 'frequent',   label: 'Frecuente (+8)',      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  if (orderCount >= 2) return { tier: 'recurring',  label: 'Recurrente (2–7)',   badgeClass: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
  if (orderCount === 1) return { tier: 'new',        label: 'Nuevo (1)',            badgeClass: 'bg-amber-50 text-amber-600 border-amber-100' };
  return                       { tier: 'occasional', label: 'Ocasional (0)',        badgeClass: 'bg-slate-50 text-slate-500 border-slate-100' };
}