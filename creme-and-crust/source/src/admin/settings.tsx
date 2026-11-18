import { useEffect, useState } from 'react';
import { LuStore, LuClock, LuShoppingBag, LuWallet, LuReceipt, LuPrinter, LuPalette, LuUsers, LuFlaskConical, LuUser, LuPlus, LuTrash2, LuUpload, LuCircleAlert, LuInfo, LuPlug, LuCircleCheck } from 'react-icons/lu';
import { useSettings, settingsStore, loadSettings, applyAccent, toast, errMsg, ask, useQuery, setQuery, useTitle, useAuth, toPaise, rupees, useStore, loadMenu } from '../lib/core';
import { db, auth, uploadImage } from '../lib/supa';
import { Btn, Field, Toggle, Seg, Skel, Empty } from '../ui';
import { ReceiptView, testReceipt, sendToPrinter, printerState, disconnectSerial, devicePrinter, effectiveConnection, ENV, bluetoothAdvice } from '../lib/printer';
import { PrinterChip } from './billing';
import { refreshOrders } from './data';

const TABS = [['shop', 'Shop profile', LuStore], ['hours', 'Hours', LuClock], ['ordering', 'Ordering', LuShoppingBag], ['payments', 'Payments', LuWallet], ['receipt', 'Receipt & tax', LuReceipt], ['printer', 'Printer', LuPrinter], ['appearance', 'Appearance', LuPalette], ['team', 'Team', LuUsers], ['demo', 'Demo data', LuFlaskConical], ['account', 'My account', LuUser]] as const;

async function saveSettings(patch: any, msg = 'Settings saved') {
  try { await db.update('shop_settings', 'id=eq.1', patch); await loadSettings(); toast.success(msg); return true; }
  catch (e) { toast.error(errMsg(e)); return false; }
}
function useDraft() { const s = useSettings().data; const [d, setD] = useState<any>(s); useEffect(() => setD(s), [s]); return [d, (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }))] as const; }
function SaveBar({ onSave, busy }: { onSave: () => void; busy?: boolean }) { return <div className="row" style={{ justifyContent: 'flex-end' }}><Btn variant="primary" loading={busy} onClick={onSave}>Save changes</Btn></div>; }

export function SettingsPage() {
  useTitle('Settings');
  const q = useQuery(); const owner = useAuth().profile?.role === 'owner';
  const tabs = owner ? TABS : TABS.filter(([k]) => k === 'account' || k === 'printer');
  const tab = tabs.some(([k]) => k === q.get('tab')) ? q.get('tab')! : tabs[0][0];
  const s = useSettings();
  if (s.status !== 'ready' || !s.data) return <Skel h={400} r={16} />;
  return (
    <div className="settings">
      <nav className="set-nav" aria-label="Settings sections">{tabs.map(([k, l, Icon]) => <button key={k} aria-pressed={tab === k} onClick={() => setQuery({ tab: k })}><Icon />{l}</button>)}</nav>
      <div className="card panel">
        {tab === 'shop' && <ShopPanel />}{tab === 'hours' && <HoursPanel />}{tab === 'ordering' && <OrderingPanel />}{tab === 'payments' && <PaymentsPanel />}
        {tab === 'receipt' && <ReceiptPanel />}{tab === 'printer' && <PrinterPanel owner={owner} />}{tab === 'appearance' && <AppearancePanel />}
        {tab === 'team' && <TeamPanel />}{tab === 'demo' && <DemoPanel />}{tab === 'account' && <AccountPanel />}
      </div>
    </div>
  );
}

function ShopPanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false);
  const save = async () => { if (!d.shop_name?.trim()) { toast.error('Shop name is required.'); return; } setBusy(true); await saveSettings({ shop_name: d.shop_name.trim(), tagline: d.tagline, description: d.description, phone: d.phone, whatsapp: String(d.whatsapp || '').replace(/\D/g, ''), email: d.email, address: d.address, maps_url: d.maps_url, instagram_url: d.instagram_url }); setBusy(false); };
  return (<>
    <h2>Shop profile</h2>
    <div className="form-grid">
      <Field label="Shop name" htmlFor="s-name"><input id="s-name" className="input" maxLength={60} value={d.shop_name || ''} onChange={(e) => set('shop_name', e.target.value)} /></Field>
      <Field label="Tagline" htmlFor="s-tag"><input id="s-tag" className="input" maxLength={80} value={d.tagline || ''} onChange={(e) => set('tagline', e.target.value)} /></Field>
      <Field label="About the shop" htmlFor="s-desc" className="full"><textarea id="s-desc" className="textarea" maxLength={600} value={d.description || ''} onChange={(e) => set('description', e.target.value)} /></Field>
      <Field label="Phone" htmlFor="s-phone"><input id="s-phone" className="input" value={d.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field>
      <Field label="WhatsApp number" htmlFor="s-wa" hint="With country code, e.g. 919876543210"><input id="s-wa" className="input" inputMode="tel" value={d.whatsapp || ''} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
      <Field label="Email" htmlFor="s-email"><input id="s-email" className="input" type="email" value={d.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
      <Field label="Instagram link" htmlFor="s-ig"><input id="s-ig" className="input" value={d.instagram_url || ''} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/yourshop" /></Field>
      <Field label="Address" htmlFor="s-addr" className="full"><input id="s-addr" className="input" value={d.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Google Maps link" htmlFor="s-map" className="full"><input id="s-map" className="input" value={d.maps_url || ''} onChange={(e) => set('maps_url', e.target.value)} /></Field>
    </div>
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function HoursPanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false);
  const hours = d.hours?.length ? d.hours : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, open: '11:00', close: '23:00', closed: false }));
  const upd = (i: number, k: string, v: any) => set('hours', hours.map((h: any, j: number) => (j === i ? { ...h, [k]: v } : h)));
  const save = async () => { if (hours.some((h: any) => !h.closed && (!h.open || !h.close))) { toast.error('Set opening and closing times, or mark the day closed.'); return; } setBusy(true); await saveSettings({ hours }); setBusy(false); };
  return (<>
    <h2>Business hours</h2>
    <p className="small muted">Shown on the website footer, contact page and homepage.</p>
    <div className="hours-grid">
      {hours.map((h: any, i: number) => (<div key={h.day} style={{ display: 'contents' }}>
        <b>{h.day}</b>
        <input type="time" className="input" value={h.open} disabled={h.closed} onChange={(e) => upd(i, 'open', e.target.value)} aria-label={`${h.day} opens`} />
        <input type="time" className="input" value={h.close} disabled={h.closed} onChange={(e) => upd(i, 'close', e.target.value)} aria-label={`${h.day} closes`} />
        <label className="row closed-t small" style={{ gap: 8 }}><Toggle label={`${h.day} closed`} checked={!!h.closed} onChange={(v) => upd(i, 'closed', v)} />Closed</label>
      </div>))}
    </div>
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function OrderingPanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false);
  const save = async () => { const p = parseInt(d.prep_minutes); if (!(p >= 0 && p <= 240)) { toast.error('Preparation time must be 0–240 minutes.'); return; } setBusy(true); await saveSettings({ ordering_enabled: d.ordering_enabled, prep_minutes: p, takeaway_enabled: d.takeaway_enabled, dine_in_enabled: d.dine_in_enabled }); setBusy(false); };
  return (<>
    <h2>Ordering</h2>
    <div>
      <div className="toggle-row"><div><b>Accepting online orders</b><div className="small muted">Turn off to pause the website checkout (e.g. when closing early).</div></div><Toggle label="Accepting online orders" checked={!!d.ordering_enabled} onChange={(v) => set('ordering_enabled', v)} /></div>
      <div className="toggle-row"><div><b>Takeaway / pickup</b></div><Toggle label="Takeaway" checked={!!d.takeaway_enabled} onChange={(v) => set('takeaway_enabled', v)} /></div>
      <div className="toggle-row"><div><b>Dine-in</b><div className="small muted">Customers can add a table number.</div></div><Toggle label="Dine-in" checked={!!d.dine_in_enabled} onChange={(v) => set('dine_in_enabled', v)} /></div>
      <div className="toggle-row"><div><b>Delivery</b><div className="small muted">Not available in this version — orders are takeaway or dine-in only.</div></div><Toggle label="Delivery" checked={false} disabled onChange={() => {}} /></div>
    </div>
    <Field label="Estimated preparation time (minutes)" htmlFor="o-prep" hint="Shown to customers at checkout and on tracking."><input id="o-prep" className="input" style={{ maxWidth: 160 }} inputMode="numeric" value={d.prep_minutes ?? ''} onChange={(e) => set('prep_minutes', e.target.value.replace(/\D/g, ''))} /></Field>
    {!d.takeaway_enabled && !d.dine_in_enabled && <div className="notice notice-red"><LuCircleAlert /><span>With both order types off, customers can’t check out.</span></div>}
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function PaymentsPanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false);
  const methods: any[] = d.payment_methods || [];
  const upd = (i: number, k: string, v: any) => set('payment_methods', methods.map((m, j) => (j === i ? { ...m, [k]: v } : m)));
  const add = async () => {
    const r = await ask({ title: 'Add a payment method', message: 'For example “Sodexo”, “Paytm wallet” or “Card”. Payment is still taken at the counter.', input: { label: 'Name', required: true }, actions: [{ label: 'Add', value: 'ok' }] });
    if (r.value !== 'ok') return; const key = r.text.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20) || 'other';
    if (methods.some((m) => m.key === key)) { toast.error('That method already exists.'); return; }
    set('payment_methods', [...methods, { key, label: r.text.slice(0, 30), hint: 'Pay at the counter', enabled: true }]);
  };
  const save = async () => { if (!methods.some((m) => m.enabled)) { toast.error('Keep at least one payment method enabled.'); return; } if (methods.some((m) => !m.label?.trim())) { toast.error('Every method needs a name.'); return; } setBusy(true); await saveSettings({ payment_methods: methods, upi_id: String(d.upi_id || '').trim(), upi_name: d.upi_name }); setBusy(false); };
  return (<>
    <h2>Payments</h2>
    <div className="notice notice-info"><LuInfo /><span>This app does <b>not</b> process online payments. Customers choose how they’ll pay; staff confirm payment in the order screen. Connecting a payment gateway (e.g. Razorpay) needs a merchant account and is a separate integration.</span></div>
    {methods.map((m, i) => (
      <div key={m.key} className="row row-wrap" style={{ alignItems: 'flex-end', paddingBottom: 12, borderBottom: '1px solid var(--neutral-2)' }}>
        <Field label="Name" className="grow"><input className="input" value={m.label} maxLength={30} onChange={(e) => upd(i, 'label', e.target.value)} /></Field>
        <Field label="Hint for customers" className="grow"><input className="input" value={m.hint || ''} maxLength={80} onChange={(e) => upd(i, 'hint', e.target.value)} /></Field>
        <label className="row small" style={{ gap: 8, minHeight: 46 }}><Toggle label={`${m.label} enabled`} checked={!!m.enabled} onChange={(v) => upd(i, 'enabled', v)} />Enabled</label>
        {!['cash', 'upi'].includes(m.key) && <button className="icon-btn icon-btn-sm" aria-label="Remove method" onClick={() => set('payment_methods', methods.filter((_, j) => j !== i))}><LuTrash2 /></button>}
      </div>
    ))}
    <Btn variant="soft" size="sm" style={{ alignSelf: 'flex-start' }} onClick={add}><LuPlus /> Add method</Btn>
    <div className="form-grid">
      <Field label="UPI ID (optional)" htmlFor="p-upi" hint="Shown after ordering with an “Open a UPI app” button"><input id="p-upi" className="input" value={d.upi_id || ''} onChange={(e) => set('upi_id', e.target.value)} placeholder="shopname@okbank" /></Field>
      <Field label="UPI payee name" htmlFor="p-upin"><input id="p-upin" className="input" value={d.upi_name || ''} onChange={(e) => set('upi_name', e.target.value)} /></Field>
    </div>
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function ReceiptPanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false);
  const save = async () => { const t = Number(d.tax_percent); if (!(t >= 0 && t <= 40)) { toast.error('Tax must be between 0 and 40%.'); return; } setBusy(true); await saveSettings({ receipt_header: d.receipt_header, receipt_footer: d.receipt_footer, receipt_paper: d.receipt_paper, tax_percent: t, tax_label: d.tax_label, gstin: d.gstin }); setBusy(false); };
  return (<>
    <h2>Receipt &amp; tax</h2>
    <div className="two-col" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', gap: 24 }}>
      <div className="stack">
        <Field label="Receipt header" htmlFor="r-h"><input id="r-h" className="input" maxLength={80} value={d.receipt_header || ''} onChange={(e) => set('receipt_header', e.target.value)} /></Field>
        <Field label="Receipt footer" htmlFor="r-f"><input id="r-f" className="input" maxLength={80} value={d.receipt_footer || ''} onChange={(e) => set('receipt_footer', e.target.value)} /></Field>
        <Field label="Paper width"><Seg value={d.receipt_paper || '80'} onChange={(v) => set('receipt_paper', v)} options={[{ value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }]} /></Field>
        <div className="form-grid">
          <Field label="Tax rate (%)" htmlFor="r-tax" hint="Added on top of menu prices. 0 = no tax line."><input id="r-tax" className="input" inputMode="decimal" value={d.tax_percent ?? ''} onChange={(e) => set('tax_percent', e.target.value.replace(/[^\d.]/g, ''))} /></Field>
          <Field label="Tax label" htmlFor="r-tl"><input id="r-tl" className="input" maxLength={12} value={d.tax_label || ''} onChange={(e) => set('tax_label', e.target.value)} /></Field>
          <Field label="GSTIN (optional)" htmlFor="r-gst" className="full"><input id="r-gst" className="input" maxLength={20} value={d.gstin || ''} onChange={(e) => set('gstin', e.target.value.toUpperCase())} /></Field>
        </div>
        <Field label="Currency"><input className="input" value="INR (₹)" disabled /></Field>
        <p className="tiny muted">Tax changes apply to new orders. Existing orders keep the rate they were placed with.</p>
      </div>
      <div className="receipt-stage hide-sm"><ReceiptView m={testReceipt(d)} paper={d.receipt_paper || '80'} /></div>
    </div>
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function PrinterPanel({ owner }: { owner: boolean }) {
  const [d, set] = useDraft(); const ps = useStore(printerState); const dev = useStore(devicePrinter);
  const [busy, setBusy] = useState(false); const [testing, setTesting] = useState(false); const [last, setLast] = useState('');
  const pr = d.printer || {}; const updP = (k: string, v: any) => set('printer', { ...pr, [k]: v });
  const save = async () => { setBusy(true); await saveSettings({ printer: { name: pr.name || 'Counter printer', connection: pr.connection || 'browser', baud: Number(pr.baud) || 9600 }, receipt_paper: d.receipt_paper }); setBusy(false); };
  const conn = effectiveConnection(d);
  const test = async () => { setTesting(true); const r = await sendToPrinter(testReceipt(d), d); setTesting(false); setLast(r.status === 'failed' ? `Failed: ${r.error}` : r.status === 'simulated' ? 'Simulated — nothing was sent to a device.' : r.status === 'sent_to_browser' ? 'Print dialog opened.' : 'Test receipt sent to the printer.'); if (r.status === 'failed') toast.error(r.error || 'Test failed'); };
  const OPTS: [string, string, string][] = [
    ['bluetooth', 'Bluetooth thermal printer (BLE)', 'Direct ESC/POS printing over Web Bluetooth. Works in Chrome/Edge on Android and computers, and on iPad only inside the Bluefy browser app. Bluetooth LE printers only.'],
    ['browser', 'Browser printing / AirPrint', 'Opens the system print dialog. On iPad this prints to AirPrint printers (some receipt printers support it) or “Save as PDF”.'],
    ['serial', 'USB thermal printer (Web Serial)', 'Chrome or Edge on a computer. For printers that appear as a serial/COM port.'],
    ['simulated', 'Simulated printer (demo)', 'Nothing is printed; receipts are logged as “simulated”. For presentations without hardware.']];
  return (<>
    <h2>Printer</h2>
    <div className="od-sec" style={{ background: 'var(--neutral-2)' }}>
      <b>This device</b>
      <dl className="kv" style={{ marginTop: 8 }}>
        <dt>Device</dt><dd>{ENV.ipad ? 'iPad' : ENV.ios ? 'iPhone' : 'Computer / Android'}</dd>
        <dt>Web Bluetooth</dt><dd style={{ color: ENV.bluetooth ? 'var(--ok)' : 'var(--red)' }}>{ENV.bluetooth ? 'Available' : 'Not available in this browser'}</dd>
        <dt>Web Serial (USB)</dt><dd style={{ color: ENV.serial ? 'var(--ok)' : 'var(--ink-2)' }}>{ENV.serial ? 'Available' : 'Not available'}</dd>
      </dl>
      {!ENV.bluetooth && <div className="notice" style={{ marginTop: 12 }}><LuInfo /><span>{bluetoothAdvice()}</span></div>}
      <div className="form-grid" style={{ marginTop: 14 }}>
        <Field label="Printer used on this device" htmlFor="pr-dev"><select id="pr-dev" className="select" value={dev.connection || ''} onChange={(e) => devicePrinter.set({ ...dev, connection: (e.target.value || null) as any })}>
          <option value="">Shop default ({OPTS.find((o) => o[0] === (pr.connection || 'browser'))?.[1]})</option>{OPTS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Field>
        <div className="toggle-row" style={{ borderBottom: 0 }}><div><b className="small">Print automatically after each bill</b><div className="tiny muted">Bluetooth, USB and simulated printers only.</div></div><Toggle label="Auto print" checked={dev.auto} onChange={(v) => devicePrinter.set({ ...dev, auto: v })} /></div>
      </div>
      <div className="row spread row-wrap" style={{ marginTop: 10 }}>
        <PrinterChip />
        <Btn variant="soft" size="sm" loading={testing} onClick={test}><LuPrinter /> Print test receipt</Btn>
      </div>
      {last && <p className="small" style={{ marginTop: 10 }}><LuCircleCheck style={{ width: 15, verticalAlign: '-3px' }} /> {last}</p>}
      {conn === 'serial' && ps.serial === 'connected' && <Btn variant="ghost" size="sm" onClick={disconnectSerial}>Disconnect USB printer</Btn>}
    </div>
    {owner && <>
      <h3 style={{ fontSize: 16 }}>Shop default</h3>
      <div className="pay-opts">
        {OPTS.map(([k, t, h]) => <button key={k} type="button" className="pay-opt" aria-pressed={(pr.connection || 'browser') === k} onClick={() => updP('connection', k)}><span className="ic"><LuPrinter /></span><span><b>{t}</b><br /><span className="small muted">{h}</span></span><span className="radio" /></button>)}
      </div>
      <div className="form-grid">
        <Field label="Printer name" htmlFor="pr-name"><input id="pr-name" className="input" value={pr.name || ''} onChange={(e) => updP('name', e.target.value)} /></Field>
        <Field label="Paper width"><Seg value={d.receipt_paper || '80'} onChange={(v) => set('receipt_paper', v)} options={[{ value: '58', label: '58 mm' }, { value: '80', label: '80 mm' }]} /></Field>
        {(pr.connection === 'serial' || conn === 'serial') && <Field label="Baud rate (USB)" htmlFor="pr-baud" hint="Usually 9600 or 115200"><select id="pr-baud" className="select" value={pr.baud || 9600} onChange={(e) => updP('baud', Number(e.target.value))}>{[9600, 19200, 38400, 57600, 115200].map((b) => <option key={b} value={b}>{b}</option>)}</select></Field>}
      </div>
      <SaveBar onSave={save} busy={busy} />
    </>}
    <div className="od-sec">
      <h4>Which printers work on an iPad?</h4>
      <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
        <li><b>Bluetooth LE (BLE) ESC/POS printers</b> — open this site in <b>Bluefy</b> (free, App Store), choose “Bluetooth” above, tap Connect printer. Many low-cost 58/80 mm printers are BLE; some are Classic Bluetooth only and cannot work from any browser.</li>
        <li><b>AirPrint receipt printers</b> — use “Browser printing”; Safari works as-is.</li>
        <li><b>Network printers (Epson ePOS, Star WebPRNT) or Classic Bluetooth</b> — need a small native iPad app or a print bridge. Not included in this web app.</li>
      </ul>
      <p className="tiny muted" style={{ marginTop: 8 }}>A bill is always saved first. If printing fails, it can be reprinted from Bills at any time.</p>
    </div>
  </>);
}

function AppearancePanel() {
  const [d, set] = useDraft(); const [busy, setBusy] = useState(false); const [up, setUp] = useState(false);
  const swatches = ['#C98243', '#B8742F', '#D4A055', '#8D3024', '#7A5C3E', '#3F6B4E'];
  const save = async () => { if (!/^#[0-9a-f]{6}$/i.test(d.accent_color)) { toast.error('Pick a valid colour.'); return; } setBusy(true); await saveSettings({ accent_color: d.accent_color, logo_url: d.logo_url || null }); setBusy(false); };
  const upload = async (f?: File) => { if (!f) return; setUp(true); try { set('logo_url', await uploadImage(f)); } catch (e) { toast.error(errMsg(e)); } finally { setUp(false); } };
  return (<>
    <h2>Appearance</h2>
    <Field label="Accent colour" hint="Used for buttons, highlights and badges. Brand colours Espresso and Vanilla stay fixed.">
      <div className="row row-wrap">
        <div className="swatches">{swatches.map((c) => <button key={c} className="swatch" style={{ background: c }} aria-label={c} aria-pressed={d.accent_color?.toLowerCase() === c.toLowerCase()} onClick={() => { set('accent_color', c); applyAccent(c); }} />)}</div>
        <input type="color" value={d.accent_color || '#C98243'} onChange={(e) => { set('accent_color', e.target.value); applyAccent(e.target.value); }} aria-label="Custom colour" style={{ width: 44, height: 44, border: 0, background: 'none' }} />
        <Btn size="sm" variant="ghost" onClick={() => { set('accent_color', '#C98243'); applyAccent('#C98243'); }}>Reset to Caramel</Btn>
      </div>
    </Field>
    <Field label="Logo (optional)" hint="Without a logo the site uses the Crème & Crust wordmark. Use a wide PNG with transparent background.">
      <div className="row row-wrap">
        {d.logo_url ? <img src={d.logo_url} alt="Logo" style={{ height: 48, background: '#fff', borderRadius: 8, padding: 4 }} /> : <span className="small muted">No logo uploaded</span>}
        <label className="btn btn-soft btn-sm">{up ? <span className="spinner" /> : <LuUpload />} Upload<input type="file" accept="image/png,image/webp,image/jpeg" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
        {d.logo_url && <Btn size="sm" variant="ghost" onClick={() => set('logo_url', null)}>Remove</Btn>}
      </div>
    </Field>
    <SaveBar onSave={save} busy={busy} />
  </>);
}

function TeamPanel() {
  const me = useAuth().profile; const [rows, setRows] = useState<any[] | null>(null); const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'staff' }); const [busy, setBusy] = useState(false);
  const load = () => db.select('profiles', 'select=*&order=created_at.asc').then(setRows).catch(() => setRows([]));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!f.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email) || f.password.length < 8) { toast.error('Enter a name, a valid email and a password of 8+ characters.'); return; }
    setBusy(true);
    try { await db.rpc('create_staff_account', { p_email: f.email, p_password: f.password, p_name: f.name, p_role: f.role }); toast.success(`${f.name} can now sign in`); setShow(false); setF({ name: '', email: '', password: '', role: 'staff' }); load(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const setActive = async (p: any, v: boolean) => { try { await db.rpc('set_staff_active', { p_user: p.id, p_active: v }); load(); } catch (e) { toast.error(errMsg(e)); } };
  return (<>
    <div className="row spread"><h2>Team</h2><Btn variant="primary" size="sm" onClick={() => setShow(!show)}><LuPlus /> Add member</Btn></div>
    <p className="small muted"><b>Owner</b>: everything. <b>Staff</b>: orders, kitchen, receipts and inventory — no menu, prices, offers, analytics or settings.</p>
    {show && <div className="od-sec" style={{ background: 'var(--neutral-2)' }}>
      <div className="form-grid">
        <Field label="Name" htmlFor="t-name"><input id="t-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Email (used to sign in)" htmlFor="t-email"><input id="t-email" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Temporary password" htmlFor="t-pw" hint="8+ characters. Ask them to change it after signing in."><input id="t-pw" className="input" type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Field>
        <Field label="Role"><Seg value={f.role} onChange={(v) => setF({ ...f, role: v })} options={[{ value: 'staff', label: 'Staff' }, { value: 'owner', label: 'Owner' }]} /></Field>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}><Btn variant="ghost" onClick={() => setShow(false)}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={add}>Create account</Btn></div>
    </div>}
    {!rows ? <Skel h={120} /> : rows.map((p) => (
      <div key={p.id} className="toggle-row"><div><b>{p.full_name}</b> <span className={`badge ${p.role === 'owner' ? 'badge-dark' : ''}`} style={{ height: 22, marginLeft: 6 }}>{p.role}</span>{!p.is_active && <span className="badge badge-red" style={{ height: 22, marginLeft: 6 }}>Deactivated</span>}<div className="small muted">{p.email}</div></div>
        {p.id !== me?.id ? <Toggle label={`${p.full_name} active`} checked={p.is_active} onChange={(v) => setActive(p, v)} /> : <span className="tiny muted">You</span>}</div>
    ))}
  </>);
}

function DemoPanel() {
  const [d, set] = useDraft(); const [count, setCount] = useState<number | null>(null); const [busy, setBusy] = useState('');
  const load = () => db.select('orders', 'select=id&is_demo=eq.true&limit=2000').then((r) => setCount(r.length)).catch(() => setCount(null));
  useEffect(() => { load(); }, []);
  const run = async (regen: boolean) => {
    const r = await ask({ title: regen ? 'Reset demo data?' : 'Remove all demo orders?', message: regen ? 'Removes every order marked as demo, restores demo stock levels and creates a fresh set of sample orders for the last 30 days. Real orders and your menu are not touched.' : 'Removes every order marked as demo and restores demo stock levels. Real orders and your menu are not touched. Analytics will show only real data.', input: { label: 'Type RESET to confirm', match: 'RESET', required: true }, actions: [{ label: regen ? 'Reset demo data' : 'Remove demo orders', value: 'ok', variant: 'danger' }] });
    if (r.value !== 'ok') return;
    setBusy(regen ? 'reset' : 'clear');
    try { const res = await db.rpc('reset_demo_data', { p_regenerate: regen }); toast.success(`Removed ${res.removed} demo orders${regen ? `, created ${res.created}` : ''}`); load(); refreshOrders(); loadMenu(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  return (<>
    <h2>Demo data</h2>
    <div className="demo-banner" style={{ margin: 0 }}><LuFlaskConical /><span>{count == null ? 'Counting demo orders…' : `${count} orders are marked as demo.`} They show a purple “Demo” tag everywhere and are labelled in analytics.</span></div>
    <div className="toggle-row"><div><b>Demo mode</b><div className="small muted">While on, every new order placed on the website is marked as demo, so it can be cleared later. Turn this off when the shop starts taking real orders.</div></div><Toggle label="Demo mode" checked={!!d.demo_mode} onChange={async (v) => { set('demo_mode', v); await saveSettings({ demo_mode: v }, v ? 'Demo mode on' : 'Demo mode off — new orders are real'); }} /></div>
    <div className="row row-wrap">
      <Btn variant="dark" loading={busy === 'reset'} disabled={!!busy} onClick={() => run(true)}>Reset demo data</Btn>
      <Btn variant="danger-soft" loading={busy === 'clear'} disabled={!!busy} onClick={() => run(false)}>Remove all demo orders</Btn>
    </div>
    <p className="tiny muted">Only records flagged as demo are affected. Menu items, prices, coupons and settings you edited stay as they are.</p>
  </>);
}

function AccountPanel() {
  const me = useAuth().profile; const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (pw.length < 8) { toast.error('Use at least 8 characters.'); return; } if (pw !== pw2) { toast.error('The passwords don’t match.'); return; }
    setBusy(true); try { await auth.updatePassword(pw); toast.success('Password changed'); setPw(''); setPw2(''); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (<>
    <h2>My account</h2>
    <dl className="kv"><dt>Name</dt><dd>{me?.full_name}</dd><dt>Email</dt><dd>{me?.email}</dd><dt>Role</dt><dd style={{ textTransform: 'capitalize' }}>{me?.role}</dd></dl>
    <div className="form-grid" style={{ maxWidth: 560 }}>
      <Field label="New password" htmlFor="a-pw"><input id="a-pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field label="Repeat new password" htmlFor="a-pw2"><input id="a-pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
    </div>
    <div><Btn variant="primary" loading={busy} onClick={save}>Change password</Btn></div>
  </>);
}
export { settingsStore, toPaise, rupees, Empty };
