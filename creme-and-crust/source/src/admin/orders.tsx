import { useEffect, useMemo, useState } from 'react';
import { LuClock, LuPrinter, LuEye, LuX, LuMaximize, LuMinimize, LuVolume2, LuVolumeX, LuArrowLeft, LuMessageCircle, LuPhone, LuClipboardList, LuRefreshCw, LuLayoutDashboard, LuReceipt, LuCircleAlert } from 'react-icons/lu';
import { useStore, useSettings, inr, fmtTime, fmtDateTime, ago, minutesSince, NEXT, orderTypeLabel, paymentLabel, useNow, useTitle, errMsg, toast, addDays, startOfDay, useQuery } from '../lib/core';
import { db } from '../lib/supa';
import { Btn, Drawer, Empty, Skel, StatusPill, Seg, SearchInput, useDebounced, Link } from '../ui';
import { useLiveOrders, moveOrder, useBusy, openOrder, orderDrawer, fetchOrder, setPayment, prefs, unlockAudio, markSeen, ORDER_SELECT, ITEM_ORDER } from './data';
import { printOrderReceipt, buildReceipt, ReceiptView } from '../lib/printer';

const COLS = [['new', 'New'], ['accepted', 'Accepted'], ['preparing', 'Preparing'], ['ready', 'Ready']] as const;
const optText = (i: any) => (i.order_item_options || []).map((x: any) => x.option_name).join(', ');

export function OrderTicket({ o }: { o: any }) {
  const busy = useBusy()[o.id]; const s = useSettings().data; useNow(30000);
  const next = NEXT[o.status]; const age = minutesSince(o.created_at);
  return (
    <div className={`ocard s-${o.status}`}>
      <div className="o-top">
        <button className="o-no" onClick={() => openOrder(o.id)}>{o.order_number}</button>
        {o.is_demo && <span className="demo-flag">Demo</span>}
        <span className={`o-age ${age > 20 && o.status !== 'ready' ? 'late' : ''}`}><LuClock />{age < 1 ? 'now' : `${age}m`}</span>
      </div>
      <div className="o-meta"><b style={{ color: 'var(--ink)' }}>{o.customer_name}</b> · {orderTypeLabel(o.order_type, o.table_label)}{o.source === 'counter' && <span className="badge" style={{ height: 20 }}>Counter{o.receipt_no ? ` · ${o.receipt_no}` : ''}</span>}</div>
      <div className="o-items">
        {o.order_items.map((i: any) => <div key={i.id}><b>{i.quantity}×</b> {i.product_name}{optText(i) && <small> · {optText(i)}</small>}{i.notes && <small style={{ color: 'var(--caramel-ink)' }}> · “{i.notes}”</small>}</div>)}
      </div>
      {o.notes && <div className="o-note"><b>Note:</b> {o.notes}</div>}
      <div className="o-meta"><b className="num" style={{ color: 'var(--ink)' }}>{inr(o.total_paise)}</b> · {paymentLabel(s, o.payment_method)} · <span style={{ color: o.payment_status === 'paid' ? 'var(--ok)' : 'var(--warn)', fontWeight: 500 }}>{o.payment_status}</span></div>
      <div className="o-actions">
        {next && <Btn size="sm" variant={o.status === 'new' ? 'primary' : o.status === 'ready' ? 'ok' : 'dark'} loading={busy} onClick={() => moveOrder(o, next.to)}>{next.label}</Btn>}
        {o.status === 'new' && <Btn size="sm" variant="danger-soft" disabled={busy} onClick={() => moveOrder(o, 'cancelled')} style={{ flex: '0 0 auto' }}>Reject</Btn>}
        <button className="icon-btn icon-btn-sm" title="Print receipt" aria-label="Print receipt" onClick={() => printOrderReceipt(o, s)}><LuPrinter /></button>
        <button className="icon-btn icon-btn-sm" title="Details" aria-label="Order details" onClick={() => openOrder(o.id)}><LuEye /></button>
      </div>
    </div>
  );
}

