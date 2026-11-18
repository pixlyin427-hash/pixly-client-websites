import { useEffect, useMemo, useState } from 'react';
import { LuIndianRupee, LuShoppingBag, LuHourglass, LuCircleCheckBig, LuCalculator, LuCircleAlert, LuPlus, LuPrinter, LuLayoutList, LuClipboardList, LuArrowRight, LuDownload, LuInfo, LuReceipt, LuSearch, LuPackage, LuCircleX, LuPercent } from 'react-icons/lu';
import { useSettings, inr, fmtTime, fmtDateTime, fmtDay, dayKey, startOfDay, addDays, paymentLabel, useTitle, errMsg, ago, orderTypeLabel, useAuth } from '../lib/core';
import { db } from '../lib/supa';
import { Btn, Empty, Skel, Seg, StatusPill, Link, SearchInput, useDebounced } from '../ui';
import { BarChart, LineChart, Donut, HBars } from '../charts';
import { useLiveOrders, openOrder, ORDER_SELECT, ITEM_ORDER } from './data';
import { buildReceipt, ReceiptView, printOrderReceipt, printerState } from '../lib/printer';
import { useStore } from '../lib/core';

const compactInr = (p: number) => { const r = p / 100; return r >= 100000 ? `₹${(r / 100000).toFixed(1)}L` : r >= 1000 ? `₹${(r / 1000).toFixed(r >= 10000 ? 0 : 1)}k` : `₹${Math.round(r)}`; };
const valid = (o: any) => o.status !== 'cancelled';

