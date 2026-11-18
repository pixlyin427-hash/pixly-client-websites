// Receipt formatting is separate from how it reaches paper.
// Drivers: 'browser' (system print dialog, works everywhere), 'simulated' (demo, prints nothing),
// 'serial' (Web Serial API → ESC/POS bytes, Chrome/Edge desktop with a USB/serial thermal printer).
import { createRoot } from 'react-dom/client';
import { db } from './supa';
import { inr, fmtDateTime, orderTypeLabel, paymentLabel, createStore, toast, errMsg } from './core';

export type ReceiptModel = {
  shop: string; header: string; address: string; phone: string; gstin: string;
  receiptNo: string | null; orderNumber: string; date: string; customer: string; orderType: string;
  items: { name: string; qty: number; unit: number; total: number; options: { name: string; price: number }[]; notes: string }[];
  subtotal: number; discount: number; coupon: string | null; taxLabel: string; taxPercent: number; tax: number; total: number;
  payment: string; paymentStatus: string; footer: string; demo: boolean; test?: boolean;
};

export function buildReceipt(o: any, s: any, receiptNo?: string | null): ReceiptModel {
  const items = (o.order_items || o.items || []).map((i: any) => ({
    name: i.product_name ?? i.name, qty: i.quantity, unit: i.unit_price_paise, total: i.line_total_paise, notes: i.notes || '',
    options: (i.order_item_options || i.options || []).map((x: any) => ({ name: x.option_name ?? x.name, price: x.price_paise })),
  }));
  return {
    shop: s?.shop_name || 'Crème & Crust', header: s?.receipt_header || '', address: s?.address || '', phone: s?.phone || '', gstin: s?.gstin || '',
    receiptNo: receiptNo ?? o.receipt_no ?? null, orderNumber: o.order_number, date: fmtDateTime(o.created_at), customer: o.customer_name,
    orderType: orderTypeLabel(o.order_type, o.table_label), items, subtotal: o.subtotal_paise, discount: o.discount_paise, coupon: o.coupon_code || o.discount_label || null,
    taxLabel: s?.tax_label || 'Tax', taxPercent: Number(o.tax_percent ?? s?.tax_percent ?? 0), tax: o.tax_paise, total: o.total_paise,
    payment: paymentLabel(s, o.payment_method), paymentStatus: o.payment_status, footer: s?.receipt_footer || 'Thank you!', demo: !!o.is_demo,
  };
}

export function testReceipt(s: any): ReceiptModel {
  return { ...buildReceipt({ order_number: 'TEST-PRINT', created_at: new Date().toISOString(), customer_name: 'Printer test', order_type: 'takeaway',
    items: [{ name: 'Classic Belgian', quantity: 1, unit_price_paise: 9900, line_total_paise: 9900, options: [{ name: 'Caramel', price_paise: 0 }] }],
    subtotal_paise: 9900, discount_paise: 0, tax_paise: 0, total_paise: 9900, tax_percent: 0, payment_method: 'cash', payment_status: 'unpaid' }, s, 'TEST'), test: true };
}

const payStatus = (s: string) => (s === 'paid' ? 'PAID' : s === 'refunded' ? 'REFUNDED' : 'UNPAID — pay at counter');

