// Minimal Supabase client: PostgREST, RPC, Auth (password), Storage upload and Realtime (Phoenix) for the order board.
const CFG: any = (window as any).CC_CONFIG || {};
export const SUPABASE_URL: string = (CFG.url || '').replace(/\/$/, '');
export const SUPABASE_KEY: string = CFG.key || '';
export const CONFIGURED = !!(SUPABASE_URL && SUPABASE_KEY);

export type Session = { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string } };

export class ApiError extends Error {
  status: number; code?: string; hint?: string;
  constructor(message: string, status = 0, code?: string, hint?: string) { super(message); this.status = status; this.code = code; this.hint = hint; }
}

const SKEY = 'cc.session.v1';
function loadSession(): Session | null { try { const s = JSON.parse(localStorage.getItem(SKEY) || 'null'); return s && s.access_token ? s : null; } catch { return null; } }
let session: Session | null = loadSession();
const authSubs = new Set<() => void>();
export const getSession = () => session;
export function onAuthChange(fn: () => void) { authSubs.add(fn); return () => { authSubs.delete(fn); }; }
function setSession(s: Session | null) {
  session = s;
  try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch { /* storage unavailable */ }
  authSubs.forEach((f) => f());
}
function toSession(j: any): Session {
  return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user?.id, email: j.user?.email } };
}

let refreshing: Promise<boolean> | null = null;
async function refreshSession(): Promise<boolean> {
  if (!session) return false;
  if (!refreshing) refreshing = (async () => {
    try {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session!.refresh_token }) });
      if (!r.ok) { if (r.status >= 400 && r.status < 500) setSession(null); return false; }
      setSession(toSession(await r.json()));
      return true;
    } catch { return false; } finally { refreshing = null; }
  })();
  return refreshing;
}
export async function freshToken() {
  if (session && session.expires_at * 1000 - Date.now() < 90_000) await refreshSession();
  return session?.access_token;
}

export function friendlyMessage(msg: string): string {
  const m = String(msg || '');
  if (/row-level security|permission denied|not allowed|42501/i.test(m)) return "You don't have permission to do that.";
  if (/duplicate key.*slug/i.test(m)) return 'A category with a similar name already exists.';
  if (/duplicate key.*code/i.test(m)) return 'That coupon code already exists.';
  if (/duplicate key.*inventory_items_name/i.test(m)) return 'An inventory item with this name already exists.';
  if (/duplicate key/i.test(m)) return 'This already exists.';
  if (/violates foreign key/i.test(m)) return 'This is linked to other records, so it can’t be removed.';
  if (/violates check constraint/i.test(m)) return 'Some values are not valid. Please check the form and try again.';
  if (/invalid input syntax|malformed|syntax error/i.test(m)) return 'Some values are not valid. Please check the form and try again.';
  if (/JWT expired|invalid JWT|jwt/i.test(m)) return 'Your session expired. Please sign in again.';
  if (/Invalid login credentials/i.test(m)) return 'Incorrect email or password.';
  if (/Failed to fetch|NetworkError/i.test(m)) return "We couldn't reach the server. Check your connection and try again.";
  return m;
}

type ReqOpts = { method?: string; body?: any; headers?: Record<string, string>; raw?: boolean };
async function request(path: string, opts: ReqOpts = {}, retried = false): Promise<any> {
  if (!CONFIGURED) throw new ApiError('The app is not connected to its database yet.');
  await freshToken();
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, ...(opts.headers || {}) };
  if (session) headers.Authorization = `Bearer ${session.access_token}`;
  let body: any = undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof Blob) body = opts.body;
    else { body = JSON.stringify(opts.body); headers['Content-Type'] = 'application/json'; }
  }
  let res: Response;
  try { res = await fetch(SUPABASE_URL + path, { method: opts.method || 'GET', headers, body }); }
  catch { throw new ApiError("We couldn't reach the server. Check your connection and try again.", 0); }
  if (res.status === 401 && session && !retried) {
    if (await refreshSession()) return request(path, opts, true);
    setSession(null);
  }
  const text = await res.text();
  let data: any = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const msg = (data && (data.message || data.msg || data.error_description || data.error)) || `Request failed (${res.status})`;
    throw new ApiError(friendlyMessage(msg), res.status, data?.code, data?.hint);
  }
  if (opts.raw) return { data, res };
  return data;
}

