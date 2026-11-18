import { useEffect, useMemo, useState } from 'react';
import { LuShoppingBag, LuMenu, LuX, LuPlus, LuCheck, LuSlidersHorizontal, LuChevronRight, LuMapPin, LuPhone, LuClock, LuInstagram, LuMessageCircle, LuMail, LuArrowRight } from 'react-icons/lu';
import { useCart, useMenu, useSettings, useRoute, cart, cartSummary, productGroups, needsChoice, inr, toast, navigate, menuStore, cartStore } from '../lib/core';
import { Link, Btn, Img, Modal, Wordmark, Stepper } from '../ui';

// ───────── header ─────────
export function SiteHeader() {
  const { path } = useRoute();
  const c = useCart();
  const s = useSettings().data;
  const count = c.lines.reduce((n, l) => n + l.qty, 0);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => { const f = () => setScrolled(window.scrollY > 8); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { if (!c.bump) return; setBump(true); const t = setTimeout(() => setBump(false), 460); return () => clearTimeout(t); }, [c.bump]);
  const links = [['/', 'Home'], ['/menu', 'Menu'], ['/about', 'About'], ['/contact', 'Contact'], ['/track-order', 'Track order']];
  return (
    <>
      <header className={`site-header ${scrolled || open ? 'scrolled' : ''}`}>
        <div className="container inner">
          <Link to="/" aria-label="Home"><Wordmark settings={s} /></Link>
          <nav className="nav" aria-label="Main">
            {links.map(([to, label]) => <Link key={to} to={to} className={(to === '/' ? path === '/' : path.startsWith(to)) ? 'active' : ''}>{label}</Link>)}
          </nav>
          <div className="header-actions">
            <Link to="/cart" className="icon-btn" aria-label={`Cart, ${count} items`}>
              <LuShoppingBag />{count > 0 && <span className={`cart-count ${bump ? 'bump' : ''}`}>{count}</span>}
            </Link>
            <Link to="/menu" className="btn btn-primary order-cta">Order Now</Link>
            <button className="icon-btn menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <LuX /> : <LuMenu />}</button>
          </div>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile">
          {links.map(([to, label]) => <Link key={to} to={to}>{label}<LuChevronRight /></Link>)}
          <Link to="/menu" className="btn btn-primary btn-lg">Order Now</Link>
        </nav>
      )}
    </>
  );
}

// ───────── footer ─────────
export function SiteFooter() {
  const s = useSettings().data || {};
  const wa = String(s.whatsapp || '').replace(/\D/g, '');
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Wordmark settings={s} light />
            <p style={{ marginTop: 16, maxWidth: 300 }}>{s.tagline || 'Made for your cravings.'} Golden waffles. Melting chocolate. Unforgettable moments.</p>
            <div className="socials">
              {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram"><LuInstagram /></a>}
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><LuMessageCircle /></a>}
              {s.email && <a href={`mailto:${s.email}`} aria-label="Email"><LuMail /></a>}
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul><li><Link to="/menu">Menu</Link></li><li><Link to="/about">About us</Link></li><li><Link to="/contact">Contact</Link></li><li><Link to="/track-order">Track your order</Link></li><li><Link to="/cart">Your cart</Link></li></ul>
          </div>
          <div>
            <h4>Visit</h4>
            <ul className="contact">
              {s.address && <li><LuMapPin /><span>{s.address}</span></li>}
              {s.phone && <li><LuPhone /><a href={`tel:${String(s.phone).replace(/\s/g, '')}`}>{s.phone}</a></li>}
              {wa && <li><LuMessageCircle /><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp us</a></li>}
            </ul>
          </div>
          <div>
            <h4>Opening hours</h4>
            <ul className="hours-list">
              {(s.hours || []).map((h: any) => <li key={h.day}><span>{h.day}</span><span>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</span></li>)}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {s.shop_name || 'Crème & Crust'}. All rights reserved.</span>
          <span>Prices in INR{Number(s.tax_percent) > 0 ? ` · ${s.tax_label || 'Tax'} ${s.tax_percent}% added at checkout` : ''}</span>
        </div>
      </div>
    </footer>
  );
}