export function ReceiptView({ m, paper }: { m: ReceiptModel; paper: '58' | '80' }) {
  return (
    <div className={`receipt w${paper}`}>
      <div className="shop">{m.shop}</div>
      {m.header && <div className="c">{m.header}</div>}
      {m.address && <div className="c">{m.address}</div>}
      {m.phone && <div className="c">Ph: {m.phone}</div>}
      {m.gstin && <div className="c">GSTIN: {m.gstin}</div>}
      <div className="hr" />
      {m.test && <div className="c b">*** TEST RECEIPT ***</div>}
      {m.demo && <div className="c b">*** DEMO ORDER ***</div>}
      <div className="r"><span>Receipt</span><span className="b">{m.receiptNo || '— on print'}</span></div>
      <div className="r"><span>Order</span><span className="b">{m.orderNumber}</span></div>
      <div className="r"><span>Date</span><span>{m.date}</span></div>
      <div className="r"><span>Customer</span><span>{m.customer}</span></div>
      <div className="r"><span>Type</span><span>{m.orderType}</span></div>
      <div className="hr" />
      {m.items.map((it, i) => (
        <div key={i} style={{ marginBottom: 4 }}>
          <div className="r"><span className="b">{it.qty} × {it.name}</span><span>{inr(it.total)}</span></div>
          {it.options.map((o, j) => <div key={j} className="opt"><span>+ {o.name}</span><span>{o.price ? inr(o.price) : ''}</span></div>)}
          {it.qty > 1 && <div className="opt"><span>@ {inr(it.unit)} each</span><span /></div>}
          {it.notes && <div className="opt"><span>“{it.notes}”</span><span /></div>}
        </div>
      ))}
      <div className="hr" />
      <div className="r"><span>Subtotal</span><span>{inr(m.subtotal)}</span></div>
      {m.discount > 0 && <div className="r"><span>Discount{m.coupon ? ` (${m.coupon})` : ''}</span><span>−{inr(m.discount)}</span></div>}
      {m.taxPercent > 0 && <div className="r"><span>{m.taxLabel} {m.taxPercent}%</span><span>{inr(m.tax)}</span></div>}
      <div className="hr" />
      <div className="r tot"><span>TOTAL</span><span>{inr(m.total)}</span></div>
      <div className="hr" />
      <div className="r"><span>Payment</span><span>{m.payment}</span></div>
      <div className="r"><span>Status</span><span className="b">{payStatus(m.paymentStatus)}</span></div>
      <div className="hr" />
      <div className="c b" style={{ marginTop: 6 }}>{m.footer}</div>
    </div>
  );
}

// ───────── ESC/POS (plain text; ₹ is printed as "Rs." because most thermal fonts lack the glyph) ─────────
const asc = (s: string) => s.replace(/₹/g, 'Rs.').replace(/[−–—]/g, '-').replace(/[×]/g, 'x').replace(/[“”]/g, '"').replace(/[’‘]/g, "'").replace(/[èéêë]/g, 'e').replace(/[^\x20-\x7E]/g, '');
function lr(l: string, r: string, w: number) { l = asc(l); r = asc(r); const space = w - r.length - 1; if (l.length > space) l = l.slice(0, Math.max(0, space)); return l + ' '.repeat(Math.max(1, w - l.length - r.length)) + r; }
export function receiptLines(m: ReceiptModel, w: number) {
  const L: { t: string; c?: boolean; b?: boolean; big?: boolean }[] = [];
  const hr = { t: '-'.repeat(w) };
  L.push({ t: asc(m.shop), c: true, b: true, big: true });
  [m.header, m.address, m.phone && `Ph: ${m.phone}`, m.gstin && `GSTIN: ${m.gstin}`].filter(Boolean).forEach((x) => L.push({ t: asc(String(x)), c: true }));
  L.push(hr);
  if (m.test) L.push({ t: '*** TEST RECEIPT ***', c: true, b: true });
  if (m.demo) L.push({ t: '*** DEMO ORDER ***', c: true, b: true });
  L.push({ t: lr('Receipt', m.receiptNo || '-', w) }, { t: lr('Order', m.orderNumber, w), b: true }, { t: lr('Date', m.date, w) }, { t: lr('Customer', m.customer, w) }, { t: lr('Type', m.orderType, w) }, hr);
  m.items.forEach((it) => {
    L.push({ t: lr(`${it.qty} x ${it.name}`, inr(it.total), w), b: true });
    it.options.forEach((o) => L.push({ t: lr(`  + ${o.name}`, o.price ? inr(o.price) : '', w) }));
    if (it.notes) L.push({ t: asc(`  "${it.notes}"`).slice(0, w) });
  });
  L.push(hr, { t: lr('Subtotal', inr(m.subtotal), w) });
  if (m.discount > 0) L.push({ t: lr(`Discount${m.coupon ? ` (${m.coupon})` : ''}`, '-' + inr(m.discount), w) });
  if (m.taxPercent > 0) L.push({ t: lr(`${m.taxLabel} ${m.taxPercent}%`, inr(m.tax), w) });
  L.push(hr, { t: lr('TOTAL', inr(m.total), w), b: true }, hr, { t: lr('Payment', m.payment, w) }, { t: lr('Status', payStatus(m.paymentStatus), w) }, hr, { t: asc(m.footer), c: true, b: true });
  return L;
}
export function escposBytes(m: ReceiptModel, paper: '58' | '80') {
  const w = paper === '58' ? 32 : 48; const out: number[] = [];
  const push = (...b: number[]) => out.push(...b); const text = (s: string) => { for (const ch of s) out.push(ch.charCodeAt(0) & 0x7f); };
  push(0x1b, 0x40); // init
  receiptLines(m, w).forEach((l) => {
    push(0x1b, 0x61, l.c ? 1 : 0); push(0x1b, 0x45, l.b ? 1 : 0); push(0x1d, 0x21, l.big ? 0x11 : 0x00);
    text(l.big ? l.t.slice(0, Math.floor(w / 2)) : l.t); push(0x0a);
  });
  push(0x1b, 0x64, 4); push(0x1d, 0x56, 0x42, 0x00); // feed + partial cut
  return new Uint8Array(out);
}