async function fetchRange(from: Date, to: Date) {
  return db.selectAll('orders', `select=id,order_number,created_at,status,total_paise,subtotal_paise,discount_paise,payment_method,payment_status,is_demo,customer_name,order_items(product_id,product_name,category_name,quantity,line_total_paise)&created_at=gte.${encodeURIComponent(from.toISOString())}&created_at=lt.${encodeURIComponent(to.toISOString())}&order=created_at.asc`);
}
function aggregate(orders: any[], from: Date, days: number) {
  const ok = orders.filter(valid);
  const revenue = ok.reduce((s, o) => s + o.total_paise, 0);
  const byDay = Array.from({ length: days }, (_, i) => { const d = addDays(from, i); return { key: dayKey(d), label: days > 14 ? String(d.getDate()) : fmtDay(d), sub: fmtDay(d), value: 0, count: 0 }; });
  const idx = new Map(byDay.map((d, i) => [d.key, i]));
  ok.forEach((o) => { const i = idx.get(dayKey(o.created_at)); if (i != null) { byDay[i].value += o.total_paise; byDay[i].count += 1; } });
  const prod = new Map<string, { label: string; qty: number; revenue: number }>();
  const cat = new Map<string, number>();
  ok.forEach((o) => o.order_items.forEach((i: any) => {
    const k = i.product_name; const p = prod.get(k) || { label: k, qty: 0, revenue: 0 }; p.qty += i.quantity; p.revenue += i.line_total_paise; prod.set(k, p);
    cat.set(i.category_name || 'Other', (cat.get(i.category_name || 'Other') || 0) + i.line_total_paise);
  }));
  const pay = new Map<string, number>(); ok.forEach((o) => pay.set(o.payment_method, (pay.get(o.payment_method) || 0) + 1));
  const hours = Array.from({ length: 14 }, (_, i) => ({ label: `${(i + 10) % 12 || 12}${i + 10 < 12 ? 'a' : 'p'}`, sub: `${i + 10}:00`, value: 0 }));
  ok.forEach((o) => { const h = new Date(o.created_at).getHours() - 10; if (h >= 0 && h < 14) hours[h].value += 1; });
  return {
    revenue, orders: ok.length, aov: ok.length ? Math.round(revenue / ok.length) : 0, cancelled: orders.length - ok.length,
    discounts: ok.reduce((s, o) => s + o.discount_paise, 0), byDay, hours,
    products: [...prod.values()].sort((a, b) => b.qty - a.qty), categories: [...cat.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    payments: [...pay.entries()].map(([k, v]) => ({ key: k, value: v })), demo: orders.filter((o) => o.is_demo).length,
  };
}

function Kpi({ icon, label, value, sub }: any) { return <div className="card kpi"><span className="k-label">{icon}{label}</span><span className="k-value">{value}</span>{sub && <span className="k-sub">{sub}</span>}</div>; }
function DemoNote({ n }: { n: number }) {
  const owner = useAuth().profile?.role === 'owner';
  if (!n) return null;
  return <div className="demo-banner"><LuInfo /><span><b>Demo data</b> — {n} of these orders are sample records created for the demonstration.</span>{owner && <Link className="link" to="/admin/settings?tab=demo">Manage demo data <LuArrowRight /></Link>}</div>;
}

// ════════ OVERVIEW ════════
export function OverviewPage() {
  useTitle('Overview');
  const live = useLiveOrders(); const s = useSettings().data;
  const [hist, setHist] = useState<any[] | null>(null); const [low, setLow] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const from = useMemo(() => addDays(startOfDay(), -29), []);
  useEffect(() => {
    fetchRange(from, addDays(startOfDay(), 1)).then(setHist).catch((e) => setErr(errMsg(e)));
    db.select('inventory_items', 'select=*&order=name.asc').then((r) => setLow(r.filter((i: any) => Number(i.quantity) <= Number(i.low_threshold)))).catch(() => setLow([]));
  }, [live.updated > 0 ? Math.floor(live.updated / 60000) : 0]); // refresh about once a minute while orders change
  const today = live.list.filter((o) => +new Date(o.created_at) >= +startOfDay());
  const tOk = today.filter((o) => valid(o) && (o.payment_status === 'paid' || o.status === 'completed'));
  const sales = tOk.reduce((sum, o) => sum + o.total_paise, 0);
  const pending = live.list.filter((o) => ['new', 'accepted', 'preparing', 'ready'].includes(o.status)).length;
  const agg = hist ? aggregate(hist, from, 30) : null;
  const last14 = agg ? agg.byDay.slice(-14) : [];
  const statusDist = ['new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'].map((k) => ({ label: k[0].toUpperCase() + k.slice(1), value: today.filter((o) => o.status === k).length, color: ({ new: '#d9a030', accepted: '#5b88c7', preparing: '#d9783a', ready: '#3f9a63', completed: '#9a918a', cancelled: '#c45a50' } as any)[k] })).filter((d) => d.value);
  return (
    <div>
      {agg && <DemoNote n={agg.demo} />}
      <div className="kpis">
        <Kpi icon={<LuIndianRupee />} label="Today’s sales" value={live.status === 'ready' ? inr(sales) : '—'} sub="paid or completed" />
        <Kpi icon={<LuShoppingBag />} label="Today’s orders" value={live.status === 'ready' ? today.filter(valid).length : '—'} sub={`${today.filter((o) => !valid(o)).length} cancelled`} />
        <Kpi icon={<LuHourglass />} label="Pending orders" value={live.status === 'ready' ? pending : '—'} sub="new → ready" />
        <Kpi icon={<LuCircleCheckBig />} label="Completed today" value={live.status === 'ready' ? today.filter((o) => o.status === 'completed').length : '—'} />
        <Kpi icon={<LuCalculator />} label="Avg bill value" value={live.status === 'ready' ? inr(tOk.length ? Math.round(sales / tOk.length) : 0) : '—'} sub="today" />
      </div>
      <div className="dash-grid">
        <div className="card span-8"><div className="card-head"><h3>Daily sales · last 14 days</h3><Link to="/admin/analytics" className="link">Analytics <LuArrowRight /></Link></div><div style={{ padding: '6px 16px 14px' }}>{err ? <p className="small muted">{err}</p> : agg ? <BarChart data={last14} format={compactInr} /> : <Skel h={220} />}</div></div>
        <div className="card span-4"><div className="card-head"><h3>Today by status</h3></div><div style={{ padding: '10px 20px 20px' }}>{live.status !== 'ready' ? <Skel h={160} /> : statusDist.length ? <Donut data={statusDist} size={140} /> : <p className="small muted">No orders yet today.</p>}</div></div>
        <div className="card span-7"><div className="card-head"><h3>Orders over time · last 14 days</h3></div><div style={{ padding: '6px 16px 14px' }}>{agg ? <LineChart data={last14.map((d) => ({ label: d.label, sub: d.sub, value: d.count }))} /> : <Skel h={220} />}</div></div>
        <div className="card span-5"><div className="card-head"><h3>Popular products · 30 days</h3></div><div style={{ padding: '12px 20px 20px' }}>{agg ? (agg.products.length ? <HBars data={agg.products.slice(0, 6).map((p) => ({ label: p.label, value: p.qty, sub: inr(p.revenue) }))} format={(n) => `${n} sold`} /> : <p className="small muted">No sales yet.</p>) : <Skel h={200} />}</div></div>
        <div className="card span-8">
          <div className="card-head"><h3>Recent orders</h3><Link to="/admin/orders" className="link">Open orders <LuArrowRight /></Link></div>
          <div className="table-wrap">{live.status !== 'ready' ? <div style={{ padding: 16 }}><Skel h={200} /></div> : live.list.length === 0 ? <Empty icon={<LuClipboardList />} title="No orders yet" text="New orders will appear here." /> : (
            <table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Items</th><th className="right">Amount</th><th>Status</th><th className="hide-sm">Time</th><th /></tr></thead><tbody>
              {live.list.slice(0, 8).map((o) => <tr key={o.id} className="clickable" onClick={() => openOrder(o.id)}><td><b>{o.order_number}</b></td><td>{o.customer_name}</td><td className="hide-sm small">{o.order_items.reduce((n: number, i: any) => n + i.quantity, 0)} items</td><td className="right num">{inr(o.total_paise)}</td><td><StatusPill s={o.status} /></td><td className="hide-sm small muted">{ago(o.created_at)}</td><td><LuArrowRight style={{ width: 16, color: 'var(--ink-3)' }} /></td></tr>)}
            </tbody></table>)}</div>
        </div>
        <div className="span-4 stack" style={{ gap: 18 }}>
          <div className="card"><div className="card-head"><h3>Quick actions</h3></div><div style={{ padding: '10px 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link to="/admin/orders" className="btn btn-dark btn-sm"><LuClipboardList /> Orders</Link>
            <Link to="/admin/products" className="btn btn-soft btn-sm"><LuPlus /> Add product</Link>
            <Link to="/admin/billing" className="btn btn-primary btn-sm"><LuCalculator /> New bill</Link>
            <Link to="/admin/bills" className="btn btn-soft btn-sm"><LuPrinter /> Print receipt</Link>
            <Link to="/admin/categories" className="btn btn-soft btn-sm"><LuLayoutList /> Manage menu</Link>
          </div></div>
          <div className="card"><div className="card-head"><h3>Low stock</h3><Link to="/admin/inventory" className="link">Inventory</Link></div><div style={{ padding: '6px 20px 18px' }}>
            {!low ? <Skel h={80} /> : low.length === 0 ? <p className="small muted">Everything is above its low-stock level.</p> : low.map((i) => <div key={i.id} className="sum-row small"><span><LuCircleAlert style={{ width: 14, color: 'var(--red)', verticalAlign: '-2px' }} /> {i.name}</span><b className="num">{Number(i.quantity)} {i.unit}</b></div>)}
          </div></div>
          <div className="card"><div className="card-head"><h3>Bestsellers · 30 days</h3></div><div style={{ padding: '6px 20px 18px' }}>
            {agg ? agg.products.slice(0, 5).map((p, i) => <div key={p.label} className="sum-row small"><span><b>{i + 1}.</b> {p.label}</span><span className="num">{p.qty} sold</span></div>) : <Skel h={100} />}
          </div></div>
        </div>
      </div>
    </div>
  );
}

// ════════ ANALYTICS ════════
export function AnalyticsPage() {
  useTitle('Analytics');
  const s = useSettings().data;
  const [preset, setPreset] = useState('7');
  const [cFrom, setCFrom] = useState(dayKey(addDays(new Date(), -13))); const [cTo, setCTo] = useState(dayKey(new Date()));
  const { from, to, days } = useMemo(() => {
    if (preset === 'custom') { const f = startOfDay(new Date(cFrom + 'T00:00')); const t = addDays(startOfDay(new Date(cTo + 'T00:00')), 1); const d = Math.max(1, Math.round((+t - +f) / 86400000)); return { from: f, to: t, days: Math.min(d, 366) }; }
    const n = Number(preset); return { from: addDays(startOfDay(), -(n - 1)), to: addDays(startOfDay(), 1), days: n };
  }, [preset, cFrom, cTo]);
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState('');
  useEffect(() => { let alive = true; setRows(null); setErr(''); if (+to <= +from) { setErr('The end date must be after the start date.'); return; } fetchRange(from, to).then((r) => alive && setRows(r)).catch((e) => alive && setErr(errMsg(e))); return () => { alive = false; }; }, [from, to]);
  const a = rows ? aggregate(rows, from, days) : null;
  const csv = () => {
    if (!rows) return;
    const head = 'order_number,created_at,status,customer,payment_method,payment_status,subtotal,discount,total,demo';
    const lines = rows.map((o) => [o.order_number, o.created_at, o.status, `"${String(o.customer_name).replace(/"/g, '""')}"`, o.payment_method, o.payment_status, o.subtotal_paise / 100, o.discount_paise / 100, o.total_paise / 100, o.is_demo].join(','));
    const url = URL.createObjectURL(new Blob([[head, ...lines].join('\n')], { type: 'text/csv' }));
    const el = document.createElement('a'); el.href = url; el.download = `orders-${dayKey(from)}-to-${dayKey(addDays(to, -1))}.csv`; el.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return (
    <div>
      <div className="toolbar">
        <Seg label="Date range" value={preset} onChange={setPreset} options={[{ value: '1', label: 'Today' }, { value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: 'custom', label: 'Custom' }]} />
        {preset === 'custom' && <><input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={cFrom} max={cTo} onChange={(e) => setCFrom(e.target.value)} aria-label="From" /><span className="muted">to</span><input type="date" className="input" style={{ width: 'auto', minHeight: 42 }} value={cTo} min={cFrom} onChange={(e) => setCTo(e.target.value)} aria-label="To" /></>}
        <Btn variant="soft" size="sm" style={{ marginLeft: 'auto' }} onClick={csv} disabled={!rows?.length}><LuDownload /> Export CSV</Btn>
      </div>
      {a && <DemoNote n={a.demo} />}
      {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load analytics" text={err} /> : <>
        <div className="kpis">
          <Kpi icon={<LuIndianRupee />} label="Revenue" value={a ? inr(a.revenue) : '—'} sub="excl. cancelled, incl. tax" />
          <Kpi icon={<LuShoppingBag />} label="Orders" value={a ? a.orders : '—'} />
          <Kpi icon={<LuCalculator />} label="Avg order value" value={a ? inr(a.aov) : '—'} />
          <Kpi icon={<LuCircleX />} label="Cancelled" value={a ? a.cancelled : '—'} sub={a && a.orders + a.cancelled ? `${Math.round((a.cancelled / (a.orders + a.cancelled)) * 100)}% of all orders` : ''} />
          <Kpi icon={<LuPercent />} label="Discounts given" value={a ? inr(a.discounts) : '—'} />
        </div>
        {a && a.orders === 0 && a.cancelled === 0 ? <div className="card" style={{ marginTop: 18 }}><Empty icon={<LuClipboardList />} title="No orders in this period" text="Pick a different date range." /></div> : (
          <div className="dash-grid">
            <div className="card span-8"><div className="card-head"><h3>Sales by day</h3></div><div style={{ padding: '6px 16px 14px' }}>{a ? <BarChart data={a.byDay} format={compactInr} labelEvery={days > 20 ? 3 : 1} /> : <Skel h={220} />}</div></div>
            <div className="card span-4"><div className="card-head"><h3>Payment methods</h3></div><div style={{ padding: '10px 20px 20px' }}>{a ? <Donut data={a.payments.map((p) => ({ label: paymentLabel(s, p.key), value: p.value }))} size={140} /> : <Skel h={160} />}</div></div>
            <div className="card span-5"><div className="card-head"><h3>Sales by category</h3></div><div style={{ padding: '12px 20px 20px' }}>{a ? <HBars data={a.categories} format={inr} /> : <Skel h={200} />}</div></div>
            <div className="card span-7"><div className="card-head"><h3>Orders by hour</h3></div><div style={{ padding: '6px 16px 14px' }}>{a ? <BarChart data={a.hours} /> : <Skel h={220} />}</div></div>
            <div className="card span-12"><div className="card-head"><h3>Bestselling products</h3></div><div className="table-wrap">{a ? (
              <table className="tbl"><thead><tr><th>#</th><th>Product</th><th className="right">Sold</th><th className="right">Revenue</th><th className="right hide-sm">Share</th></tr></thead><tbody>
                {a.products.slice(0, 15).map((p, i) => <tr key={p.label}><td className="muted">{i + 1}</td><td><b>{p.label}</b></td><td className="right num">{p.qty}</td><td className="right num">{inr(p.revenue)}</td><td className="right hide-sm num muted">{a.revenue ? Math.round((p.revenue / a.products.reduce((x, y) => x + y.revenue, 0)) * 100) : 0}%</td></tr>)}
              </tbody></table>) : <div style={{ padding: 16 }}><Skel h={200} /></div>}</div></div>
          </div>
        )}
      </>}
    </div>
  );
}

export { fmtTime, orderTypeLabel, LuPackage };