// ───────── product card ─────────
export const customizeStore = { open: (_pid: string, _editKey?: string) => {} };
export function ProductCard({ p }: { p: any }) {
  const m = useMenu();
  const [added, setAdded] = useState(false);
  const groups = productGroups(m, p.id);
  const soldOut = !p.is_available;
  const quickAdd = () => {
    if (needsChoice(m, p.id)) { customizeStore.open(p.id); return; }
    cart.add(p.id, [], 1);
    setAdded(true); setTimeout(() => setAdded(false), 1200);
    toast.success(`${p.name} added to your cart`, { label: 'View cart', onClick: () => navigate('/cart') });
  };
  return (
    <article className={`pcard ${soldOut ? 'soldout' : ''}`}>
      <div style={{ position: 'relative' }}>
        <div className="pcard-badges">
          {p.is_bestseller && <span className="badge badge-caramel">Bestseller</span>}
          {p.is_new && <span className="badge badge-berry">New</span>}
        </div>
        {soldOut && <div className="soldout-veil"><span>Sold out today</span></div>}
        <Img src={p.image_url} alt={p.name} />
      </div>
      <div className="pcard-body">
        <h3>{p.name}</h3>
        <p>{p.description}</p>
        <div className="pcard-foot">
          <div className="stack" style={{ gap: 0 }}>
            <span className="price">{inr(p.price_paise)}</span>
            {groups.length > 0 && !soldOut && <button className="customize" aria-label={`Customize ${p.name}`} onClick={() => customizeStore.open(p.id)}><LuSlidersHorizontal /><span>Customize</span></button>}
          </div>
          <button className={`add-btn ${added ? 'added' : ''}`} onClick={quickAdd} disabled={soldOut} aria-label={soldOut ? `${p.name} is sold out` : `Add ${p.name} to cart`}>
            {added ? <LuCheck /> : <LuPlus />}
          </button>
        </div>
      </div>
    </article>
  );
}

