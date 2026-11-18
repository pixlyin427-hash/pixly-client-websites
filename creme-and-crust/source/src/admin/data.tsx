import { useEffect } from 'react';
import { db, subscribeOrders } from '../lib/supa';
import { createStore, useStore, startOfDay, toast, navigate, ask, errMsg, ls, settingsStore, inr } from '../lib/core';

export const ORDER_SELECT = 'select=*,order_items(*,order_item_options(*))';
export const ITEM_ORDER = 'order_items.order=position.asc';
type Live = { status: 'idle' | 'loading' | 'ready' | 'error'; list: any[]; live: boolean; error?: string; updated: number; fresh: string[] };
export const liveOrders = createStore<Live>({ status: 'idle', list: [], live: false, updated: 0, fresh: [] });
export const prefs = createStore<{ sound: boolean }>(ls.get('cc.admin.prefs', { sound: true }));
prefs.subscribe(() => ls.set('cc.admin.prefs', prefs.get()));

let audio: AudioContext | null = null;
export function unlockAudio() { try { audio = audio || new (window.AudioContext || (window as any).webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch { /* no audio */ } }
export function chime() {
  if (!prefs.get().sound || !audio) return;
  try {
    const t = audio.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const o = audio!.createOscillator(); const g = audio!.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.16); g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.16 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.5);
      o.connect(g).connect(audio!.destination); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 0.55);
    });
  } catch { /* ignore */ }
}

let inflight: Promise<void> | null = null;
export function refreshOrders(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    const prev = liveOrders.get();
    if (prev.status === 'idle') liveOrders.set((s) => ({ ...s, status: 'loading' }));
    try {
      const since = startOfDay().toISOString();
      const list = await db.select('orders', `${ORDER_SELECT}&${ITEM_ORDER}&or=(status.in.(new,accepted,preparing,ready),created_at.gte.${encodeURIComponent(since)})&order=created_at.desc&limit=400`);
      let fresh = prev.fresh;
      if (prev.status === 'ready') {
        const known = new Set(prev.list.map((o) => o.id));
        const incoming = list.filter((o: any) => !known.has(o.id) && o.status === 'new');
        if (incoming.length) {
          fresh = [...fresh, ...incoming.map((o: any) => o.id)].slice(-20);
          chime();
          incoming.slice(0, 2).forEach((o: any) => toast.info(`New order ${o.order_number} · ${o.customer_name} · ${inr(o.total_paise)}`, { label: 'View', onClick: () => navigate('/admin/orders') }));
        }
      }
      liveOrders.set((s) => ({ ...s, status: 'ready', list, error: undefined, updated: Date.now(), fresh }));
    } catch (e) {
      liveOrders.set((s) => ({ ...s, status: s.status === 'ready' ? 'ready' : 'error', error: errMsg(e) }));
    } finally { inflight = null; }
  })();
  return inflight;
}

let users = 0; let stopRt: (() => void) | null = null; let poll: any = null; let deb: any = null;
export function useLiveOrders() {
  useEffect(() => {
    users++;
    if (users === 1) {
      refreshOrders();
      stopRt = subscribeOrders(() => { clearTimeout(deb); deb = setTimeout(refreshOrders, 400); }, (live) => liveOrders.set((s) => (s.live === live ? s : { ...s, live })));
      poll = setInterval(() => { if (document.visibilityState === 'visible') refreshOrders(); }, 15000);
    }
    return () => { users--; if (users === 0) { stopRt?.(); clearInterval(poll); stopRt = null; } };
  }, []);
  return useStore(liveOrders);
}
export const markSeen = (id: string) => liveOrders.set((s) => ({ ...s, fresh: s.fresh.filter((x) => x !== id) }));

// ───────── order actions with confirmation + duplicate protection ─────────
export const busyOrders = createStore<Record<string, boolean>>({});
export const useBusy = () => useStore(busyOrders);
const LABEL: Record<string, string> = { accepted: 'accepted', preparing: 'is being prepared', ready: 'is ready', completed: 'completed', cancelled: 'cancelled' };

export async function moveOrder(o: any, to: string): Promise<boolean> {
  if (busyOrders.get()[o.id]) return false;
  let note: string | null = null;
  if (to === 'cancelled') {
    const accepted = o.status !== 'new';
    const r = await ask({
      title: accepted ? `Cancel order ${o.order_number}?` : `Reject order ${o.order_number}?`,
      message: accepted ? 'This order was already accepted. The customer will see it as cancelled. Please give a reason.' : 'The customer will see that the order was not accepted.',
      input: { label: 'Reason', placeholder: accepted ? 'e.g. Ran out of ice cream' : 'e.g. Closing early today', required: accepted },
      actions: [{ label: accepted ? 'Cancel order' : 'Reject order', value: 'ok', variant: 'danger' }], cancelLabel: 'Keep order',
    });
    if (r.value !== 'ok') return false;
    note = r.text || null;
  }
  let markPaid = false;
  if (to === 'completed' && o.payment_status === 'unpaid') {
    const r = await ask({
      title: `Complete ${o.order_number}?`, message: `Payment (${inr(o.total_paise)}) is still marked as unpaid. Has the customer paid?`,
      actions: [{ label: 'Complete without payment', value: 'skip', variant: 'ghost' }, { label: 'Paid — complete', value: 'paid', variant: 'ok' }],
    });
    if (!r.value) return false;
    markPaid = r.value === 'paid';
  }
  busyOrders.set((b) => ({ ...b, [o.id]: true }));
  liveOrders.set((s) => ({ ...s, list: s.list.map((x) => (x.id === o.id ? { ...x, status: to, _pending: true } : x)) }));
  try {
    if (markPaid) await db.rpc('set_payment_status', { p_order_id: o.id, p_status: 'paid' });
    await db.rpc('update_order_status', { p_order_id: o.id, p_expected: o.status, p_to: to, p_note: note });
    toast.success(`Order ${o.order_number} ${LABEL[to] || to}`);
    markSeen(o.id);
    return true;
  } catch (e: any) {
    if (e?.hint === 'stale') toast.info(errMsg(e)); else toast.error(errMsg(e));
    return false;
  } finally {
    busyOrders.set((b) => { const n = { ...b }; delete n[o.id]; return n; });
    refreshOrders();
  }
}

export async function setPayment(o: any, status: string) {
  try { await db.rpc('set_payment_status', { p_order_id: o.id, p_status: status }); toast.success(`Payment marked ${status}`); refreshOrders(); return true; }
  catch (e) { toast.error(errMsg(e)); return false; }
}

// order detail drawer is opened from many places
export const orderDrawer = createStore<string | null>(null);
export const openOrder = (id: string) => orderDrawer.set(id);
export async function fetchOrder(id: string) {
  const rows = await db.select('orders', `${ORDER_SELECT},order_status_history(*),receipts(*)&${ITEM_ORDER}&id=eq.${id}&order_status_history.order=created_at.asc&receipts.order=created_at.desc`);
  return rows?.[0] || null;
}
export const settingsNow = () => settingsStore.get().data;
