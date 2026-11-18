import { useSyncExternalStore, useEffect, useState, useRef } from 'react';
import { db, getSession, onAuthChange, ApiError } from './supa';

// ───────── tiny store ─────────
export type Store<T> = { get: () => T; set: (u: T | ((s: T) => T)) => void; subscribe: (f: () => void) => () => void };
export function createStore<T>(initial: T): Store<T> {
  let state = initial; const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (u: any) => { state = typeof u === 'function' ? u(state) : u; subs.forEach((f) => f()); },
    subscribe: (f) => { subs.add(f); return () => { subs.delete(f); }; },
  };
}
export function useStore<T>(s: Store<T>): T { return useSyncExternalStore(s.subscribe, s.get, s.get); }

const ls = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k: string, v: any) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* full or blocked */ } },
};
export { ls };

// ───────── router (history API) ─────────
export const route = createStore({ path: location.pathname, search: location.search });
export function navigate(to: string, opts: { replace?: boolean; keepScroll?: boolean } = {}) {
  if (to === location.pathname + location.search) { if (!opts.keepScroll) window.scrollTo({ top: 0 }); return; }
  history[opts.replace ? 'replaceState' : 'pushState']({}, '', to);
  route.set({ path: location.pathname, search: location.search });
  if (!opts.keepScroll) window.scrollTo({ top: 0 });
}
window.addEventListener('popstate', () => route.set({ path: location.pathname, search: location.search }));
export const useRoute = () => useStore(route);
export function useQuery() { const r = useRoute(); return new URLSearchParams(r.search); }
export function setQuery(params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams(location.search);
  Object.entries(params).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
  const s = q.toString();
  navigate(location.pathname + (s ? `?${s}` : ''), { replace: true, keepScroll: true });
}