// ───────── environment (what this device/browser can really do) ─────────
const ua = navigator.userAgent;
export const ENV = {
  ipad: /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  ios: /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
  bluetooth: !!(navigator as any).bluetooth,
  serial: !!(navigator as any).serial,
};
export function bluetoothAdvice() {
  if (ENV.bluetooth) return '';
  if (ENV.ios) return 'Safari (and every browser on iPad/iPhone) cannot use Bluetooth printers — Apple has not added Web Bluetooth. Open this site in the free “Bluefy – Web BLE Browser” app to print to a Bluetooth LE thermal printer, or use an AirPrint receipt printer with “Browser printing”.';
  return 'This browser has no Web Bluetooth. Use Chrome or Edge (desktop or Android), or Bluefy on iPad.';
}

// ───────── drivers ─────────
type Conn = 'browser' | 'simulated' | 'serial' | 'bluetooth';
type PrintResult = { status: 'sent_to_browser' | 'simulated' | 'printed' | 'failed'; method: 'browser' | 'simulated' | 'serial' | 'bluetooth'; error?: string };
export const printerState = createStore<{ serial: 'unsupported' | 'disconnected' | 'connected'; portInfo?: string; bt: 'unsupported' | 'disconnected' | 'connecting' | 'connected'; btName?: string; last?: string }>({ serial: ENV.serial ? 'disconnected' : 'unsupported', bt: ENV.bluetooth ? 'disconnected' : 'unsupported' });
// which printer THIS device uses (an iPad at the counter and a laptop in the back can differ); falls back to the shop default
export const devicePrinter = createStore<{ connection: Conn | null; auto: boolean }>((() => { try { return JSON.parse(localStorage.getItem('cc.printer.device') || 'null') || { connection: null, auto: true }; } catch { return { connection: null, auto: true }; } })());
devicePrinter.subscribe(() => { try { localStorage.setItem('cc.printer.device', JSON.stringify(devicePrinter.get())); } catch { /* ignore */ } });
export const effectiveConnection = (settings: any): Conn => devicePrinter.get().connection || settings?.printer?.connection || 'browser';
export function printerReady(settings: any) {
  const c = effectiveConnection(settings); const st = printerState.get();
  return c === 'bluetooth' ? st.bt === 'connected' : c === 'serial' ? st.serial === 'connected' : true;
}

