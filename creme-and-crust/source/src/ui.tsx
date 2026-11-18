import { useEffect, useState, useRef, ReactNode } from 'react';
import { LuX, LuCircleCheck, LuCircleAlert, LuInfo, LuSearch, LuMinus, LuPlus } from 'react-icons/lu';
import { navigate, useStore, toastStore, askStore } from './lib/core';

export function Link({ to, children, className, onClick, ...rest }: any) {
  return (
    <a href={to} className={className} {...rest} onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || rest.target) return;
      e.preventDefault(); navigate(to);
    }}>{children}</a>
  );
}

export function Btn({ variant = 'dark', size, block, loading, children, className = '', ...rest }: any) {
  return (
    <button type="button" className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${block ? 'btn-block' : ''} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spinner" /> : null}{children}
    </button>
  );
}

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="2" y="2" width="36" height="36" rx="11" fill="#241711" />
      <rect x="8" y="8" width="24" height="24" rx="6" fill="var(--caramel)" />
      <path d="M16 8v24M24 8v24M8 16h24M8 24h24" stroke="#241711" strokeWidth="2.2" opacity=".55" />
      <circle cx="29" cy="11" r="3.2" fill="#F6EFE5" />
    </svg>
  );
}
export function Wordmark({ settings, light }: { settings?: any; light?: boolean }) {
  if (settings?.logo_url) return <img className="brand-logo" src={settings.logo_url} alt={settings.shop_name || 'Logo'} />;
  const name: string = settings?.shop_name || 'Crème & Crust';
  const parts = name.split(' & ');
  return (
    <span className="brand"><BrandMark />
      <span className="brand-name" style={light ? { color: 'var(--vanilla)' } : undefined}>
        {parts.length === 2 ? <>{parts[0]} <i>&amp;</i> {parts[1]}</> : name}
      </span>
    </span>
  );
}

export function Img({ src, alt, className = '', style, eager }: { src?: string | null; alt: string; className?: string; style?: any; eager?: boolean }) {
  const [state, setState] = useState<'loading' | 'ok' | 'err'>(src ? 'loading' : 'err');
  useEffect(() => { setState(src ? 'loading' : 'err'); }, [src]);
  return (
    <div className={`img-wrap ${className}`} style={style}>
      {src && state !== 'err' && (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" className={state === 'loading' ? 'loading' : ''}
          onLoad={() => setState('ok')} onError={() => setState('err')} />
      )}
      {state === 'err' && <div className="img-ph" role="img" aria-label={alt}><span>{alt}</span></div>}
    </div>
  );
}

