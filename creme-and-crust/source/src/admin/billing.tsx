import { useEffect, useMemo, useState } from 'react';
import { LuPlus, LuMinus, LuTrash2, LuSearch, LuPrinter, LuBluetooth, LuBluetoothOff, LuBanknote, LuSmartphone, LuWallet, LuCircleCheckBig, LuCircleAlert, LuInfo, LuArrowLeft, LuReceipt, LuChartColumn, LuCalculator, LuPencil, LuChefHat, LuDownload, LuDatabaseBackup, LuChevronLeft, LuChevronRight, LuIndianRupee, LuX, LuSlidersHorizontal, LuCheck, LuEye } from 'react-icons/lu';
import { useMenu, useSettings, useStore, createStore, ls, inr, toPaise, taxOn, uid, errMsg, toast, useTitle, fmtTime, fmtDateTime, fmtDay, dayKey, startOfDay, addDays, paymentLabel, productGroups, ask, useAuth, validPhone, normalizePhone } from '../lib/core';
import { db } from '../lib/supa';
import { Btn, Modal, Empty, Skel, Seg, SearchInput, Img, Toggle, Field, Link, StatusPill, useDebounced } from '../ui';
import { BarChart } from '../charts';
import { refreshOrders, useLiveOrders, openOrder, ORDER_SELECT, ITEM_ORDER } from './data';
import { printerState, devicePrinter, effectiveConnection, printerReady, connectBluetooth, disconnectBluetooth, connectSerial, ENV, bluetoothAdvice, printOrderReceipt, buildReceipt, ReceiptView } from '../lib/printer';

// ───────── printer status chip with real connect / disconnect ─────────
export function PrinterChip({ compact }: { compact?: boolean }) {
  const s = useSettings().data; const ps = useStore(printerState); useStore(devicePrinter);
  const conn = effectiveConnection(s); const [busy, setBusy] = useState(false);
  const connect = async () => {
    setBusy(true);
    try { if (conn === 'bluetooth') await connectBluetooth(); else await connectSerial(); toast.success('Printer connected'); }
    catch (e) { const m = errMsg(e); if (!/No printer was selected|No port selected/i.test(m)) toast.error(m); }
    finally { setBusy(false); }
  };
  const label = conn === 'bluetooth' ? (ps.bt === 'connected' ? ps.btName : ps.bt === 'unsupported' ? 'Bluetooth not available here' : ps.bt === 'connecting' ? 'Connecting…' : 'Printer not connected')
    : conn === 'serial' ? (ps.serial === 'connected' ? 'USB printer connected' : ps.serial === 'unsupported' ? 'USB not available here' : 'Printer not connected')
    : conn === 'simulated' ? 'Simulated printer' : 'Browser / AirPrint';
  const ok = printerReady(s) && !(conn === 'bluetooth' && ps.bt === 'unsupported');
  return (
    <div className="row" style={{ gap: 8 }}>
      <span className={`printer-chip ${ok ? 'ok' : 'off'}`} title={conn === 'bluetooth' && ps.bt === 'unsupported' ? bluetoothAdvice() : undefined}>
        {conn === 'bluetooth' ? (ps.bt === 'connected' ? <LuBluetooth /> : <LuBluetoothOff />) : <LuPrinter />}{!compact && <span>{label}</span>}
      </span>
      {conn === 'bluetooth' && ps.bt !== 'unsupported' && (ps.bt === 'connected'
        ? <Btn size="sm" variant="ghost" onClick={() => { disconnectBluetooth(); toast.info('Printer disconnected'); }}>Disconnect</Btn>
        : <Btn size="sm" variant="primary" loading={busy || ps.bt === 'connecting'} onClick={connect}>Connect printer</Btn>)}
      {conn === 'serial' && ps.serial === 'disconnected' && <Btn size="sm" variant="primary" loading={busy} onClick={connect}>Connect printer</Btn>}
    </div>
  );
}

// ───────── POS state (draft only — every saved bill lives in the database) ─────────
type Line = { key: string; product_id?: string; name: string; price: number; option_ids: string[]; qty: number };
type Pos = { lines: Line[]; customer: string; phone: string; dtype: 'none' | 'percent' | 'fixed'; dvalue: string; tax: boolean; pay: string; kitchen: boolean; ref: string };
const fresh = (): Pos => ({ lines: [], customer: '', phone: '', dtype: 'none', dvalue: '', tax: true, pay: 'cash', kitchen: true, ref: uid() });
const posStore = createStore<Pos>({ ...fresh(), ...ls.get('cc.pos.draft', {}) });
posStore.subscribe(() => ls.set('cc.pos.draft', posStore.get()));
const setPos = (patch: Partial<Pos>) => posStore.set((p) => ({ ...p, ...patch }));
function addLine(l: Omit<Line, 'key' | 'qty'>, qty = 1) {
  const key = `${l.product_id || 'c:' + l.name + ':' + l.price}|${[...l.option_ids].sort().join(',')}`;
  posStore.set((p) => { const ex = p.lines.find((x) => x.key === key); return { ...p, lines: ex ? p.lines.map((x) => (x.key === key ? { ...x, qty: Math.min(99, x.qty + qty) } : x)) : [...p.lines, { ...l, key, qty }] }; });
}
export function posTotals(m: any, p: Pos, taxPct: number) {
  const lines = p.lines.map((l) => {
    const prod = l.product_id ? m.products.find((x: any) => x.id === l.product_id) : null;
    const opts = l.option_ids.map((id) => m.options.find((o: any) => o.id === id)).filter(Boolean);
    const unit = (prod ? prod.price_paise : l.price) + opts.reduce((s: number, o: any) => s + o.price_paise, 0);
    return { ...l, unit, total: unit * l.qty, opts, missing: !!l.product_id && (!prod || !prod.is_available) };
  });
  const sub = lines.reduce((s, l) => s + l.total, 0);
  const dv = p.dtype === 'percent' ? Number(p.dvalue) : toPaise(p.dvalue || '0');
  const dErr = p.dtype === 'none' ? '' : !(dv >= 0) || !Number.isFinite(dv) ? 'Enter a valid discount' : p.dtype === 'percent' && dv > 100 ? 'Max 100%' : p.dtype === 'fixed' && dv > sub ? 'More than the subtotal' : '';
  const disc = dErr || p.dtype === 'none' ? 0 : p.dtype === 'percent' ? Math.floor((sub * dv) / 100) : Math.round(dv);
  const tax = p.tax ? taxOn(sub - disc, taxPct) : 0;
  return { lines, sub, disc, tax, total: sub - disc + tax, dErr };
}