// Web Bluetooth (BLE GATT). Classic-Bluetooth (SPP) printers cannot be reached from any browser.
const BLE_SERVICES = ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb', '0000af30-0000-1000-8000-00805f9b34fb'];
let bt: { device: any; ch: any } | null = null;
const onBtGone = () => { bt = null; printerState.set((s) => ({ ...s, bt: 'disconnected', btName: undefined })); };
async function findWritable(server: any) {
  for (const uuid of BLE_SERVICES) {
    try {
      const svc = await server.getPrimaryService(uuid);
      const chars = await svc.getCharacteristics();
      const ch = chars.find((c: any) => c.properties.writeWithoutResponse || c.properties.write);
      if (ch) return ch;
    } catch { /* service not on this device */ }
  }
  return null;
}
export async function connectBluetooth() {
  const nb = (navigator as any).bluetooth;
  if (!nb) throw new Error(bluetoothAdvice());
  printerState.set((s) => ({ ...s, bt: 'connecting' }));
  try {
    const device = await nb.requestDevice({ acceptAllDevices: true, optionalServices: BLE_SERVICES });
    const server = await device.gatt.connect();
    const ch = await findWritable(server);
    if (!ch) { try { device.gatt.disconnect(); } catch { /* ignore */ } throw new Error(`Connected to “${device.name || 'device'}”, but it has no printer data channel. It may be a Classic Bluetooth printer, which browsers cannot use — choose a Bluetooth LE (BLE) printer.`); }
    device.addEventListener('gattserverdisconnected', onBtGone);
    bt = { device, ch };
    printerState.set((s) => ({ ...s, bt: 'connected', btName: device.name || 'Bluetooth printer' }));
  } catch (e: any) {
    printerState.set((s) => ({ ...s, bt: 'disconnected' }));
    if (e?.name === 'NotFoundError') throw new Error('No printer was selected.');
    throw e;
  }
}
export function disconnectBluetooth() { try { bt?.device?.removeEventListener('gattserverdisconnected', onBtGone); bt?.device?.gatt?.disconnect(); } catch { /* ignore */ } onBtGone(); }
async function printBluetooth(m: ReceiptModel, paper: '58' | '80'): Promise<PrintResult> {
  if (!bt || !bt.device?.gatt?.connected) return { status: 'failed', method: 'bluetooth', error: 'The Bluetooth printer is not connected. Tap “Connect printer”, then reprint — the bill is already saved.' };
  const data = escposBytes(m, paper); const ch = bt.ch; const noResp = !!ch.properties.writeWithoutResponse && !!ch.writeValueWithoutResponse;
  const size = noResp ? 100 : 180;
  try {
    for (let i = 0; i < data.length; i += size) {
      const part = data.slice(i, i + size);
      if (noResp) { await ch.writeValueWithoutResponse(part); await new Promise((r) => setTimeout(r, 18)); }
      else if (ch.writeValueWithResponse) await ch.writeValueWithResponse(part);
      else await ch.writeValue(part);
    }
    return { status: 'printed', method: 'bluetooth' };
  } catch (e) { return { status: 'failed', method: 'bluetooth', error: `The printer stopped responding (${errMsg(e)}). The bill is saved — reconnect and reprint.` }; }
}
let port: any = null;
export async function reconnectSerial() {
  const ser = (navigator as any).serial; if (!ser) return false;
  try { const ports = await ser.getPorts(); if (ports[0]) { port = ports[0]; printerState.set((s) => ({ ...s, serial: 'connected', portInfo: portLabel(port) })); return true; } } catch { /* ignore */ }
  return false;
}
const portLabel = (p: any) => { try { const i = p.getInfo(); return i.usbVendorId ? `USB device ${i.usbVendorId.toString(16)}:${(i.usbProductId || 0).toString(16)}` : 'Serial port'; } catch { return 'Serial port'; } };
export async function connectSerial() {
  const ser = (navigator as any).serial;
  if (!ser) throw new Error('This browser cannot talk to USB printers directly. Use Chrome or Edge on a computer, or use browser printing.');
  port = await ser.requestPort();
  printerState.set((s) => ({ ...s, serial: 'connected', portInfo: portLabel(port) }));
}
export function disconnectSerial() { port = null; printerState.set((s) => ({ ...s, serial: (navigator as any).serial ? 'disconnected' : 'unsupported', portInfo: undefined })); }

