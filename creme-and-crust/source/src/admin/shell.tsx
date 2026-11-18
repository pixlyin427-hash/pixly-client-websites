import { useEffect, useState, useRef } from 'react';
import { LuLayoutDashboard, LuClipboardList, LuCookingPot, LuPackage, LuLayoutList, LuReceipt, LuBoxes, LuTicket, LuChartColumn, LuSettings, LuCalculator, LuIndianRupee, LuMenu, LuBell, LuVolume2, LuVolumeX, LuLogOut, LuExternalLink, LuChevronRight, LuUser, LuLock, LuCircleAlert, LuFlaskConical, LuArrowRight } from 'react-icons/lu';
import { useRoute, useAuth, loadProfile, navigate, useStore, useSettings, inr, ago, toast, errMsg, useTitle } from '../lib/core';
import { auth, CONFIGURED } from '../lib/supa';
import { Link, Btn, Wordmark, Field, Img } from '../ui';
import { useLiveOrders, prefs, unlockAudio, openOrder } from './data';
import { OverviewPage, AnalyticsPage } from './insights';
import { BillingPage, SalesPage, BillsPage } from './billing';
import { OrdersPage, KitchenPage, OrderDrawerHost } from './orders';
import { ProductsPage, CategoriesPage, InventoryPage, OffersPage } from './manage';
import { SettingsPage } from './settings';
import { reconnectSerial } from '../lib/printer';

const NAV = [
  ['/admin', 'Overview', LuLayoutDashboard, 'all'], ['/admin/billing', 'Billing', LuCalculator, 'all'], ['/admin/orders', 'Orders', LuClipboardList, 'all'], ['/admin/kitchen', 'Kitchen', LuCookingPot, 'all'],
  ['/admin/sales', 'Sales', LuIndianRupee, 'all'], ['/admin/bills', 'Bills', LuReceipt, 'all'],
  ['/admin/products', 'Products', LuPackage, 'owner'], ['/admin/categories', 'Categories', LuLayoutList, 'owner'],
  ['/admin/inventory', 'Inventory', LuBoxes, 'all'], ['/admin/offers', 'Offers', LuTicket, 'owner'], ['/admin/analytics', 'Analytics', LuChartColumn, 'owner'], ['/admin/settings', 'Settings', LuSettings, 'all'],
] as const;
const PAGES: Record<string, [string, any, 'all' | 'owner']> = {
  '/admin': ['Overview', OverviewPage, 'all'], '/admin/orders': ['Orders', OrdersPage, 'all'], '/admin/products': ['Products', ProductsPage, 'owner'],
  '/admin/categories': ['Categories', CategoriesPage, 'owner'], '/admin/receipts': ['Bills & receipts', BillsPage, 'all'],
  '/admin/bills': ['Bills & receipts', BillsPage, 'all'], '/admin/sales': ['Daily sales', SalesPage, 'all'], '/admin/inventory': ['Inventory', InventoryPage, 'all'],
  '/admin/offers': ['Offers & coupons', OffersPage, 'owner'], '/admin/analytics': ['Analytics', AnalyticsPage, 'owner'], '/admin/settings': ['Settings', SettingsPage, 'all'],
};