const enc = encodeURIComponent;
export const db = {
  select: (table: string, query = 'select=*') => request(`/rest/v1/${table}?${query}`),
  async selectAll(table: string, query: string, page = 1000) {
    const out: any[] = [];
    for (let from = 0; from < 50000; from += page) {
      const { data } = await request(`/rest/v1/${table}?${query}`, { headers: { 'Range-Unit': 'items', Range: `${from}-${from + page - 1}` }, raw: true });
      out.push(...(data || []));
      if (!data || data.length < page) break;
    }
    return out;
  },
  insert: (table: string, rows: any) => request(`/rest/v1/${table}`, { method: 'POST', body: rows, headers: { Prefer: 'return=representation' } }),
  async update(table: string, match: string, patch: any) {
    const r = await request(`/rest/v1/${table}?${match}`, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } });
    if (Array.isArray(r) && r.length === 0) throw new ApiError("Nothing was saved — you may not have permission, or the record no longer exists.");
    return r;
  },
  remove: (table: string, match: string) => request(`/rest/v1/${table}?${match}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }),
  rpc: (fn: string, args: any = {}) => request(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args }),
  eq: (v: string) => `eq.${enc(v)}`,
};

export const auth = {
  async signIn(email: string, password: string) {
    if (!CONFIGURED) throw new ApiError('The app is not connected to its database yet.');
    let r: Response;
    try { r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }) }); }
    catch { throw new ApiError("We couldn't reach the server. Check your connection and try again."); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new ApiError(friendlyMessage(j.error_description || j.msg || j.message || 'Sign in failed'), r.status);
    setSession(toSession(j));
  },
  async signOut() { try { await request('/auth/v1/logout', { method: 'POST' }); } catch { /* ignore */ } setSession(null); },
  updatePassword: (password: string) => request('/auth/v1/user', { method: 'PUT', body: { password } }),
};

export async function uploadImage(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new ApiError('Please choose a JPG, PNG, WebP or AVIF image.');
  if (file.size > 5 * 1024 * 1024) throw new ApiError('Images must be smaller than 5 MB.');
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await request(`/storage/v1/object/product-images/${path}`, { method: 'POST', body: file, headers: { 'Content-Type': file.type, 'x-upsert': 'false', 'cache-control': '31536000' } });
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
}

// Realtime: listen for any change on public.orders (RLS applies — staff only). Polling elsewhere is the safety net.
export function subscribeOrders(onChange: () => void, onStatus: (live: boolean) => void) {
  let ws: WebSocket | null = null; let hb: any; let tokenTimer: any; let closed = false; let retry = 0; let ref = 0;
  const topic = 'realtime:cc-orders';
  const send = (m: any) => { try { ws && ws.readyState === 1 && ws.send(JSON.stringify(m)); } catch { /* ignore */ } };
  const connect = async () => {
    if (closed || !CONFIGURED || !session) return;
    const token = await freshToken();
    try { ws = new WebSocket(`${SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${enc(SUPABASE_KEY)}&vsn=1.0.0`); }
    catch { onStatus(false); return; }
    ws.onopen = () => {
      retry = 0;
      send({ topic, event: 'phx_join', ref: String(++ref), join_ref: '1', payload: { config: { broadcast: { self: false }, presence: { key: '' }, postgres_changes: [{ event: '*', schema: 'public', table: 'orders' }] }, access_token: token } });
      hb = setInterval(() => send({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }), 25000);
      tokenTimer = setInterval(async () => { const t = await freshToken(); if (t) send({ topic, event: 'access_token', payload: { access_token: t }, ref: String(++ref) }); }, 10 * 60 * 1000);
    };
    ws.onmessage = (e) => {
      let m: any; try { m = JSON.parse(e.data); } catch { return; }
      if (m.topic !== topic) return;
      if (m.event === 'phx_reply' && m.payload) onStatus(m.payload.status === 'ok');
      else if (m.event === 'system' && m.payload) onStatus(m.payload.status === 'ok');
      else if (m.event === 'postgres_changes') onChange();
      else if (m.event === 'phx_error' || m.event === 'phx_close') onStatus(false);
    };
    ws.onclose = () => { clearInterval(hb); clearInterval(tokenTimer); onStatus(false); if (!closed) setTimeout(connect, Math.min(30000, 2000 * 2 ** retry++)); };
    ws.onerror = () => { try { ws?.close(); } catch { /* ignore */ } };
  };
  connect();
  return () => { closed = true; clearInterval(hb); clearInterval(tokenTimer); try { ws?.close(); } catch { /* ignore */ } };
}