export function OrdersPage() {
  useTitle('Orders');
  const q = useQuery();
  const [view, setView] = useState(q.get('q') ? 'all' : 'board');
  return (
    <div>
      <div className="toolbar spread">
        <Seg label="View" value={view} onChange={setView} options={[{ value: 'board', label: 'Live board', icon: <LuLayoutDashboard /> }, { value: 'all', label: 'All orders', icon: <LuClipboardList /> }]} />
        <Link to="/admin/kitchen" className="btn btn-soft btn-sm">Open kitchen screen</Link>
      </div>
      {view === 'board' ? <Board /> : <AllOrders initialQ={q.get('q') || ''} />}
    </div>
  );
}

function Board() {
  const live = useLiveOrders();
  const [mobileCol, setMobileCol] = useState('new');
  if (live.status === 'loading' || live.status === 'idle') return <div className="board">{COLS.map(([k]) => <div key={k} className="col show"><Skel h={22} w={120} /><Skel h={150} r={14} style={{ marginTop: 14 }} /></div>)}</div>;
  if (live.status === 'error') return <Empty icon={<LuCircleAlert />} title="Couldn’t load orders" text={live.error} action={<Btn variant="outline" onClick={() => location.reload()}>Reload</Btn>} />;
  const by = (st: string) => live.list.filter((o) => o.status === st).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const doneToday = live.list.filter((o) => o.status === 'completed' || o.status === 'cancelled');
  return (
    <>
      <div className="row spread row-wrap" style={{ marginBottom: 12 }}>
        <span className={`live-dot ${live.live ? '' : 'off'}`}>{live.live ? 'Live updates on' : 'Auto-refreshing every 15 s'} · updated {fmtTime(new Date(live.updated))}</span>
        <span className="small muted">{doneToday.length} completed or cancelled today</span>
      </div>
      <div className="board-tabs"><Seg label="Status" value={mobileCol} onChange={setMobileCol} options={COLS.map(([k, l]) => ({ value: k, label: `${l} ${by(k).length}` }))} /></div>
      <div className="board">
        {COLS.map(([k, label]) => {
          const list = by(k);
          return (
            <section key={k} className={`col ${mobileCol === k ? 'show' : ''}`}>
              <div className="col-head"><span className={`st st-${k}`}>{label}</span><span className="n">{list.length}</span></div>
              <div className="col-list">
                {list.length ? list.map((o) => <OrderTicket key={o.id} o={o} />) : <div className="col-empty">{k === 'new' ? 'No orders yet. New orders will appear here.' : 'Nothing here right now.'}</div>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function AllOrders({ initialQ }: { initialQ: string }) {
  const s = useSettings().data;
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('7');
  const [search, setSearch] = useState(initialQ);
  const dq = useDebounced(search.trim(), 300);
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState(50);
  useEffect(() => {
    let alive = true; setRows(null); setErr('');
    const parts = [ORDER_SELECT, ITEM_ORDER, 'order=created_at.desc', `limit=${limit + 1}`];
    if (status !== 'all') parts.push(`status=eq.${status}`);
    if (range !== 'all') parts.push(`created_at=gte.${encodeURIComponent(addDays(startOfDay(), -Number(range) + 1).toISOString())}`);
    if (dq) { const t = dq.replace(/[(),*]/g, ''); parts.push(`or=(order_number.ilike.*${encodeURIComponent(t)}*,customer_name.ilike.*${encodeURIComponent(t)}*,phone.ilike.*${encodeURIComponent(t.replace(/\D/g, '') || t)}*)`); }
    db.select('orders', parts.join('&')).then((r) => alive && setRows(r)).catch((e) => alive && setErr(errMsg(e)));
    return () => { alive = false; };
  }, [status, range, dq, limit]);
  const more = rows && rows.length > limit;
  return (
    <div className="card">
      <div className="toolbar" style={{ padding: '16px 16px 0' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Order no, name or phone" />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="all">All statuses</option>{['new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].map((x) => <option key={x} value={x}>{x[0].toUpperCase() + x.slice(1)}</option>)}</select>
        <select className="select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range"><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select>
      </div>
      {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load orders" text={err} /> : !rows ? <div style={{ padding: 16 }}><Skel h={240} /></div> : rows.length === 0 ? <Empty icon={<LuClipboardList />} title="No orders found" text="Try a different filter or date range." /> : (
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Items</th><th className="right">Amount</th><th>Status</th><th className="hide-sm">Time</th><th /></tr></thead>
            <tbody>
              {rows.slice(0, limit).map((o) => (
                <tr key={o.id} className="clickable" onClick={() => openOrder(o.id)}>
                  <td><b>{o.order_number}</b> {o.is_demo && <span className="demo-flag">Demo</span>}</td>
                  <td>{o.customer_name}<div className="tiny muted">{orderTypeLabel(o.order_type, o.table_label)}</div></td>
                  <td className="hide-sm small" style={{ maxWidth: 260 }}>{o.order_items.map((i: any) => `${i.quantity}× ${i.product_name}`).join(', ')}</td>
                  <td className="right num"><b>{inr(o.total_paise)}</b><div className="tiny muted">{paymentLabel(s, o.payment_method)} · {o.payment_status}</div></td>
                  <td><StatusPill s={o.status} /></td>
                  <td className="hide-sm small muted">{fmtDateTime(o.created_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}><button className="icon-btn icon-btn-sm" aria-label="Print receipt" title="Print receipt" onClick={() => printOrderReceipt(o, s)}><LuPrinter /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {more && <div style={{ padding: 16, textAlign: 'center' }}><Btn variant="soft" onClick={() => setLimit(limit + 50)}>Load more</Btn></div>}
        </div>
      )}
    </div>
  );
}

// ───────── order detail drawer ─────────
export function OrderDrawerHost() {
  const id = useStore(orderDrawer);
  if (!id) return null;
  return <OrderDrawer id={id} onClose={() => orderDrawer.set(null)} />;
}
function OrderDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useSettings().data; const busy = useBusy()[id];
  const [o, setO] = useState<any>(null); const [err, setErr] = useState('');
  const [paper, setPaper] = useState<'58' | '80'>((s?.receipt_paper || '80') as any);
  const [showReceipt, setShowReceipt] = useState(false);
  const load = () => fetchOrder(id).then((r) => { if (r) setO(r); else setErr('Order not found.'); }).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); markSeen(id); }, [id]); // eslint-disable-line
  const act = async (to: string) => { if (o && (await moveOrder(o, to))) load(); else load(); };
  const next = o && NEXT[o.status];
  const final = o && (o.status === 'completed' || o.status === 'cancelled');
  const print = async () => { if (!o) return; await printOrderReceipt(o, s, paper); load(); };
  return (
    <Drawer open onClose={onClose} wide title={o ? <span className="row" style={{ gap: 10 }}>{o.order_number}<StatusPill s={o.status} />{o.is_demo && <span className="demo-flag">Demo</span>}</span> : 'Order'}
      footer={o && <>
        {next && <Btn variant={o.status === 'ready' ? 'ok' : 'primary'} loading={busy} onClick={() => act(next.to)}>{next.label}</Btn>}
        {!final && <Btn variant="danger-soft" disabled={busy} onClick={() => act('cancelled')}>{o.status === 'new' ? 'Reject' : 'Cancel order'}</Btn>}
        <Btn variant="soft" onClick={print}><LuPrinter /> {o.receipts?.length ? 'Reprint receipt' : 'Print receipt'}</Btn>
        <Btn variant="ghost" onClick={() => setShowReceipt(!showReceipt)}><LuReceipt /> {showReceipt ? 'Hide preview' : 'Preview'}</Btn>
      </>}>
      {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load this order" text={err} /> : !o ? <Skel h={400} r={16} /> : <>
        {showReceipt && <div className="od-sec"><div className="row spread" style={{ marginBottom: 12 }}><h4 style={{ margin: 0 }}>Receipt preview</h4><Seg label="Paper" value={paper} onChange={(v) => setPaper(v as any)} options={[{ value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }]} /></div><div className="receipt-stage"><ReceiptView m={buildReceipt(o, s)} paper={paper} /></div></div>}
        <div className="od-sec">
          <h4>Customer</h4>
          <dl className="kv">
            <dt>Name</dt><dd>{o.customer_name}</dd>
            <dt>Phone</dt><dd><a href={`tel:+91${o.phone}`} className="link"><LuPhone /> +91 {o.phone}</a> · <a className="link" href={`https://wa.me/91${o.phone}`} target="_blank" rel="noreferrer"><LuMessageCircle /> WhatsApp</a></dd>
            <dt>Type</dt><dd>{orderTypeLabel(o.order_type, o.table_label)}</dd>
            <dt>Placed</dt><dd>{fmtDateTime(o.created_at)} · {ago(o.created_at)}</dd>
          </dl>
        </div>
        {o.notes && <div className="special"><b>Special instructions:</b> {o.notes}</div>}
        <div className="od-sec">
          <h4>Items</h4>
          {o.order_items.map((i: any) => (
            <div className="od-item" key={i.id}>
              <span className="q">{i.quantity}×</span>
              <div className="grow"><b>{i.product_name}</b>
                {i.order_item_options.length > 0 && <div className="small muted">{i.order_item_options.map((x: any) => `${x.option_name}${x.price_paise ? ` (+${inr(x.price_paise)})` : ''}`).join(' · ')}</div>}
                {i.notes && <div className="small" style={{ color: 'var(--caramel-ink)', fontWeight: 500 }}>“{i.notes}”</div>}
              </div>
              <span className="num">{inr(i.line_total_paise)}</span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <div className="sum-row"><span className="muted">Subtotal</span><span>{inr(o.subtotal_paise)}</span></div>
            {o.discount_paise > 0 && <div className="sum-row"><span className="muted">Discount ({o.coupon_code})</span><span className="discount">−{inr(o.discount_paise)}</span></div>}
            {o.tax_paise > 0 && <div className="sum-row"><span className="muted">{s?.tax_label || 'Tax'} {Number(o.tax_percent)}%</span><span>{inr(o.tax_paise)}</span></div>}
            <div className="sum-row total"><span>Total</span><span>{inr(o.total_paise)}</span></div>
          </div>
        </div>
        <div className="od-sec">
          <h4>Payment</h4>
          <div className="row spread row-wrap">
            <span>{paymentLabel(s, o.payment_method)} · <b style={{ color: o.payment_status === 'paid' ? 'var(--ok)' : o.payment_status === 'refunded' ? 'var(--info)' : 'var(--warn)' }}>{o.payment_status}</b></span>
            <div className="row" style={{ gap: 8 }}>
              {o.payment_status === 'unpaid' && o.status !== 'cancelled' && <Btn size="sm" variant="ok" onClick={async () => { await setPayment(o, 'paid'); load(); }}>Mark paid</Btn>}
              {o.payment_status === 'paid' && o.status !== 'cancelled' && <Btn size="sm" variant="ghost" onClick={async () => { await setPayment(o, 'unpaid'); load(); }}>Mark unpaid</Btn>}
              {o.payment_status === 'paid' && o.status === 'cancelled' && <Btn size="sm" variant="soft" onClick={async () => { await setPayment(o, 'refunded'); load(); }}>Mark refunded</Btn>}
            </div>
          </div>
          <p className="tiny muted" style={{ marginTop: 8 }}>Payments are taken at the counter; this records what staff confirmed.</p>
        </div>
        <div className="od-sec">
          <h4>Status history</h4>
          <div className="hist">
            {(o.order_status_history || []).map((h: any) => (
              <div key={h.id} className="hist-row"><div className="grow"><b>{h.from_status === h.to_status ? (h.note || 'Updated') : h.to_status === 'new' ? 'Order placed' : `${h.from_status ? h.from_status + ' → ' : ''}${h.to_status}`}</b>{h.note && h.from_status !== h.to_status && <div className="small muted">{h.note}</div>}</div><span className="small muted">{fmtTime(h.created_at)}</span></div>
            ))}
          </div>
          {o.cancel_reason && <p className="small" style={{ marginTop: 8, color: 'var(--red)' }}>Cancellation reason: {o.cancel_reason}</p>}
        </div>
        <div className="od-sec">
          <h4>Receipts</h4>
          {o.receipts?.length ? o.receipts.map((r: any) => <div key={r.id} className="sum-row small"><span>{r.receipt_no} · {r.kind} · {r.method === 'simulated' ? 'simulated printer' : r.method === 'serial' ? 'thermal printer' : 'browser print'} · {r.paper} mm</span><span className="muted">{fmtDateTime(r.created_at)}</span></div>) : <p className="small muted">No receipt printed yet.</p>}
        </div>
      </>}
    </Drawer>
  );
}

// ───────── kitchen display ─────────
export function KitchenPage() {
  useTitle('Kitchen');
  const live = useLiveOrders(); const p = useStore(prefs); const busy = useBusy(); const now = useNow(15000);
  const [fs, setFs] = useState(!!document.fullscreenElement);
  useEffect(() => { const f = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  const toggleFs = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { toast.info('Fullscreen is not available in this browser.'); } };
  const by = (st: string) => live.list.filter((o) => o.status === st).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const colors: Record<string, string> = { new: '#e8b04a', accepted: '#7aa5e0', preparing: '#ec8f52', ready: '#5cc187' };
  const actionLabel: Record<string, string> = { new: 'Accept', accepted: 'Start preparing', preparing: 'Mark ready', ready: 'Picked up' };
  return (
    <div className="kitchen" onClick={unlockAudio}>
      <div className="k-top">
        <Link to="/admin/orders" className="icon-btn" aria-label="Back to admin"><LuArrowLeft /></Link>
        <h1>Kitchen</h1>
        <span className={`live-dot ${live.live ? '' : 'off'}`}>{live.live ? 'Live' : 'Auto-refresh 15 s'}</span>
        <span className="k-clock">{new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        <button className="icon-btn" aria-label={p.sound ? 'Mute new-order sound' : 'Turn on new-order sound'} onClick={() => { unlockAudio(); prefs.set({ ...p, sound: !p.sound }); }}>{p.sound ? <LuVolume2 /> : <LuVolumeX />}</button>
        <button className="icon-btn" aria-label="Refresh" onClick={() => location.reload()}><LuRefreshCw /></button>
        <button className="icon-btn" aria-label={fs ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFs}>{fs ? <LuMinimize /> : <LuMaximize />}</button>
      </div>
      {live.status !== 'ready' ? <div className="center-pad">{live.status === 'error' ? <p>{live.error}</p> : <span className="spinner" />}</div> : (
        <div className="k-board">
          {COLS.map(([k, label]) => {
            const list = by(k);
            return (
              <section key={k}>
                <div className="k-col-head"><i style={{ background: colors[k] }} />{label}<span className="n">{list.length}</span></div>
                <div className="k-list">
                  {list.length === 0 && <div className="k-empty">{k === 'new' ? 'No new orders' : 'Empty'}</div>}
                  {list.map((o) => {
                    const age = Math.floor((now - +new Date(o.created_at)) / 60000);
                    return (
                      <article key={o.id} className={`ticket ${live.fresh.includes(o.id) ? 'fresh' : ''}`} style={{ borderTop: `6px solid ${colors[k]}` }}>
                        <div className="t-head"><span className="t-no">{o.order_number.replace('CC-', '#')}</span><span className={`t-age ${age >= 20 ? 'late' : age >= 12 ? 'warn' : ''}`}>{age < 1 ? 'now' : `${age} min`}</span></div>
                        <div className="t-meta"><b style={{ color: 'var(--espresso)' }}>{o.customer_name.split(' ')[0]}</b> · {orderTypeLabel(o.order_type, o.table_label)} · {fmtTime(o.created_at)}{o.source === 'counter' && <span className="badge badge-ok" style={{ height: 22 }}>Counter · paid</span>}</div>
                        <div className="t-items">
                          {o.order_items.map((i: any) => (
                            <div key={i.id} className="t-item">{i.quantity} × {i.product_name}
                              {i.order_item_options.length > 0 && <div className="opts">{i.order_item_options.map((x: any) => x.option_name).join(' · ')}</div>}
                              {i.notes && <div className="inote">{i.notes}</div>}
                            </div>
                          ))}
                        </div>
                        {o.notes && <div className="t-note"><LuCircleAlert />{o.notes}</div>}
                        <div className="t-actions">
                          <Btn variant={k === 'ready' ? 'ok' : k === 'new' ? 'primary' : 'dark'} loading={busy[o.id]} onClick={() => moveOrder(o, NEXT[k]!.to)}>{actionLabel[k]}</Btn>
                          {k === 'new' && <Btn variant="ghost" aria-label="Reject order" disabled={busy[o.id]} onClick={() => moveOrder(o, 'cancelled')}><LuX /></Btn>}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