// ───────── customize sheet (also used to edit a cart line) ─────────
export function CustomizeHost() {
  const [state, setState] = useState<{ pid: string; editKey?: string } | null>(null);
  customizeStore.open = (pid, editKey) => setState({ pid, editKey });
  if (!state) return null;
  return <Customize key={state.pid + (state.editKey || '')} pid={state.pid} editKey={state.editKey} onClose={() => setState(null)} />;
}
function Customize({ pid, editKey, onClose }: { pid: string; editKey?: string; onClose: () => void }) {
  const m = useMenu();
  const p = m.products.find((x) => x.id === pid);
  const groups = useMemo(() => productGroups(m, pid), [m, pid]);
  const editing = editKey ? cartStore.get().lines.find((l) => l.key === editKey) : undefined;
  const [sel, setSel] = useState<string[]>(editing?.option_ids || []);
  const [qty, setQty] = useState(editing?.qty || 1);
  const [notes, setNotes] = useState(editing?.notes || '');
  const [tried, setTried] = useState(false);
  if (!p) return null;
  const toggle = (g: any, id: string) => {
    setSel((cur) => {
      const inGroup = cur.filter((x) => g.options.some((o: any) => o.id === x));
      if (cur.includes(id)) return g.required && g.selection === 'single' ? cur : cur.filter((x) => x !== id);
      if (g.selection === 'single') return [...cur.filter((x) => !inGroup.includes(x)), id];
      if (g.max_select > 0 && inGroup.length >= g.max_select) return cur;
      return [...cur, id];
    });
  };
  const chosen = sel.map((id) => m.options.find((o) => o.id === id)).filter(Boolean) as any[];
  const addOns = chosen.reduce((s, o) => s + o.price_paise, 0);
  const unit = p.price_paise + addOns;
  const missing = groups.filter((g: any) => g.required && !g.options.some((o: any) => sel.includes(o.id)));
  const submit = () => {
    setTried(true);
    if (missing.length) return;
    if (editKey) { cart.replace(editKey, p.id, sel, qty, notes); toast.success('Cart updated'); }
    else { cart.add(p.id, sel, qty, notes); toast.success(`${qty} × ${p.name} added`, { label: 'View cart', onClick: () => navigate('/cart') }); }
    onClose();
  };
  return (
    <Modal open bare onClose={onClose} title={p.name}
      footer={<div className="cz-foot">
        <div className="stack" style={{ gap: 2 }}>
          <span className="price" style={{ fontSize: 22 }}>{inr(unit * qty)}</span>
          <span className="cz-breakdown">{inr(p.price_paise)}{addOns ? ` + ${inr(addOns)} add-ons` : ''}{qty > 1 ? ` × ${qty}` : ''}</span>
        </div>
        <div className="row"><Stepper value={qty} onChange={setQty} /><Btn variant="primary" size="lg" onClick={submit} disabled={!p.is_available}>{editKey ? 'Update item' : 'Add to cart'}</Btn></div>
      </div>}>
      <Img className="cz-hero" src={p.image_url} alt={p.name} eager />
      <div className="cz-title">
        <div className="row" style={{ gap: 8 }}>{p.is_bestseller && <span className="badge badge-caramel">Bestseller</span>}{p.is_new && <span className="badge badge-berry">New</span>}</div>
        <h2 style={{ marginTop: 8 }}>{p.name}</h2>
        <p className="muted" style={{ marginTop: 6 }}>{p.description}</p>
      </div>
      {groups.map((g: any) => {
        const inGroup = sel.filter((x) => g.options.some((o: any) => o.id === x));
        const full = g.selection === 'multi' && g.max_select > 0 && inGroup.length >= g.max_select;
        const rule = g.selection === 'single' ? (g.required ? 'Choose 1 · Required' : 'Choose up to 1') : g.max_select ? `Choose up to ${g.max_select}` : 'Optional';
        return (
          <section className="cz-group" key={g.id}>
            <div className="cz-group-head"><h4>{g.name}</h4><span className={`tiny ${tried && missing.includes(g) ? '' : 'muted'}`} style={tried && missing.includes(g) ? { color: 'var(--red)', fontWeight: 700 } : undefined}>{rule}</span></div>
            <div className="cz-opts">
              {g.options.map((o: any) => {
                const on = sel.includes(o.id);
                return (
                  <button key={o.id} type="button" className={`opt ${g.selection === 'single' ? 'radio' : ''}`} aria-pressed={on} disabled={!on && full} onClick={() => toggle(g, o.id)}>
                    <span className="tick"><LuCheck /></span>{o.name}<small>{o.price_paise ? `+${inr(o.price_paise)}` : 'Free'}</small>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      <section className="cz-group">
        <div className="cz-group-head"><h4>Special instructions</h4><span className="tiny muted">Optional</span></div>
        <textarea className="textarea" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. less sweet, cut into 4 pieces" aria-label="Special instructions" />
      </section>
      {chosen.length > 0 && <p className="small muted" style={{ marginTop: 14 }}>Selected: {chosen.map((o) => o.name).join(', ')}</p>}
    </Modal>
  );
}

// ───────── floating mobile cart bar ─────────
export function CartBar() {
  const m = useMenu(); const c = useCart();
  const sum = cartSummary(m, c);
  if (!sum.count) return null;
  return (
    <div className="cart-bar">
      <Link to="/cart"><span><b>{sum.count}</b> item{sum.count > 1 ? 's' : ''} · {inr(sum.subtotal)}</span><span className="btn btn-primary btn-sm">View cart <LuArrowRight /></span></Link>
    </div>
  );
}

export function SiteLayout({ children, cartBar }: { children: any; cartBar?: boolean }) {
  return (
    <div className={cartBar ? 'has-cart-bar' : ''}>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      {cartBar && <CartBar />}
    </div>
  );
}