export function AdminRoot() {
  const { path } = useRoute(); const a = useAuth();
  useEffect(() => { if (a.status === 'loading') loadProfile(); }, [a.status]);
  useEffect(() => { if (a.status === 'in') reconnectSerial(); }, [a.status]);
  const clean = path.replace(/\/+$/, '') || '/admin';
  if (a.status === 'loading') return <div className="center-pad" style={{ minHeight: '100dvh' }}><span className="spinner" /></div>;
  if (a.status === 'out') { if (clean !== '/admin/login') { setTimeout(() => navigate(`/admin/login?next=${encodeURIComponent(clean)}`, { replace: true }), 0); return null; } return <Login />; }
  if (a.status === 'noaccess') return <NoAccess />;
  if (clean === '/admin/login') {
    const next = new URLSearchParams(location.search).get('next');
    setTimeout(() => navigate(next && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin', { replace: true }), 0); return null;
  }
  if (clean === '/admin/kitchen') return <><KitchenPage /><OrderDrawerHost /></>;
  if (clean === '/admin/billing') return <><BillingPage /><OrderDrawerHost /></>;
  const page = PAGES[clean];
  if (!page) return <AdminLayout title="Not found"><div className="card card-pad"><h2 className="serif" style={{ fontSize: 28 }}>This admin page doesn’t exist.</h2><p className="muted" style={{ margin: '8px 0 16px' }}>Check the address, or head back to the overview.</p><Link to="/admin" className="btn btn-dark">Go to overview</Link></div></AdminLayout>;
  const [title, Comp, role] = page;
  if (role === 'owner' && a.profile?.role !== 'owner') return <AdminLayout title={title}><div className="card card-pad stack"><LuLock style={{ width: 28, height: 28, color: 'var(--caramel-ink)' }} /><h2 style={{ fontSize: 20 }}>Owner access only</h2><p className="muted">Ask the owner if you need to change this. Staff can manage orders, the kitchen, receipts and inventory.</p></div></AdminLayout>;
  return <AdminLayout title={title}><Comp /></AdminLayout>;
}

function Login() {
  useTitle('Admin sign in'); const s = useSettings().data;
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e: any) => {
    e.preventDefault(); if (!email || !pw) { setErr('Enter your email and password.'); return; }
    setBusy(true); setErr('');
    try { await auth.signIn(email, pw); await loadProfile(); }
    catch (er) { setErr(errMsg(er)); } finally { setBusy(false); }
  };
  return (
    <div className="login-wrap">
      <div className="login-art"><Img src="https://images.pexels.com/photos/8986282/pexels-photo-8986282.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="Waffles" eager />
        <div className="copy"><Wordmark settings={s} light /><h2 style={{ marginTop: 22 }}>Your shop,<br />in your pocket.</h2><p style={{ marginTop: 12, color: '#d7c6b8' }}>Orders, kitchen, receipts and sales — all in one place.</p></div></div>
      <div className="login-form">
        <form onSubmit={submit} noValidate>
          <Link to="/"><Wordmark settings={s} /></Link>
          <div><h1 className="serif" style={{ fontSize: 34, marginTop: 18 }}>Staff sign in</h1><p className="muted" style={{ marginTop: 6 }}>Use the account the shop owner set up for you.</p></div>
          {!CONFIGURED && <div className="notice notice-red"><LuCircleAlert /><span>This app isn’t connected to its database yet.</span></div>}
          <Field label="Email" htmlFor="l-email"><input id="l-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password" htmlFor="l-pw"><input id="l-pw" className="input" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          {err && <div className="notice notice-red" role="alert"><LuCircleAlert /><span>{err}</span></div>}
          <Btn variant="dark" size="lg" type="submit" block loading={busy}>Sign in</Btn>
          <p className="tiny muted">Forgot your password? Ask the owner to reset it from Settings → Team, or reset it in the Supabase dashboard.</p>
          <Link to="/" className="link small">← Back to the website</Link>
        </form>
      </div>
    </div>
  );
}

function NoAccess() {
  const a = useAuth();
  return <div className="center-pad" style={{ minHeight: '100dvh' }}><div className="card card-pad stack" style={{ maxWidth: 420, textAlign: 'center', alignItems: 'center' }}><LuLock style={{ width: 32, height: 32, color: 'var(--caramel-ink)' }} /><h1 style={{ fontSize: 22 }}>{a.profile && !a.profile.is_active ? 'Your account is deactivated' : 'No staff access'}</h1><p className="muted">This login isn’t linked to an active staff account. Ask the owner to add you in Settings → Team.</p><Btn variant="dark" onClick={() => auth.signOut()}>Sign out</Btn></div></div>;
}

function AdminLayout({ title, children }: { title: string; children: any }) {
  const { path } = useRoute(); const a = useAuth(); const s = useSettings().data; const live = useLiveOrders(); const p = useStore(prefs);
  const [open, setOpen] = useState(false); const [q, setQ] = useState('');
  useEffect(() => setOpen(false), [path]);
  const role = a.profile?.role; const pending = live.list.filter((o) => o.status === 'new').length;
  useEffect(() => { document.title = `${pending ? `(${pending}) ` : ''}${title} · ${s?.shop_name || 'Crème & Crust'} Admin`; }, [pending, title, s?.shop_name]);
  return (
    <div className="admin" onClick={unlockAudio}>
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <Link to="/admin"><Wordmark settings={s} light /></Link>
        <span className="side-label">Manage</span>
        {NAV.filter(([, , , r]) => r === 'all' || role === 'owner').map(([to, label, Icon]) => {
          const active = to === '/admin' ? path === '/admin' || path === '/admin/' : path.startsWith(to);
          return <Link key={to} to={to} className={`side-link ${active ? 'active' : ''}`}><Icon />{label}{to === '/admin/orders' && pending > 0 && <span className="count">{pending}</span>}</Link>;
        })}
        <div className="side-foot">
          {s?.demo_mode && <span className="demo-flag" style={{ alignSelf: 'flex-start' }}><LuFlaskConical style={{ width: 12 }} /> Demo mode</span>}
          <span><b style={{ color: '#fff' }}>{a.profile?.full_name}</b><br /><span style={{ textTransform: 'capitalize' }}>{role}</span></span>
          <a href="/" target="_blank" rel="noreferrer" className="row" style={{ gap: 6 }}><LuExternalLink style={{ width: 14 }} /> View website</a>
        </div>
      </aside>
      {open && <div className="overlay" style={{ zIndex: 80, background: 'rgba(36,23,17,.4)' }} onClick={() => setOpen(false)} />}
      <div style={{ minWidth: 0 }}>
        <header className="topbar">
          <button className="icon-btn admin-burger" aria-label="Open menu" onClick={() => setOpen(true)}><LuMenu /></button>
          <div style={{ minWidth: 0 }}><div className="crumbs">Admin <LuChevronRight /> {title}</div><h1>{title}</h1></div>
          <form className="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) navigate(`/admin/orders?q=${encodeURIComponent(q.trim())}`); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input className="input" type="search" placeholder="Search orders…" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="row" style={{ gap: 4, marginLeft: 'auto' }}>
            <span className={`live-dot hide-sm ${live.live ? '' : 'off'}`} title={live.live ? 'Realtime connected' : 'Refreshing every 15 seconds'}>{live.live ? 'Live' : 'Auto'}</span>
            <button className="icon-btn" aria-label={p.sound ? 'Mute new-order sound' : 'Turn on new-order sound'} title={p.sound ? 'Sound on for new orders' : 'Sound off'} onClick={() => { unlockAudio(); prefs.set({ ...p, sound: !p.sound }); toast.info(p.sound ? 'New-order sound off' : 'New-order sound on'); }}>{p.sound ? <LuVolume2 /> : <LuVolumeX />}</button>
            <Notifications list={live.list.filter((o) => o.status === 'new')} />
            <AccountMenu />
          </div>
        </header>
        <main className="admin-main">{children}</main>
      </div>
      <OrderDrawerHost />
    </div>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [open]);
  return { open, setOpen, ref };
}
function Notifications({ list }: { list: any[] }) {
  const { open, setOpen, ref } = usePopover();
  return (
    <div className="rel" ref={ref}>
      <button className="icon-btn" aria-label={`${list.length} new orders`} aria-expanded={open} onClick={() => setOpen(!open)}><LuBell />{list.length > 0 && <span className="cart-count">{list.length}</span>}</button>
      {open && <div className="notif-pop">
        <div className="card-head" style={{ paddingBottom: 10 }}><h3>New orders</h3><Link to="/admin/orders" className="link small" onClick={() => setOpen(false)}>Board <LuArrowRight /></Link></div>
        {list.length === 0 ? <p className="small muted" style={{ padding: '0 20px 18px' }}>You’re all caught up.</p> : list.slice(0, 6).map((o) => (
          <button key={o.id} className="order-strip" onClick={() => { setOpen(false); openOrder(o.id); }}><div className="grow"><b>{o.order_number}</b><div className="tiny muted">{o.customer_name} · {ago(o.created_at)}</div></div><b className="num small">{inr(o.total_paise)}</b></button>
        ))}
      </div>}
    </div>
  );
}
function AccountMenu() {
  const a = useAuth(); const { open, setOpen, ref } = usePopover();
  return (
    <div className="rel" ref={ref}>
      <button className="icon-btn" aria-label="Account menu" aria-expanded={open} onClick={() => setOpen(!open)}><span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>{(a.profile?.full_name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span></button>
      {open && <div className="menu-pop">
        <div style={{ padding: '8px 12px 10px' }}><b className="small">{a.profile?.full_name}</b><div className="tiny muted">{a.profile?.email}</div></div>
        <Link to="/admin/settings?tab=account" onClick={() => setOpen(false)}><LuUser /> My account</Link>
        <a href="/" target="_blank" rel="noreferrer"><LuExternalLink /> View website</a>
        <button onClick={async () => { setOpen(false); await auth.signOut(); navigate('/admin/login'); toast.info('Signed out'); }}><LuLogOut /> Sign out</button>
      </div>}
    </div>
  );
}