export function BillingPage() {
  useTitle('Billing');
  const m = useMenu(); const s = useSettings().data; const p = useStore(posStore); const me = useAuth().profile;
  const [cat, setCat] = useState('all'); const [q, setQ] = useState(''); const dq = useDebounced(q.trim().toLowerCase(), 120);
  const [opts, setOpts] = useState<any | null>(null); const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false); const [done, setDone] = useState<any | null>(null);
  const t = posTotals(m, p, s?.tax_percent);
  const cats = m.categories.filter((c) => m.products.some((x) => x.category_id === c.id));
  const list = m.products.filter((x) => (cat === 'all' || x.category_id === cat) && (!dq || x.name.toLowerCase().includes(dq)));
  const methods = [{ key: 'cash', label: 'Cash', icon: <LuBanknote /> }, { key: 'upi', label: 'UPI', icon: <LuSmartphone /> }, { key: 'other', label: 'Other', icon: <LuWallet /> }];
  const tap = (prod: any) => {
    if (!prod.is_available) { toast.info(`${prod.name} is marked sold out.`); return; }
    const groups = productGroups(m, prod.id);
    if (groups.some((g: any) => g.required)) { setOpts(prod); return; }
    addLine({ product_id: prod.id, name: prod.name, price: prod.price_paise, option_ids: [] });
  };
  const submit = async () => {
    if (busy) return;
    if (!t.lines.length) { toast.error('Add items to the bill first.'); return; }
    if (t.lines.some((l) => l.missing)) { toast.error('Remove the items marked unavailable.'); return; }
    if (t.dErr) { toast.error(`Discount: ${t.dErr}`); return; }
    if (p.phone && !validPhone(p.phone)) { toast.error('Enter a valid 10-digit mobile number, or leave it empty.'); return; }
    setBusy(true);
    try {
      const order = await db.rpc('create_counter_bill', { p: {
        client_ref: p.ref, customer_name: p.customer.trim(), phone: p.phone ? normalizePhone(p.phone) : '', payment_method: p.pay,
        discount_type: p.dtype, discount_value: p.dtype === 'percent' ? Number(p.dvalue || 0) : p.dtype === 'fixed' ? toPaise(p.dvalue || '0') : 0,
        apply_tax: p.tax, send_to_kitchen: p.kitchen,
        items: t.lines.map((l) => l.product_id ? { product_id: l.product_id, option_ids: l.option_ids, quantity: l.qty } : { name: l.name, unit_price_paise: l.price, quantity: l.qty }),
      } });
      if (Math.abs(order.total_paise - t.total) > 0) toast.info(`Total confirmed by the system: ${inr(order.total_paise)}`);
      posStore.set({ ...fresh(), tax: p.tax, kitchen: p.kitchen, pay: 'cash' });
      refreshOrders();
      const dp = devicePrinter.get(); const conn = effectiveConnection(s);
      let printed: any = null;
      if (dp.auto && conn !== 'browser' && printerReady(s)) printed = await printOrderReceipt(order, s);
      setDone({ order, printed });
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="pos">
      <header className="pos-top">
        <Link to="/admin" className="icon-btn" aria-label="Back to admin"><LuArrowLeft /></Link>
        <nav className="seg" aria-label="Billing sections">
          <Link to="/admin/billing" aria-current="page">Billing</Link>
          <Link to="/admin/sales">Sales today</Link>
          <Link to="/admin/bills">Bill history</Link>
        </nav>
        <span className="grow" />
        <span className="small muted hide-sm">{me?.full_name}</span>
        <PrinterChip />
      </header>
      <div className="pos-grid">
        <section className="pos-menu">
          <div className="pos-tools">
            <SearchInput value={q} onChange={setQ} placeholder="Search menu" />
            <Btn variant="soft" onClick={() => setCustom(true)}><LuPlus /> Custom item</Btn>
          </div>
          <div className="chips-scroll" style={{ padding: '2px 0 12px' }}>
            <button className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All</button>
            {cats.map((c) => <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.name.replace(/ Waffles$/, '')}</button>)}
          </div>
          {m.status === 'loading' ? <Skel h={300} /> : list.length === 0 ? <Empty icon={<LuSearch />} title="Nothing found" text="Try another search or add a custom item." /> : (
            <div className="pos-tiles">
              {list.map((x) => {
                const g = productGroups(m, x.id); const inBill = p.lines.filter((l) => l.product_id === x.id).reduce((n, l) => n + l.qty, 0);
                return (
                  <div key={x.id} className={`tile ${x.is_available ? '' : 'off'}`}>
                    <button className="tile-main" onClick={() => tap(x)} aria-label={`Add ${x.name}`}>
                      <Img src={x.image_url} alt={x.name} />
                      <span className="tile-name">{x.name}</span>
                      <span className="tile-price">{x.is_available ? inr(x.price_paise) : 'Sold out'}</span>
                      {inBill > 0 && <span className="tile-count">{inBill}</span>}
                    </button>
                    {g.length > 0 && x.is_available && <button className="tile-opt" onClick={() => setOpts(x)} aria-label={`Options for ${x.name}`}><LuSlidersHorizontal /></button>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <aside className="pos-bill">
          <div className="pos-bill-head"><b>Current bill</b><span className="tiny muted">{t.lines.reduce((n, l) => n + l.qty, 0)} items</span>{p.lines.length > 0 && <button className="link small" style={{ marginLeft: 'auto', color: 'var(--red)' }} onClick={async () => { const r = await ask({ title: 'Clear this bill?', message: 'All items on the current bill will be removed.', actions: [{ label: 'Clear bill', value: 'ok', variant: 'danger' }] }); if (r.value) posStore.set({ ...fresh(), tax: p.tax, kitchen: p.kitchen }); }}>Clear</button>}</div>
          <div className="pos-lines">
            {t.lines.length === 0 ? <div className="pos-empty"><LuReceipt /><p>Tap items on the left to start a bill.</p></div> : t.lines.map((l) => (
              <div key={l.key} className={`pos-line ${l.missing ? 'bad' : ''}`}>
                <div className="grow" style={{ minWidth: 0 }}>
                  <b>{l.name}</b>
                  {l.opts.length > 0 && <div className="tiny muted">{l.opts.map((o: any) => o.name).join(', ')}</div>}
                  <div className="tiny muted">{inr(l.unit)} each{l.missing ? ' · unavailable' : ''}</div>
                </div>
                <div className="qty">
                  <button aria-label={`Decrease ${l.name}`} onClick={() => posStore.set((x) => ({ ...x, lines: l.qty <= 1 ? x.lines.filter((y) => y.key !== l.key) : x.lines.map((y) => (y.key === l.key ? { ...y, qty: y.qty - 1 } : y)) }))}>{l.qty <= 1 ? <LuTrash2 /> : <LuMinus />}</button>
                  <span>{l.qty}</span>
                  <button aria-label={`Increase ${l.name}`} onClick={() => posStore.set((x) => ({ ...x, lines: x.lines.map((y) => (y.key === l.key ? { ...y, qty: Math.min(99, y.qty + 1) } : y)) }))}><LuPlus /></button>
                </div>
                <b className="num line-amt">{inr(l.total)}</b>
              </div>
            ))}
          </div>
          <div className="pos-foot">
            <div className="row" style={{ gap: 8 }}>
              <input className="input" placeholder="Customer name" value={p.customer} maxLength={60} onChange={(e) => setPos({ customer: e.target.value })} aria-label="Customer name" />
              <input className="input" placeholder="Mobile" inputMode="tel" value={p.phone} maxLength={14} onChange={(e) => setPos({ phone: e.target.value })} aria-label="Customer mobile" style={{ maxWidth: 150 }} />
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Seg label="Discount" value={p.dtype} onChange={(v) => setPos({ dtype: v as any, dvalue: '' })} options={[{ value: 'none', label: 'No discount' }, { value: 'percent', label: '%' }, { value: 'fixed', label: '₹' }]} />
              {p.dtype !== 'none' && <input className={`input ${t.dErr ? 'invalid' : ''}`} style={{ maxWidth: 110 }} inputMode="decimal" placeholder={p.dtype === 'percent' ? '10' : '50'} value={p.dvalue} onChange={(e) => setPos({ dvalue: e.target.value.replace(/[^\d.]/g, '') })} aria-label="Discount value" />}
            </div>
            <div className="row spread small">
              <label className="row" style={{ gap: 8 }}><Toggle label="Apply tax" checked={p.tax} onChange={(v) => setPos({ tax: v })} />{s?.tax_label || 'Tax'} {Number(s?.tax_percent) || 0}%</label>
              <label className="row" style={{ gap: 8 }}><Toggle label="Send to kitchen" checked={p.kitchen} onChange={(v) => setPos({ kitchen: v })} /><LuChefHat style={{ width: 16 }} /> Send to kitchen</label>
            </div>
            <div className="pos-sum">
              <div className="sum-row"><span className="muted">Subtotal</span><span>{inr(t.sub)}</span></div>
              {t.disc > 0 && <div className="sum-row"><span className="muted">Discount</span><span className="discount">−{inr(t.disc)}</span></div>}
              {t.dErr && <div className="sum-row small" style={{ color: 'var(--red)' }}><span>Discount</span><span>{t.dErr}</span></div>}
              {t.tax > 0 && <div className="sum-row"><span className="muted">{s?.tax_label || 'Tax'} {Number(s?.tax_percent)}%</span><span>{inr(t.tax)}</span></div>}
              <div className="sum-row total"><span>Total</span><span>{inr(t.total)}</span></div>
            </div>
            <div className="pay-row" role="radiogroup" aria-label="Payment method">
              {methods.map((x) => <button key={x.key} role="radio" aria-checked={p.pay === x.key} aria-pressed={p.pay === x.key} onClick={() => setPos({ pay: x.key })}>{x.icon}{x.label}</button>)}
            </div>
            <Btn variant="primary" size="lg" block loading={busy} disabled={!t.lines.length || !!t.dErr} onClick={submit}>{busy ? 'Saving bill…' : `Generate bill · ${inr(t.total)}`}</Btn>
          </div>
        </aside>
      </div>
      {opts && <PosOptions prod={opts} onClose={() => setOpts(null)} />}
      {custom && <CustomItem onClose={() => setCustom(false)} />}
      {done && <BillDone done={done} onClose={() => setDone(null)} />}
    </div>
  );
}

function PosOptions({ prod, onClose }: { prod: any; onClose: () => void }) {
  const m = useMenu(); const groups = productGroups(m, prod.id);
  const [sel, setSel] = useState<string[]>([]); const [qty, setQty] = useState(1);
  const toggle = (g: any, id: string) => setSel((cur) => {
    const inG = cur.filter((x) => g.options.some((o: any) => o.id === x));
    if (cur.includes(id)) return cur.filter((x) => x !== id);
    if (g.selection === 'single') return [...cur.filter((x) => !inG.includes(x)), id];
    if (g.max_select > 0 && inG.length >= g.max_select) return cur;
    return [...cur, id];
  });
  const missing = groups.filter((g: any) => g.required && !g.options.some((o: any) => sel.includes(o.id)));
  const unit = prod.price_paise + sel.reduce((s, id) => s + (m.options.find((o) => o.id === id)?.price_paise || 0), 0);
  return (
    <Modal open title={prod.name} onClose={onClose} footer={<><div className="row" style={{ marginRight: 'auto' }}><button className="icon-btn" aria-label="Decrease" onClick={() => setQty(Math.max(1, qty - 1))}><LuMinus /></button><b className="num">{qty}</b><button className="icon-btn" aria-label="Increase" onClick={() => setQty(Math.min(99, qty + 1))}><LuPlus /></button></div><Btn variant="primary" size="lg" disabled={missing.length > 0} onClick={() => { addLine({ product_id: prod.id, name: prod.name, price: prod.price_paise, option_ids: sel }, qty); onClose(); }}>Add · {inr(unit * qty)}</Btn></>}>
      {groups.map((g: any) => (
        <section key={g.id} className="cz-group" style={{ marginTop: 14 }}>
          <div className="cz-group-head"><h4>{g.name}</h4><span className="tiny muted">{g.selection === 'single' ? (g.required ? 'Choose 1 · Required' : 'Choose 1') : g.max_select ? `Up to ${g.max_select}` : 'Optional'}</span></div>
          <div className="cz-opts">{g.options.map((o: any) => <button key={o.id} type="button" className={`opt ${g.selection === 'single' ? 'radio' : ''}`} aria-pressed={sel.includes(o.id)} onClick={() => toggle(g, o.id)}><span className="tick"><LuCheck /></span>{o.name}<small>{o.price_paise ? `+${inr(o.price_paise)}` : 'Free'}</small></button>)}</div>
        </section>
      ))}
    </Modal>
  );
}

function CustomItem({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(''); const [price, setPrice] = useState(''); const [qty, setQty] = useState('1');
  const pp = toPaise(price); const q = parseInt(qty);
  const ok = name.trim().length > 0 && Number.isFinite(pp) && pp >= 0 && q >= 1 && q <= 99;
  return (
    <Modal open size="narrow" title="Custom item" onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!ok} onClick={() => { addLine({ name: name.trim(), price: pp, option_ids: [] }, q); onClose(); }}>Add to bill</Btn></>}>
      <div className="stack">
        <Field label="Item name" htmlFor="ci-name"><input id="ci-name" className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Extra cup, Party pack" /></Field>
        <div className="form-grid">
          <Field label="Price" htmlFor="ci-price" error={price && !(pp >= 0) ? 'Enter a valid price' : ''}><div className="input-group"><span className="addon">₹</span><input id="ci-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div></Field>
          <Field label="Quantity" htmlFor="ci-qty"><input id="ci-qty" className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} /></Field>
        </div>
        <p className="tiny muted">Custom items are saved on the bill but don’t affect menu stock.</p>
      </div>
    </Modal>
  );
}

function BillDone({ done, onClose }: { done: any; onClose: () => void }) {
  const s = useSettings().data; const [printed, setPrinted] = useState<any>(done.printed); const [busy, setBusy] = useState(false); const [preview, setPreview] = useState(false);
  const o = done.order; const conn = effectiveConnection(s);
  const print = async () => { setBusy(true); setPrinted(await printOrderReceipt(o, s)); setBusy(false); };
  const status = printed ? (printed.status === 'failed' ? 'fail' : 'ok') : null;
  return (
    <Modal open size="narrow" title="" bare onClose={onClose} footer={<><Btn variant="ghost" onClick={() => setPreview(!preview)}><LuEye /> {preview ? 'Hide' : 'Preview'}</Btn><Btn variant="soft" loading={busy} onClick={print}><LuPrinter /> {printed && printed.status !== 'failed' ? 'Reprint' : 'Print receipt'}</Btn><Btn variant="primary" onClick={onClose}>New bill</Btn></>}>
      <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
        <div className="success-mark" style={{ width: 72, height: 72 }}><LuCircleCheckBig /></div>
        <h2 className="serif" style={{ fontSize: 28 }}>Bill {o.receipt_no} saved</h2>
        <p className="muted" style={{ marginTop: 6 }}><b className="num" style={{ color: 'var(--ink)', fontSize: 22 }}>{inr(o.total_paise)}</b> · {payName(s, o.payment_method)} · {fmtTime(o.created_at)}</p>
        {o.status === 'accepted' && <p className="small" style={{ marginTop: 6 }}><LuChefHat style={{ width: 15, verticalAlign: '-3px' }} /> Sent to the kitchen as {o.order_number}</p>}
      </div>
      {status === 'ok' && <div className="notice notice-ok"><LuCircleCheckBig /><span>{printed.status === 'simulated' ? 'Simulated print — nothing was sent to a device.' : printed.status === 'sent_to_browser' ? 'Print dialog opened.' : 'Receipt sent to the printer.'}</span></div>}
      {status === 'fail' && <div className="notice notice-red"><LuCircleAlert /><span><b>Printing failed — the bill is saved.</b> {printed.error}</span></div>}
      {!printed && conn !== 'browser' && !printerReady(s) && <div className="notice"><LuInfo /><span>No printer connected, so nothing was printed. The bill is saved — connect the printer and tap Print.</span></div>}
      {preview && <div className="receipt-stage" style={{ marginTop: 14 }}><ReceiptView m={buildReceipt(o, s, o.receipt_no)} paper={(s?.receipt_paper || '80') as any} /></div>}
    </Modal>
  );
}

// ───────── daily sales dashboard ─────────
const saleOk = (o: any) => o.status !== 'cancelled' && (o.payment_status === 'paid' || o.status === 'completed');
function csvDownload(name: string, rows: (string | number)[][]) {
  const esc = (v: any) => { const t = String(v ?? ''); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const url = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
const rs = (p: number) => (p / 100).toFixed(2);

export function SalesPage() {
  useTitle('Sales');
  const live = useLiveOrders(); const s = useSettings().data;
  const [day, setDay] = useState(dayKey(new Date())); const isToday = day === dayKey(new Date());
  const [days, setDays] = useState<any[] | null>(null); const [tx, setTx] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const tick = Math.floor(live.updated / 10000);
  useEffect(() => {
    const to = new Date(day + 'T00:00'); const from = addDays(to, -29);
    db.rpc('sales_by_day', { p_from: dayKey(from), p_to: day }).then(setDays).catch((e) => setErr(errMsg(e)));
    const start = new Date(day + 'T00:00'); const end = addDays(start, 1);
    db.select('orders', `${ORDER_SELECT}&${ITEM_ORDER}&created_at=gte.${encodeURIComponent(start.toISOString())}&created_at=lt.${encodeURIComponent(end.toISOString())}&status=neq.cancelled&order=created_at.desc&limit=200`)
      .then((r) => setTx(r.filter(saleOk))).catch((e) => setErr(errMsg(e)));
  }, [day, isToday ? tick : 0]);
  const d = days?.find((x) => x.day === day) || null;
  const nd = (n: number) => setDay(dayKey(addDays(new Date(day + 'T00:00'), n)));
  return (
    <div>
      <div className="toolbar">
        <div className="row" style={{ gap: 6 }}><button className="icon-btn" aria-label="Previous day" onClick={() => nd(-1)}><LuChevronLeft /></button>
          <input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={day} max={dayKey(new Date())} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Day" />
          <button className="icon-btn" aria-label="Next day" disabled={isToday} onClick={() => nd(1)}><LuChevronRight /></button></div>
        {!isToday && <Btn size="sm" variant="ghost" onClick={() => setDay(dayKey(new Date()))}>Today</Btn>}
        {isToday && <span className={`live-dot ${live.live ? '' : 'off'}`}>Updates after every bill</span>}
        <Link to="/admin/billing" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}><LuCalculator /> New bill</Link>
      </div>
      {d && d.demo_bills > 0 && <div className="demo-banner"><LuInfo /><span><b>Demo data</b> — {d.demo_bills} of these {d.bills} sales are sample records.</span></div>}
      {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load sales" text={err} /> : <>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          <div className="card kpi"><span className="k-label"><LuIndianRupee /> Total sales {isToday ? 'today' : `· ${fmtDay(day)}`}</span><span className="k-value">{d ? inr(Number(d.gross)) : '—'}</span><span className="k-sub">item value before discounts</span></div>
          <div className="card kpi"><span className="k-label"><LuIndianRupee /> Revenue collected</span><span className="k-value">{d ? inr(Number(d.revenue)) : '—'}</span><span className="k-sub">{d ? `after ${inr(Number(d.discounts))} discounts · incl. ${inr(Number(d.tax))} tax` : ''}</span></div>
          <div className="card kpi"><span className="k-label"><LuReceipt /> Bills</span><span className="k-value">{d ? d.bills : '—'}</span><span className="k-sub">{d ? `${d.counter_bills} at counter · ${d.online_bills} online` : ''}</span></div>
          <div className="card kpi"><span className="k-label"><LuBanknote /> Cash received</span><span className="k-value">{d ? inr(Number(d.cash)) : '—'}</span></div>
          <div className="card kpi"><span className="k-label"><LuSmartphone /> UPI / digital</span><span className="k-value">{d ? inr(Number(d.upi) + Number(d.other)) : '—'}</span><span className="k-sub">{d && Number(d.other) ? `incl. ${inr(Number(d.other))} other` : ''}</span></div>
          <div className="card kpi"><span className="k-label"><LuCalculator /> Average bill</span><span className="k-value">{d ? inr(d.bills ? Math.round(Number(d.revenue) / d.bills) : 0) : '—'}</span></div>
        </div>
        <div className="dash-grid">
          <div className="card span-7">
            <div className="card-head"><h3>Transactions · {isToday ? 'today' : fmtDay(day)}</h3><span className="tiny muted">{tx ? `${tx.length} bills` : ''}</span></div>
            <div className="table-wrap">{!tx ? <div style={{ padding: 16 }}><Skel h={200} /></div> : tx.length === 0 ? <Empty icon={<LuReceipt />} title="No sales yet" text="Bills appear here the moment they’re saved." /> : (
              <table className="tbl"><thead><tr><th>Bill</th><th>Time</th><th className="hide-sm">Customer</th><th>Payment</th><th className="right">Amount</th></tr></thead><tbody>
                {tx.slice(0, 60).map((o) => <tr key={o.id} className="clickable" onClick={() => openOrder(o.id)}><td><b>{o.receipt_no || o.order_number}</b>{o.is_demo && <span className="demo-flag" style={{ marginLeft: 6 }}>Demo</span>}<div className="tiny muted">{o.source === 'counter' ? 'Counter' : 'Online'}</div></td><td className="small">{fmtTime(o.created_at)}</td><td className="hide-sm small">{o.customer_name}</td><td className="small">{payName(s, o.payment_method)}</td><td className="right num"><b>{inr(o.total_paise)}</b></td></tr>)}
              </tbody></table>)}</div>
          </div>
          <div className="card span-5">
            <div className="card-head"><h3>Revenue · last 14 days</h3></div>
            <div style={{ padding: '6px 16px 14px' }}>{days ? <BarChart data={days.slice(-14).map((x: any) => ({ label: String(new Date(x.day + 'T00:00').getDate()), sub: fmtDay(x.day + 'T00:00'), value: Number(x.revenue) }))} format={(n) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}k` : `₹${Math.round(n / 100)}`)} height={200} /> : <Skel h={200} />}</div>
          </div>
          <div className="card span-12">
            <div className="card-head"><h3>Daily records · 30 days</h3>{days && <Btn size="sm" variant="soft" onClick={() => csvDownload(`daily-sales-to-${day}.csv`, [['Date', 'Bills', 'Gross sales', 'Discounts', 'Tax', 'Revenue', 'Cash', 'UPI', 'Other', 'Counter bills', 'Online bills'], ...days.map((x: any) => [x.day, x.bills, rs(x.gross), rs(x.discounts), rs(x.tax), rs(x.revenue), rs(x.cash), rs(x.upi), rs(x.other), x.counter_bills, x.online_bills])])}><LuDownload /> Export CSV</Btn>}</div>
            <div className="table-wrap">{!days ? <div style={{ padding: 16 }}><Skel h={200} /></div> : (
              <table className="tbl"><thead><tr><th>Date</th><th className="right">Bills</th><th className="right">Revenue</th><th className="right hide-sm">Cash</th><th className="right hide-sm">UPI / digital</th><th className="right">Avg bill</th></tr></thead><tbody>
                {[...days].reverse().map((x: any) => <tr key={x.day} className="clickable" aria-selected={x.day === day} style={x.day === day ? { background: 'var(--caramel-soft)' } : undefined} onClick={() => setDay(x.day)}><td><b>{fmtDay(x.day + 'T00:00')}</b> <span className="tiny muted">{new Date(x.day + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</span></td><td className="right num">{x.bills}</td><td className="right num"><b>{inr(Number(x.revenue))}</b></td><td className="right num hide-sm">{inr(Number(x.cash))}</td><td className="right num hide-sm">{inr(Number(x.upi) + Number(x.other))}</td><td className="right num">{inr(x.bills ? Math.round(Number(x.revenue) / x.bills) : 0)}</td></tr>)}
              </tbody></table>)}</div>
          </div>
        </div>
      </>}
    </div>
  );
}
const payName = (s: any, k: string) => (k === 'other' ? 'Other' : paymentLabel(s, k));

// ───────── bill history ─────────
export function BillsPage() {
  useTitle('Bills');
  const s = useSettings().data; const owner = useAuth().profile?.role === 'owner'; const live = useLiveOrders();
  const [q, setQ] = useState(''); const dq = useDebounced(q.trim(), 300);
  const [mode, setMode] = useState('day'); const [day, setDay] = useState(dayKey(new Date())); const [from, setFrom] = useState(dayKey(addDays(new Date(), -6))); const [to, setTo] = useState(dayKey(new Date()));
  const [pay, setPay] = useState('all'); const [src, setSrc] = useState('all');
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState(''); const [limit, setLimit] = useState(50); const [sel, setSel] = useState<any | null>(null); const [busy, setBusy] = useState(''); const [reload, setReload] = useState(0);
  const filters = () => {
    const f = ['receipt_no=not.is.null'];
    if (mode === 'day') { const a = new Date(day + 'T00:00'); f.push(`created_at=gte.${encodeURIComponent(a.toISOString())}`, `created_at=lt.${encodeURIComponent(addDays(a, 1).toISOString())}`); }
    if (mode === 'range') { f.push(`created_at=gte.${encodeURIComponent(new Date(from + 'T00:00').toISOString())}`, `created_at=lt.${encodeURIComponent(addDays(new Date(to + 'T00:00'), 1).toISOString())}`); }
    if (pay !== 'all') f.push(`payment_method=eq.${pay}`);
    if (src !== 'all') f.push(`source=eq.${src}`);
    if (dq) { const t = dq.replace(/[(),*]/g, ''); f.push(`or=(receipt_no.ilike.*${encodeURIComponent(t)}*,order_number.ilike.*${encodeURIComponent(t)}*,customer_name.ilike.*${encodeURIComponent(t)}*)`); }
    return f;
  };
  useEffect(() => {
    let alive = true; setErr('');
    db.select('orders', [`${ORDER_SELECT},receipts(*)`, ITEM_ORDER, 'receipts.order=created_at.desc', ...filters(), 'order=created_at.desc', `limit=${limit + 1}`].join('&'))
      .then((r) => { if (!alive) return; setRows(r); setSel((cur: any) => (cur ? r.find((x: any) => x.id === cur.id) || null : null)); }).catch((e) => alive && setErr(errMsg(e)));
    return () => { alive = false; };
  }, [dq, mode, day, from, to, pay, src, limit, reload, Math.floor(live.updated / 15000)]); // eslint-disable-line
  const exportCsv = async () => {
    setBusy('csv');
    try {
      const all = await db.selectAll('orders', ['select=receipt_no,order_number,created_at,customer_name,phone,source,status,payment_method,payment_status,subtotal_paise,discount_paise,tax_paise,total_paise,is_demo,order_items(product_name,quantity,line_total_paise)', ...filters(), 'order=created_at.asc'].join('&'));
      csvDownload(`bills-${mode === 'day' ? day : mode === 'range' ? `${from}-to-${to}` : 'all'}.csv`, [['Bill no', 'Order no', 'Date', 'Time', 'Customer', 'Phone', 'Source', 'Status', 'Payment', 'Payment status', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Demo'],
        ...all.map((o: any) => [o.receipt_no, o.order_number, dayKey(o.created_at), fmtTime(o.created_at), o.customer_name, o.phone, o.source, o.status, o.payment_method, o.payment_status, o.order_items.map((i: any) => `${i.quantity}x ${i.product_name}`).join('; '), rs(o.subtotal_paise), rs(o.discount_paise), rs(o.tax_paise), rs(o.total_paise), o.is_demo ? 'yes' : ''])]);
      toast.success(`Exported ${all.length} bills`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const backup = async () => {
    setBusy('backup');
    try {
      const tables = ['shop_settings', 'categories', 'products', 'option_groups', 'options', 'product_option_groups', 'coupons', 'inventory_items', 'inventory_transactions', 'product_ingredients', 'deleted_bills_log'];
      const out: any = { app: 'Crème & Crust', exported_at: new Date().toISOString(), note: 'Amounts are in paise (₹1 = 100).' };
      out.orders = await db.selectAll('orders', 'select=*,order_items(*,order_item_options(*)),order_status_history(*),receipts(*)&order=created_at.asc');
      for (const t of tables) out[t] = await db.selectAll(t, 'select=*');
      const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `creme-and-crust-backup-${dayKey(new Date())}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
      toast.success(`Backup downloaded · ${out.orders.length} orders`);
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const reprint = async (o: any) => { setBusy(o.id); await printOrderReceipt(o, s); setBusy(''); setReload((n) => n + 1); };
  const del = async (o: any) => {
    const no = o.receipt_no || o.order_number;
    const a = await ask({ title: `Permanently delete bill ${no}?`, message: 'This removes the bill from history and totals. A copy is kept in the deletion log. This cannot be undone.', input: { label: `Type ${no} to confirm`, match: no, required: true }, actions: [{ label: 'Continue', value: 'ok', variant: 'danger' }] });
    if (a.value !== 'ok') return;
    const r = await ask({ title: 'Reason for deleting', input: { label: 'Reason', required: true, placeholder: 'e.g. Duplicate test bill' }, actions: [{ label: 'Delete permanently', value: 'ok', variant: 'danger' }] });
    if (r.value !== 'ok') return;
    try { await db.rpc('delete_order_permanently', { p_order_id: o.id, p_confirm: no, p_reason: r.text }); toast.success(`Bill ${no} deleted`); setSel(null); setRows((x) => (x || []).filter((y) => y.id !== o.id)); refreshOrders(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const shown = rows?.slice(0, limit) || [];
  const sum = shown.filter(saleOk).reduce((t, o) => t + o.total_paise, 0);
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card card-pad row row-wrap spread"><PrinterChip /><div className="row row-wrap"><Btn size="sm" variant="soft" loading={busy === 'csv'} onClick={exportCsv}><LuDownload /> Export CSV</Btn>{owner && <Btn size="sm" variant="soft" loading={busy === 'backup'} onClick={backup}><LuDatabaseBackup /> Full backup</Btn>}<Link to="/admin/billing" className="btn btn-primary btn-sm"><LuCalculator /> New bill</Link></div></div>
      <div className="toolbar" style={{ margin: 0 }}>
        <SearchInput value={q} onChange={setQ} placeholder="Bill no, order no or name" />
        <Seg label="Dates" value={mode} onChange={setMode} options={[{ value: 'day', label: 'One day' }, { value: 'range', label: 'Range' }, { value: 'all', label: 'All' }]} />
        {mode === 'day' && <input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={day} onChange={(e) => e.target.value && setDay(e.target.value)} aria-label="Day" />}
        {mode === 'range' && <><input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="From" /><input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={to} min={from} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="To" /></>}
        <select className="select" value={pay} onChange={(e) => setPay(e.target.value)} aria-label="Payment"><option value="all">All payments</option><option value="cash">Cash</option><option value="upi">UPI</option><option value="other">Other</option>{(s?.payment_methods || []).filter((x: any) => !['cash', 'upi'].includes(x.key)).map((x: any) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
        <select className="select" value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Source"><option value="all">Counter + online</option><option value="counter">Counter bills</option><option value="online">Online orders</option></select>
      </div>
      <div className="two-col" style={{ gridTemplateColumns: sel ? 'minmax(0,1fr) minmax(0,380px)' : '1fr' }}>
        <div className="card table-wrap">
          {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load bills" text={err} /> : !rows ? <div style={{ padding: 16 }}><Skel h={300} /></div> : shown.length === 0 ? <Empty icon={<LuReceipt />} title="No bills found" text="Try another date or search." /> : <>
            <div className="row spread small" style={{ padding: '12px 16px 0' }}><span className="muted">{shown.length}{rows.length > limit ? '+' : ''} bills shown</span><b className="num">{inr(sum)} collected</b></div>
            <table className="tbl"><thead><tr><th>Bill no</th><th>Date &amp; time</th><th className="hide-sm">Customer</th><th>Payment</th><th className="right">Total</th><th /></tr></thead><tbody>
              {shown.map((o) => (
                <tr key={o.id} className="clickable" style={sel?.id === o.id ? { background: 'var(--caramel-soft)' } : undefined} onClick={() => setSel(o)}>
                  <td><b>{o.receipt_no}</b>{o.is_demo && <span className="demo-flag" style={{ marginLeft: 6 }}>Demo</span>}<div className="tiny muted">{o.source === 'counter' ? 'Counter' : `Online · ${o.order_number}`}{o.status === 'cancelled' ? ' · cancelled' : ''}</div></td>
                  <td className="small">{fmtDateTime(o.created_at)}</td>
                  <td className="hide-sm small">{o.customer_name}</td>
                  <td className="small">{payName(s, o.payment_method)}<div className="tiny muted">{o.payment_status}</div></td>
                  <td className="right num"><b>{inr(o.total_paise)}</b></td>
                  <td onClick={(e) => e.stopPropagation()}><Btn size="sm" variant="soft" loading={busy === o.id} onClick={() => reprint(o)}><LuPrinter /> Reprint</Btn></td>
                </tr>
              ))}
            </tbody></table>
            {rows.length > limit && <div style={{ padding: 16, textAlign: 'center' }}><Btn variant="soft" onClick={() => setLimit(limit + 50)}>Load more</Btn></div>}
          </>}
        </div>
        {sel && (
          <aside className="card card-pad stack sticky-col" style={{ gap: 12 }}>
            <div className="row spread"><b>Bill {sel.receipt_no}</b><button className="icon-btn icon-btn-sm" aria-label="Close" onClick={() => setSel(null)}><LuX /></button></div>
            <div className="row row-wrap" style={{ gap: 6 }}><StatusPill s={sel.status} /><span className="badge">{sel.source === 'counter' ? 'Counter' : 'Online'}</span><span className="badge">{payName(s, sel.payment_method)} · {sel.payment_status}</span></div>
            <div className="receipt-stage"><ReceiptView m={buildReceipt(sel, s)} paper={(s?.receipt_paper || '80') as any} /></div>
            <div className="small muted">Printed {sel.receipts.filter((r: any) => r.status !== 'failed').length} time(s){sel.receipts[0] ? ` · last ${fmtDateTime(sel.receipts[0].created_at)}` : ''}</div>
            <div className="row row-wrap"><Btn variant="primary" loading={busy === sel.id} onClick={() => reprint(sel)}><LuPrinter /> Reprint</Btn><Btn variant="ghost" onClick={() => openOrder(sel.id)}>Full details</Btn>{owner && <Btn variant="danger-soft" onClick={() => del(sel)}><LuTrash2 /> Delete</Btn>}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
export { LuPencil, LuChartColumn, useMemo };