export function useLockScroll(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [on]);
}
function useEscape(fn: () => void) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { const h = (e: KeyboardEvent) => e.key === 'Escape' && ref.current(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
}

export function Modal({ open, onClose, title, children, footer, size, bare, labelledBy }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'wide' | 'narrow'; bare?: boolean; labelledBy?: string }) {
  useLockScroll(open);
  if (!open) return null;
  return <ModalInner {...{ onClose, title, children, footer, size, bare, labelledBy }} />;
}
function ModalInner({ onClose, title, children, footer, size, bare }: any) {
  useEscape(onClose);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const el = box.current?.querySelector<HTMLElement>('input,textarea,select,button:not(.close-x)'); if (el && window.matchMedia('(pointer:fine)').matches) el.focus({ preventScroll: true }); }, []);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size || ''}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} ref={box}>
        <button className="icon-btn icon-btn-sm close-x" onClick={onClose} aria-label="Close"><LuX /></button>
        {!bare && title && <div className="modal-head"><h2>{title}</h2></div>}
        <div className="modal-body" style={bare ? { paddingTop: 0 } : undefined}>{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, wide, headExtra }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean; headExtra?: ReactNode }) {
  useLockScroll(open);
  if (!open) return null;
  return <DrawerInner {...{ onClose, title, children, footer, wide, headExtra }} />;
}
function DrawerInner({ onClose, title, children, footer, wide, headExtra }: any) {
  useEscape(onClose);
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className={`drawer ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-head"><h2>{title}</h2>{headExtra}<button className="icon-btn icon-btn-sm" onClick={onClose} aria-label="Close"><LuX /></button></div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </div>
  );
}

export function Toaster() {
  const list = useStore(toastStore);
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} role={t.kind === 'error' ? 'alert' : 'status'}>
          {t.kind === 'success' ? <LuCircleCheck /> : t.kind === 'error' ? <LuCircleAlert /> : <LuInfo />}
          <span>{t.text}</span>
          {t.action && <button className="t-action" onClick={() => { t.action!.onClick(); toastStore.set((x) => x.filter((y) => y.id !== t.id)); }}>{t.action.label}</button>}
        </div>
      ))}
    </div>
  );
}

export function AskHost() {
  const a = useStore(askStore);
  const [text, setText] = useState('');
  useEffect(() => setText(''), [a]);
  if (!a) return null;
  const needs = a.input?.required && !text.trim();
  const mismatch = a.input?.match && text.trim() !== a.input.match;
  return (
    <Modal open size="narrow" title={a.title} onClose={() => a.resolve({ value: null, text })}
      footer={<>
        <Btn variant="ghost" onClick={() => a.resolve({ value: null, text })}>{a.cancelLabel || 'Cancel'}</Btn>
        {(a.actions || [{ label: 'OK', value: 'ok' }]).map((x) => (
          <Btn key={x.value} variant={x.variant || 'dark'} disabled={!!(needs || mismatch)} onClick={() => a.resolve({ value: x.value, text: text.trim() })}>{x.label}</Btn>
        ))}
      </>}>
      {a.message && <p className="muted" style={{ marginBottom: a.input ? 16 : 0 }}>{a.message}</p>}
      {a.input && (
        <div className="field">
          <label htmlFor="ask-input">{a.input.label}</label>
          <input id="ask-input" className="input" value={text} placeholder={a.input.placeholder} onChange={(e) => setText(e.target.value)} autoFocus />
        </div>
      )}
    </Modal>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3>{text && <p>{text}</p>}{action && <div style={{ marginTop: 10 }}>{action}</div>}</div>;
}
export function ErrorState({ text, onRetry }: { text?: string; onRetry?: () => void }) {
  return <Empty icon={<LuCircleAlert />} title="Something went wrong" text={text || 'Please try again in a moment.'} action={onRetry && <Btn variant="outline" onClick={onRetry}>Try again</Btn>} />;
}
export const Skel = ({ h = 16, w = '100%', r, style }: any) => <div className="skel" style={{ height: h, width: w, borderRadius: r, ...style }} />;
export const Spinner = () => <span className="spinner" aria-label="Loading" />;
export const StatusPill = ({ s }: { s: string }) => <span className={`st st-${s}`}>{({ new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' } as any)[s] || s}</span>;

export function Field({ label, hint, error, children, htmlFor, className = '' }: any) {
  return <div className={`field ${className}`}>{label && <label htmlFor={htmlFor}>{label}</label>}{children}{error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}</div>;
}
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="toggle" disabled={disabled} onClick={() => onChange(!checked)} />;
}
export function Seg({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { value: string; label: ReactNode; icon?: ReactNode }[]; label?: string }) {
  return <div className="seg" role="group" aria-label={label}>{options.map((o) => <button type="button" key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.icon}{o.label}</button>)}</div>;
}
export function Stepper({ value, onChange, min = 1, max = 20, small }: { value: number; onChange: (n: number) => void; min?: number; max?: number; small?: boolean }) {
  return (
    <div className={`stepper ${small ? 'stepper-sm' : ''}`}>
      <button type="button" aria-label="Decrease" onClick={() => onChange(value - 1)} disabled={value <= min}><LuMinus /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(value + 1)} disabled={value >= max}><LuPlus /></button>
    </div>
  );
}
export function SearchInput({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder: string; id?: string }) {
  return <div className="search"><LuSearch /><input id={id} className="input" type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} /></div>;
}
export function useDebounced<T>(v: T, ms = 250) { const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d; }