// ───────── formatting ─────────
export function inr(paise: number | null | undefined) {
  const p = Math.round(Number(paise) || 0);
  const neg = p < 0; const a = Math.abs(p);
  const s = (a / 100).toLocaleString('en-IN', { minimumFractionDigits: a % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return `${neg ? '−' : ''}₹${s}`;
}
export function toPaise(v: string | number): number {
  const s = String(v ?? '').trim().replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100);
}
export const rupees = (p: number | null | undefined) => (p == null ? '' : String(p / 100));
export const fmtTime = (d: string | Date) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = (d: string | Date) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const fmtDateTime = (d: string | Date) => `${fmtDate(d)}, ${fmtTime(d)}`;
export function minutesSince(d: string) { return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000)); }
export function ago(d: string) {
  const m = minutesSince(d);
  if (m < 1) return 'just now'; if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h ago`;
  return fmtDay(d);
}
export function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function dayKey(d: string | Date) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; }
export const normalizePhone = (s: string) => { let d = String(s || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('91')) d = d.slice(2); if (d.length === 11 && d.startsWith('0')) d = d.slice(1); return d; };
export const validPhone = (s: string) => /^[6-9]\d{9}$/.test(normalizePhone(s));
export const uid = () => (crypto as any).randomUUID ? (crypto as any).randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16); });
export const errMsg = (e: any) => (e instanceof ApiError || e instanceof Error ? e.message : String(e || 'Something went wrong'));
export const initials = (n: string) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'category';

export const STATUS: Record<string, { label: string; short: string }> = {
  new: { label: 'New', short: 'New' }, accepted: { label: 'Accepted', short: 'Accepted' }, preparing: { label: 'Preparing', short: 'Preparing' },
  ready: { label: 'Ready', short: 'Ready' }, completed: { label: 'Completed', short: 'Done' }, cancelled: { label: 'Cancelled', short: 'Cancelled' },
};
export const NEXT: Record<string, { to: string; label: string } | undefined> = {
  new: { to: 'accepted', label: 'Accept' }, accepted: { to: 'preparing', label: 'Start preparing' },
  preparing: { to: 'ready', label: 'Mark ready' }, ready: { to: 'completed', label: 'Complete' },
};
export const orderTypeLabel = (t: string, table?: string | null) => (t === 'dine_in' ? `Dine-in${table ? ` · ${table}` : ''}` : 'Takeaway');

// ───────── settings ─────────
export type Settings = any;
export const settingsStore = createStore<{ status: 'loading' | 'ready' | 'error'; data: Settings | null; error?: string }>({ status: 'loading', data: null });
export async function loadSettings() {
  try {
    const rows = await db.select('shop_settings', 'select=*&id=eq.1');
    settingsStore.set({ status: 'ready', data: rows?.[0] || null });
    applyAccent(rows?.[0]?.accent_color);
  } catch (e) { settingsStore.set({ status: 'error', data: null, error: errMsg(e) }); }
}
export function applyAccent(hex?: string) {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return;
  const r = document.documentElement.style; r.setProperty('--caramel', hex);
  const n = parseInt(hex.slice(1), 16); const dark = (k: number) => Math.round(((n >> k) & 255) * 0.66);
  r.setProperty('--caramel-ink', `rgb(${dark(16)},${dark(8)},${dark(0)})`);
  const soft = (k: number) => Math.round(((n >> k) & 255) * 0.18 + 255 * 0.82);
  r.setProperty('--caramel-soft', `rgb(${soft(16)},${soft(8)},${soft(0)})`);
}
export const useSettings = () => useStore(settingsStore);
export function paymentMethods(s: Settings) { return (s?.payment_methods || []) as { key: string; label: string; hint?: string; enabled: boolean }[]; }
export function paymentLabel(s: Settings, key: string) { return paymentMethods(s).find((m) => m.key === key)?.label || key?.toUpperCase?.() || key; }
export function todayHours(s: Settings) {
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  return (s?.hours || []).find((h: any) => h.day === d);
}

// ───────── menu ─────────
export type Menu = { status: 'loading' | 'ready' | 'error'; error?: string; categories: any[]; products: any[]; groups: any[]; options: any[]; links: any[] };
export const menuStore = createStore<Menu>({ status: 'loading', categories: [], products: [], groups: [], options: [], links: [] });
export async function loadMenu() {
  try {
    const [categories, products, groups, options, links] = await Promise.all([
      db.select('categories', 'select=*&order=sort_order.asc,name.asc'),
      db.select('products', 'select=*&order=sort_order.asc,name.asc'),
      db.select('option_groups', 'select=*&order=sort_order.asc'),
      db.select('options', 'select=*&order=sort_order.asc'),
      db.select('product_option_groups', 'select=*'),
    ]);
    menuStore.set({ status: 'ready', categories, products, groups, options, links });
  } catch (e) { menuStore.set((m) => ({ ...m, status: 'error', error: errMsg(e) })); }
}
export const useMenu = () => useStore(menuStore);
export function visibleProducts(m: Menu) {
  const active = new Set(m.categories.filter((c) => c.is_active).map((c) => c.id));
  return m.products.filter((p) => active.has(p.category_id));
}
export function productGroups(m: Menu, productId: string) {
  const p = m.products.find((x) => x.id === productId);
  if (!p || !p.is_customizable) return [];
  const gids = new Set(m.links.filter((l) => l.product_id === productId).map((l) => l.group_id));
  return m.groups.filter((g) => gids.has(g.id)).map((g) => ({ ...g, options: m.options.filter((o) => o.group_id === g.id && o.is_active) })).filter((g) => g.options.length);
}
export const needsChoice = (m: Menu, productId: string) => productGroups(m, productId).some((g) => g.required);

// ───────── cart ─────────
export type CartLine = { key: string; product_id: string; option_ids: string[]; qty: number; notes: string };
type Cart = { lines: CartLine[]; coupon: string | null; bump: number };
export const cartStore = createStore<Cart>({ ...ls.get('cc.cart.v1', { lines: [], coupon: null }), bump: 0 });
cartStore.subscribe(() => { const { lines, coupon } = cartStore.get(); ls.set('cc.cart.v1', { lines, coupon }); });
export const useCart = () => useStore(cartStore);
const lineKey = (pid: string, opts: string[], notes: string) => `${pid}|${[...opts].sort().join(',')}|${notes.trim().toLowerCase()}`;
export const cart = {
  add(product_id: string, option_ids: string[] = [], qty = 1, notes = '') {
    const key = lineKey(product_id, option_ids, notes);
    cartStore.set((c) => {
      const ex = c.lines.find((l) => l.key === key);
      const lines = ex ? c.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l)) : [...c.lines, { key, product_id, option_ids, qty: Math.min(20, qty), notes: notes.trim() }];
      return { ...c, lines, bump: c.bump + 1 };
    });
  },
  replace(oldKey: string, product_id: string, option_ids: string[], qty: number, notes: string) {
    const key = lineKey(product_id, option_ids, notes);
    cartStore.set((c) => {
      const rest = c.lines.filter((l) => l.key !== oldKey);
      const ex = rest.find((l) => l.key === key);
      const lines = ex ? rest.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l)) : (() => { const i = c.lines.findIndex((l) => l.key === oldKey); const nl = { key, product_id, option_ids, qty, notes: notes.trim() }; const arr = [...rest]; arr.splice(Math.max(0, i), 0, nl); return arr; })();
      return { ...c, lines };
    });
  },
  setQty(key: string, qty: number) { cartStore.set((c) => ({ ...c, lines: qty <= 0 ? c.lines.filter((l) => l.key !== key) : c.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l)) })); },
  remove(key: string) { cartStore.set((c) => ({ ...c, lines: c.lines.filter((l) => l.key !== key) })); },
  setCoupon(code: string | null) { cartStore.set((c) => ({ ...c, coupon: code })); },
  clear() { cartStore.set((c) => ({ ...c, lines: [], coupon: null })); },
};
export function priceLine(m: Menu, l: CartLine) {
  const product = m.products.find((p) => p.id === l.product_id);
  const cat = product && m.categories.find((c) => c.id === product.category_id);
  const allowed = product ? productGroups(m, product.id) : [];
  const allowedIds = new Set(allowed.flatMap((g: any) => g.options.map((o: any) => o.id)));
  const options = l.option_ids.map((id) => m.options.find((o) => o.id === id)).filter(Boolean);
  const optionsOk = options.length === l.option_ids.length && options.every((o: any) => allowedIds.has(o.id));
  const available = !!product && product.is_available && !!cat?.is_active && optionsOk;
  const unit = (product?.price_paise || 0) + options.reduce((s: number, o: any) => s + o.price_paise, 0);
  return { product, options, unit, total: unit * l.qty, available, reason: !product ? 'No longer on the menu' : !product.is_available || !cat?.is_active ? 'Sold out right now' : !optionsOk ? 'Some add-ons changed — please edit' : '' };
}
export function cartSummary(m: Menu, c: Cart) {
  const lines = c.lines.map((l) => ({ ...l, ...priceLine(m, l) }));
  const subtotal = lines.filter((l) => l.available).reduce((s, l) => s + l.total, 0);
  const count = c.lines.reduce((s, l) => s + l.qty, 0);
  return { lines, subtotal, count, hasUnavailable: lines.some((l) => !l.available) };
}
export function useCouponPreview(code: string | null, subtotal: number) {
  const [state, setState] = useState<{ loading: boolean; result: any }>({ loading: false, result: null });
  useEffect(() => {
    if (!code || subtotal <= 0) { setState({ loading: false, result: null }); return; }
    let alive = true; setState((s) => ({ ...s, loading: true }));
    const t = setTimeout(() => {
      db.rpc('validate_coupon', { p_code: code, p_subtotal_paise: subtotal })
        .then((r) => alive && setState({ loading: false, result: r }))
        .catch((e) => alive && setState({ loading: false, result: { ok: false, message: errMsg(e) } }));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [code, subtotal]);
  return state;
}
export const taxOn = (amount: number, pct: number) => Math.round((amount * (Number(pct) || 0)) / 100);

// recent orders on this device (lets customers reopen tracking without retyping)
export const recentOrders = createStore<{ order_number: string; phone: string; at: string }[]>(ls.get('cc.recent.v1', []));
recentOrders.subscribe(() => ls.set('cc.recent.v1', recentOrders.get()));
export function rememberOrder(order_number: string, phone: string) {
  recentOrders.set((r) => [{ order_number, phone, at: new Date().toISOString() }, ...r.filter((x) => x.order_number !== order_number)].slice(0, 6));
}

// ───────── site offers ─────────
export const offersStore = createStore<{ status: string; list: any[] }>({ status: 'loading', list: [] });
export async function loadOffers() { try { offersStore.set({ status: 'ready', list: (await db.rpc('get_site_offers')) || [] }); } catch { offersStore.set({ status: 'error', list: [] }); } }

// ───────── auth / profile ─────────
export const authStore = createStore<{ status: 'loading' | 'out' | 'in' | 'noaccess'; profile: any | null }>({ status: getSession() ? 'loading' : 'out', profile: null });
export async function loadProfile() {
  const s = getSession();
  if (!s) { authStore.set({ status: 'out', profile: null }); return; }
  try {
    const rows = await db.select('profiles', `select=*&id=eq.${s.user.id}`);
    const p = rows?.[0];
    authStore.set(p && p.is_active ? { status: 'in', profile: p } : { status: 'noaccess', profile: p || null });
  } catch (e: any) {
    if (!getSession()) authStore.set({ status: 'out', profile: null });
    else authStore.set({ status: 'noaccess', profile: null });
  }
}
onAuthChange(() => { const st = authStore.get().status; const has = !!getSession(); if (!has && st !== 'out') authStore.set({ status: 'out', profile: null }); });
export const useAuth = () => useStore(authStore);
export const isOwner = () => authStore.get().profile?.role === 'owner';

// ───────── toasts & dialogs ─────────
type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string; action?: { label: string; onClick: () => void } };
export const toastStore = createStore<Toast[]>([]);
let tid = 0;
function pushToast(kind: Toast['kind'], text: string, action?: Toast['action'], ms = 3800) {
  const id = ++tid;
  toastStore.set((t) => [...t.slice(-3), { id, kind, text, action }]);
  setTimeout(() => toastStore.set((t) => t.filter((x) => x.id !== id)), ms);
}
export const toast = {
  success: (t: string, a?: Toast['action']) => pushToast('success', t, a),
  error: (t: string, a?: Toast['action']) => pushToast('error', t, a, 5500),
  info: (t: string, a?: Toast['action']) => pushToast('info', t, a),
};
export type AskOpts = { title: string; message?: string; actions?: { label: string; value: string; variant?: string }[]; input?: { label: string; placeholder?: string; required?: boolean; match?: string }; cancelLabel?: string };
export const askStore = createStore<(AskOpts & { resolve: (r: { value: string | null; text: string }) => void }) | null>(null);
export function ask(o: AskOpts): Promise<{ value: string | null; text: string }> {
  return new Promise((resolve) => askStore.set({ ...o, resolve: (r) => { askStore.set(null); resolve(r); } }));
}
export async function confirmAction(title: string, message: string, label = 'Confirm', variant = 'dark') {
  const r = await ask({ title, message, actions: [{ label, value: 'ok', variant }] });
  return r.value === 'ok';
}

// ───────── misc hooks ─────────
export function useInterval(fn: () => void, ms: number | null) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { if (ms == null) return; const t = setInterval(() => ref.current(), ms); return () => clearInterval(t); }, [ms]);
}
export function useNow(ms = 30000) { const [n, setN] = useState(Date.now()); useInterval(() => setN(Date.now()), ms); return n; }
export function useTitle(t: string) { useEffect(() => { const s = settingsStore.get().data?.shop_name || 'Crème & Crust'; document.title = t ? `${t} · ${s}` : `${s} — Made for your cravings`; }, [t]); }
export async function copyText(t: string) { try { await navigator.clipboard.writeText(t); toast.success(`Copied ${t}`); } catch { toast.info(`Code: ${t}`); } }
