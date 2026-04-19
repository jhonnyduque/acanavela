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