async function printSerial(m: ReceiptModel, paper: '58' | '80', baud: number): Promise<PrintResult> {
  if (!port) { const ok = await reconnectSerial(); if (!ok) return { status: 'failed', method: 'serial', error: 'No thermal printer connected. Connect it in Settings → Printer.' }; }
  try {
    if (!port.writable) await port.open({ baudRate: baud || 9600 });
    const writer = port.writable.getWriter();
    try { await writer.write(escposBytes(m, paper)); } finally { writer.releaseLock(); }
    return { status: 'printed', method: 'serial' };
  } catch (e) { return { status: 'failed', method: 'serial', error: `The printer did not accept the data (${errMsg(e)}).` }; }
}

function printBrowser(m: ReceiptModel, paper: '58' | '80'): Promise<PrintResult> {
  return new Promise((resolve) => {
    let rootEl = document.getElementById('print-root');
    if (!rootEl) { rootEl = document.createElement('div'); rootEl.id = 'print-root'; document.body.appendChild(rootEl); }
    const style = document.createElement('style');
    style.textContent = `@page { size: ${paper}mm auto; margin: 0; }`;
    document.head.appendChild(style);
    const root = createRoot(rootEl);
    root.render(<ReceiptView m={m} paper={paper} />);
    setTimeout(() => {
      document.body.classList.add('printing');
      let finished = false;
      const done = () => { if (finished) return; finished = true; document.body.classList.remove('printing'); style.remove(); root.unmount(); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      try { window.print(); resolve({ status: 'sent_to_browser', method: 'browser' }); }
      catch (e) { resolve({ status: 'failed', method: 'browser', error: errMsg(e) }); }
      setTimeout(done, 1500);
    }, 60);
  });
}

export async function sendToPrinter(m: ReceiptModel, settings: any, paperOverride?: '58' | '80'): Promise<PrintResult> {
  const conn = effectiveConnection(settings);
  if (conn === 'bluetooth') return printBluetooth(m, (paperOverride || settings?.receipt_paper || '58') as any);
  const paper = (paperOverride || settings?.receipt_paper || '80') as '58' | '80';
  if (conn === 'simulated') { await new Promise((r) => setTimeout(r, 500)); return { status: 'simulated', method: 'simulated' }; }
  if (conn === 'serial') return printSerial(m, paper, Number(settings?.printer?.baud) || 9600);
  return printBrowser(m, paper);
}

// full workflow used by Orders / Receipts / Kitchen: assign number → print → log the attempt honestly
export async function printOrderReceipt(order: any, settings: any, paper?: '58' | '80') {
  const p = (paper || settings?.receipt_paper || '80') as '58' | '80';
  try {
    const no = await db.rpc('assign_receipt_no', { p_order_id: order.id });
    const result = await sendToPrinter(buildReceipt(order, settings, no), settings, p);
    const log = await db.rpc('record_receipt_print', { p_order_id: order.id, p_method: result.method, p_status: result.status, p_paper: p });
    if (result.status === 'failed') { toast.error(result.error || 'Printing failed.'); return { ...result, log }; }
    const what = log.kind === 'reprint' ? 'Reprint' : 'Receipt';
    if (result.status === 'simulated') toast.info(`${what} ${no} — simulated printer (nothing sent to a device)`);
    else if (result.status === 'sent_to_browser') toast.success(`${what} ${no} sent to the print dialog`);
    else toast.success(`${what} ${no} sent to the ${result.method === 'bluetooth' ? 'Bluetooth' : 'USB'} printer`);
    return { ...result, log, receiptNo: no };
  } catch (e) { toast.error(errMsg(e)); return { status: 'failed', method: 'browser', error: errMsg(e) }; }
}
