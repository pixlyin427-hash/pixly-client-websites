import { Fragment, useEffect, useMemo, useState } from 'react';
import { LuArrowRight, LuFlame, LuWheat, LuChefHat, LuHeart, LuClock, LuSparkles, LuCopy, LuShoppingBag, LuTrash2, LuPencil, LuTicket, LuCircleAlert, LuInfo, LuBanknote, LuSmartphone, LuCreditCard, LuStore, LuArmchair, LuCheck, LuSearch, LuReceipt, LuPackage, LuCookingPot, LuCircleCheckBig, LuCircleX, LuPhone, LuMapPin, LuMessageCircle, LuInstagram, LuRefreshCw, LuExternalLink, LuWallet } from 'react-icons/lu';
import {
  useMenu, useSettings, useCart, useStore, offersStore, cart, cartSummary, inr, navigate, useQuery, setQuery, visibleProducts, useCouponPreview, taxOn,
  paymentMethods, paymentLabel, validPhone, normalizePhone, uid, errMsg, toast, rememberOrder, recentOrders, fmtTime, fmtDateTime, orderTypeLabel,
  useInterval, copyText, todayHours, useTitle, loadMenu, priceLine,
} from '../lib/core';
import { db } from '../lib/supa';
import { Link, Btn, Img, Empty, ErrorState, Skel, Field, Seg, Stepper, SearchInput, useDebounced } from '../ui';
import { SiteLayout, ProductCard, customizeStore } from './shop';

const shortCat = (n: string) => n.replace(/ Waffles$/i, '');

function ProductGridSkeleton({ n = 4 }: { n?: number }) {
  return <div className="grid-products">{Array.from({ length: n }).map((_, i) => <div key={i} className="pcard"><Skel h={210} r={0} /><div className="pcard-body"><Skel h={22} w="70%" /><Skel h={14} /><Skel h={14} w="60%" /><Skel h={40} w={90} r={999} style={{ marginTop: 12 }} /></div></div>)}</div>;
}

// ───────── HOME ─────────
export function Home() {
  useTitle('');
  const m = useMenu(); const s = useSettings().data || {}; const offers = useStore(offersStore);
  const products = visibleProducts(m);
  const best = products.filter((p) => p.is_bestseller).slice(0, 4);
  const bestFill = best.length >= 4 ? best : [...best, ...products.filter((p) => !best.includes(p) && p.is_available)].slice(0, 4);
  const heroMain = bestFill[0]; const heroCard = bestFill[1] || bestFill[0];
  const heroRound = products.find((p) => p.is_new && p.image_url) || bestFill[2];
  const cats = m.categories.filter((c) => c.is_active && c.slug !== 'signature').slice(0, 6);
  const hours = todayHours(s);
  return (
    <SiteLayout>
      <section className="hero">
        <div className="grid-pattern" />
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Fresh Belgian waffles · Made to order</span>
            <h1>Made for your <em>cravings.</em></h1>
            <p className="lede">Freshly made waffles, irresistible toppings and little moments of happiness.</p>
            <div className="hero-ctas">
              <Link to="/menu" className="btn btn-primary btn-lg">Order Now <LuArrowRight /></Link>
              <Link to="/menu" className="btn btn-outline btn-lg">Explore Menu</Link>
            </div>
            <div className="hero-facts">
              <div><strong>{s.prep_minutes || 12} min</strong><span>average prep time</span></div>
              <div><strong>{products.length || '—'}</strong><span>waffles &amp; drinks</span></div>
              <div><strong>{hours ? (hours.closed ? 'Closed' : `${hours.open}–${hours.close}`) : '—'}</strong><span>open today</span></div>
            </div>
          </div>
          <div className="hero-art" aria-hidden={m.status !== 'ready'}>
            <div className="hero-blob" />
            {m.status === 'ready' ? <>
              <Img className="hero-main" src={heroMain?.image_url} alt={heroMain?.name || 'Signature waffle'} eager />
              <Img className="hero-round" src={heroRound?.image_url} alt={heroRound?.name || 'Waffle'} eager />
              {heroCard && <button className="hero-card" onClick={() => customizeStore.open(heroCard.id)} style={{ textAlign: 'left' }}>
                <Img src={heroCard.image_url} alt={heroCard.name} />
                <span><small>Today’s favourite</small><b>{heroCard.name}</b><small>{inr(heroCard.price_paise)} · tap to customise</small></span>
              </button>}
              <div className="hero-chip"><LuSparkles /> Golden. Crisp. Made just for you.</div>
            </> : <Skel h="92%" w="72%" r={999} style={{ position: 'absolute', right: 30, top: 0 }} />}
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">
        {Array.from({ length: 2 }).map((_, k) => <span key={k}><span>Golden waffles</span><span>Melting chocolate</span><span>Unforgettable moments</span><span>Made for your cravings</span><span>Golden waffles</span><span>Melting chocolate</span><span>Unforgettable moments</span><span>Made for your cravings</span></span>)}
      </div></div>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">Loved by regulars</span><h2 className="section-title" style={{ marginTop: 10 }}>Our <em>bestsellers</em></h2></div>
            <Link to="/menu" className="link">See the full menu <LuArrowRight /></Link>
          </div>
          {m.status === 'loading' ? <ProductGridSkeleton /> : m.status === 'error' ? <ErrorState text={m.error} onRetry={loadMenu} /> :
            bestFill.length ? <div className="grid-products">{bestFill.map((p) => <ProductCard key={p.id} p={p} />)}</div> :
              <Empty icon={<LuCookingPot />} title="The menu is being prepared" text="Check back in a little while." />}
        </div>
      </section>

      {cats.length > 0 && <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Find your favourite</span><h2 className="section-title" style={{ marginTop: 10 }}>Browse by <em>craving</em></h2></div></div>
          <div className="grid-cats">
            {cats.map((c) => {
              const img = c.image_url || products.find((p) => p.category_id === c.id && p.image_url)?.image_url;
              const n = products.filter((p) => p.category_id === c.id).length;
              return (
                <Link key={c.id} to={`/menu?c=${c.slug}`} className="cat-tile">
                  <Img src={img} alt={c.name} />
                  <div className="cat-label"><div><h3>{c.slug === 'beverages' ? 'Drinks' : shortCat(c.name)}</h3><small>{n} item{n === 1 ? '' : 's'} · {c.description}</small></div><span className="arrow"><LuArrowRight /></span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>}

      {offers.list.length > 0 && <section className="section" style={{ paddingTop: 0 }} id="offers">
        <div className="container">
          <div className="offers-grid">
            <div className="offer-hero">
              <Img src={products.find((p) => p.category_id === m.categories.find((c) => c.slug === 'combos')?.id)?.image_url || heroMain?.image_url} alt="Offer" />
              <span className="badge" style={{ background: 'rgba(255,255,255,.16)', color: '#fff', alignSelf: 'flex-start', position: 'relative' }}><LuTicket /> Special offer</span>
              <h3 style={{ marginTop: 16 }}>{offers.list[0].title || 'Special offer'}</h3>
              <p>{offers.list[0].description}</p>
              <div className="row row-wrap">
                <span className="code-chip">{offers.list[0].code}<button onClick={() => { copyText(offers.list[0].code); }}><LuCopy /> Copy</button></span>
                <Link to="/menu" className="btn btn-white">Order now <LuArrowRight /></Link>
              </div>
            </div>
            <div className="offer-side">
              {offers.list.slice(1, 3).map((o, i) => (
                <div key={o.code} className={`offer-card ${i === 1 ? 'dark' : ''}`}>
                  <span className="eyebrow">Use code</span>
                  <h4>{o.title || o.code}</h4>
                  <p className="muted">{o.description}</p>
                  <span className="code-chip" style={{ marginTop: 'auto' }}>{o.code}<button onClick={() => copyText(o.code)}><LuCopy /> Copy</button></span>
                </div>
              ))}
              {offers.list.length === 1 && <div className="offer-card dark"><span className="eyebrow">How it works</span><h4>Apply it at checkout</h4><p className="muted">Add your favourites to the cart, enter the code and the discount is calculated before you place your order.</p></div>}
            </div>
          </div>
        </div>
      </section>}

      <section className="section" style={{ paddingTop: offers.list.length ? 0 : undefined }}>
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Why {s.shop_name || 'Crème & Crust'}</span><h2 className="section-title" style={{ marginTop: 10 }}>Little things, <em>done properly</em></h2></div></div>
          <div className="why-grid">
            {[[<LuFlame key="a" />, 'Freshly prepared', 'Every waffle comes off the iron minutes before it reaches you — never reheated.'],
              [<LuWheat key="b" />, 'Quality ingredients', 'Real butter, Belgian-style batter, proper chocolate and fresh fruit.'],
              [<LuChefHat key="c" />, 'Made to order', 'Choose your sauces, toppings and extras. We make it exactly your way.'],
              [<LuHeart key="d" />, 'Happiness in every bite', 'Warm, crisp, a little indulgent — the kind of treat you come back for.']].map(([ic, t, d]: any) => (
              <div className="why" key={t}><div className="ic">{ic}</div><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">Kind words</span><h2 className="section-title" style={{ marginTop: 10 }}>What a craving <em>sounds like</em></h2></div>
            <span className="badge badge-outline" title="These are sample testimonials written for this demonstration, not real customer reviews."><LuInfo /> Demo testimonials — for presentation only</span>
          </div>
          <div className="quotes">
            {[['The Lotus Biscoff waffle is dangerously good. Crisp edges, warm spread, gone in two minutes.', 'Sample customer', 'Demo review'],
              ['Ordered from my phone, got a message it was ready, walked in and picked it up hot. So easy.', 'Sample customer', 'Demo review'],
              ['Our Friday-night ritual now. The Choco Overload with an extra scoop is the move.', 'Sample customer', 'Demo review']].map(([q, n, r], i) => (
              <figure className="quote" key={i} style={{ margin: 0 }}>
                <blockquote>{q}</blockquote>
                <figcaption className="who"><span className="avatar">{['SC', 'DR', 'FN'][i]}</span><span><b className="small">{n}</b><br /><span className="tiny muted">{r}</span></span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band">
            <div className="grid-pattern" />
            <h2>Your next craving <em>starts here.</em></h2>
            <p>Pick a waffle, make it yours, and we’ll have it hot and ready in about {s.prep_minutes || 12} minutes.</p>
            <Link to="/menu" className="btn btn-primary btn-lg">Order Now <LuArrowRight /></Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

// ───────── MENU ─────────
export function MenuPage() {
  useTitle('Menu');
  const m = useMenu(); const q = useQuery();
  const active = q.get('c') || 'all';
  const [search, setSearch] = useState(q.get('q') || '');
  const [sort, setSort] = useState('recommended');
  const dq = useDebounced(search.trim().toLowerCase(), 200);
  const cats = m.categories.filter((c) => c.is_active);
  const all = visibleProducts(m);
  const filtered = useMemo(() => {
    let list = all.filter((p) => (active === 'all' || cats.find((c) => c.slug === active)?.id === p.category_id) && (!dq || `${p.name} ${p.description}`.toLowerCase().includes(dq)));
    if (sort === 'low') list = [...list].sort((a, b) => a.price_paise - b.price_paise);
    if (sort === 'high') list = [...list].sort((a, b) => b.price_paise - a.price_paise);
    if (sort === 'recommended') list = [...list].sort((a, b) => Number(b.is_available) - Number(a.is_available));
    return list;
  }, [all, active, dq, sort, cats]);
  const grouped = active === 'all' && !dq && sort === 'recommended';
  return (
    <SiteLayout cartBar>
      <div className="container page-head">
        <span className="eyebrow">Freshly made, every time</span>
        <h1>The menu</h1>
        <p>Golden Belgian waffles, cold coffees and thick shakes. Tap <b>Customize</b> to make any waffle your own.</p>
      </div>
      <div className="menu-bar">
        <div className="container">
          <div className="chips-scroll" role="tablist" aria-label="Categories">
            <button className="chip" aria-pressed={active === 'all'} onClick={() => setQuery({ c: null })}>All <span className="count">{all.length}</span></button>
            {cats.map((c) => <button key={c.id} className="chip" aria-pressed={active === c.slug} onClick={() => setQuery({ c: c.slug })}>{c.name} <span className="count">{all.filter((p) => p.category_id === c.id).length}</span></button>)}
          </div>
          <div className="menu-tools">
            <SearchInput value={search} onChange={setSearch} placeholder="Search waffles, drinks…" />
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
              <option value="recommended">Recommended</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option>
            </select>
          </div>
        </div>
      </div>
      <div className="container" style={{ paddingBottom: 40 }}>
        {m.status === 'loading' ? <ProductGridSkeleton n={8} /> : m.status === 'error' ? <ErrorState text={m.error} onRetry={loadMenu} /> :
          filtered.length === 0 ? <Empty icon={<LuSearch />} title={dq ? `Nothing matches “${search.trim()}”` : 'No waffles available in this category right now.'} text={dq ? 'Try another word, or browse all categories.' : 'Have a look at our other categories — something delicious is waiting.'}
            action={<Btn variant="outline" onClick={() => { setSearch(''); setQuery({ c: null }); }}>Show everything</Btn>} /> :
            grouped ? cats.map((c) => {
              const list = filtered.filter((p) => p.category_id === c.id);
              if (!list.length) return null;
              return <section key={c.id} style={{ marginBottom: 44 }}><h2 className="cat-section-title">{c.name}<small>{c.description}</small></h2><div className="grid-products">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>;
            }) : <div className="grid-products">{filtered.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
      </div>
    </SiteLayout>
  );
}

// ───────── CART ─────────
function OrderTotals({ subtotal, coupon, s, compact }: { subtotal: number; coupon: any; s: any; compact?: boolean }) {
  const discount = coupon?.ok ? coupon.discount_paise : 0;
  const tax = taxOn(subtotal - discount, s?.tax_percent);
  return (
    <div>
      <div className="sum-row"><span className="muted">Subtotal</span><span>{inr(subtotal)}</span></div>
      {discount > 0 && <div className="sum-row"><span className="muted">Discount ({coupon.code})</span><span className="discount">−{inr(discount)}</span></div>}
      {Number(s?.tax_percent) > 0 && <div className="sum-row"><span className="muted">{s.tax_label || 'Tax'} ({Number(s.tax_percent)}%)</span><span>{inr(tax)}</span></div>}
      <div className="sum-row total"><span>Total</span><span>{inr(subtotal - discount + tax)}</span></div>
      {!compact && <p className="tiny muted" style={{ marginTop: 6 }}>Prices and discounts are confirmed by the shop’s system when you place the order.</p>}
    </div>
  );
}

function CouponBox({ subtotal }: { subtotal: number }) {
  const c = useCart(); const offers = useStore(offersStore);
  const [code, setCode] = useState(c.coupon || '');
  const prev = useCouponPreview(c.coupon, subtotal);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label className="label" htmlFor="coupon">Coupon code</label>
      {c.coupon ? (
        <div className="row spread" style={{ background: prev.result?.ok ? 'var(--ok-soft)' : 'var(--neutral-2)', borderRadius: 12, padding: '10px 14px' }}>
          <span className="row" style={{ gap: 8 }}><LuTicket style={{ width: 18 }} /><b>{c.coupon}</b></span>
          <button className="link" onClick={() => { cart.setCoupon(null); setCode(''); }}>Remove</button>
        </div>
      ) : (
        <div className="row">
          <input id="coupon" className="input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = code.trim().toUpperCase(); if (v) cart.setCoupon(v); } }} placeholder="e.g. WAFFLE10" autoComplete="off" maxLength={20} />
          <Btn variant="outline" disabled={!code.trim()} onClick={() => { const v = code.trim().toUpperCase(); if (v) cart.setCoupon(v); }}>Apply</Btn>
        </div>
      )}
      {c.coupon && (prev.loading ? <span className="tiny muted">Checking code…</span> : prev.result && <span className="small" style={{ color: prev.result.ok ? 'var(--ok)' : 'var(--red)' }}>{prev.result.message}</span>)}
      {!c.coupon && offers.list.length > 0 && <div className="row row-wrap" style={{ gap: 6 }}><span className="tiny muted">Available:</span>{offers.list.map((o) => <button key={o.code} className="badge badge-outline" onClick={() => { setCode(o.code); cart.setCoupon(o.code); }}>{o.code}</button>)}</div>}
    </div>
  );
}

export function CartPage() {
  useTitle('Your cart');
  const m = useMenu(); const c = useCart(); const s = useSettings().data;
  const sum = cartSummary(m, c);
  const coupon = useCouponPreview(c.coupon, sum.subtotal).result;
  if (m.status === 'loading') return <SiteLayout><div className="container section"><Skel h={300} r={20} /></div></SiteLayout>;
  if (!c.lines.length) return (
    <SiteLayout><div className="container section"><Empty icon={<LuShoppingBag />} title="Your cart is waiting for something delicious." text="Golden waffles, melting chocolate and cold coffee are one tap away." action={<Link to="/menu" className="btn btn-primary btn-lg">Browse the menu <LuArrowRight /></Link>} /></div></SiteLayout>
  );
  return (
    <SiteLayout>
      <div className="container page-head"><h1>Your cart</h1><p>{sum.count} item{sum.count > 1 ? 's' : ''} ready for checkout.</p></div>
      <div className="container two-col" style={{ paddingBottom: 60 }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          {sum.lines.map((l) => (
            <div key={l.key} className={`line ${l.available ? '' : 'unavailable'}`}>
              <Img src={l.product?.image_url} alt={l.product?.name || 'Item'} />
              <div style={{ minWidth: 0 }}>
                <h3>{l.product?.name || 'Unavailable item'}</h3>
                {l.options.length > 0 && <div className="opts">{l.options.map((o: any) => `${o.name}${o.price_paise ? ` (+${inr(o.price_paise)})` : ''}`).join(' · ')}</div>}
                {l.notes && <div className="note">“{l.notes}”</div>}
                {!l.available && <div className="small" style={{ color: 'var(--red)', marginTop: 6, fontWeight: 500 }}><LuCircleAlert style={{ width: 14, verticalAlign: '-2px' }} /> {l.reason}</div>}
                <div className="line-actions">
                  <Stepper small value={l.qty} min={1} onChange={(n) => cart.setQty(l.key, n)} />
                  {l.product && productEditable(m, l.product.id) && <button className="link" onClick={() => customizeStore.open(l.product.id, l.key)}><LuPencil /> Edit</button>}
                  <button className="link" style={{ color: 'var(--red)' }} onClick={() => { cart.remove(l.key); toast.info(`${l.product?.name || 'Item'} removed`); }}><LuTrash2 /> Remove</button>
                </div>
              </div>
              <div className="line-total">{inr(l.total)}<div className="tiny muted" style={{ fontWeight: 400 }}>{inr(l.unit)} each</div></div>
            </div>
          ))}
        </div>
        <aside className="card card-pad sticky-col stack" style={{ gap: 16 }}>
          <h2 className="card-title">Order summary</h2>
          <CouponBox subtotal={sum.subtotal} />
          <hr className="divider" style={{ margin: 0 }} />
          <OrderTotals subtotal={sum.subtotal} coupon={coupon} s={s} />
          {sum.hasUnavailable && <div className="notice notice-red"><LuCircleAlert /><span>Remove or edit the highlighted items to continue.</span></div>}
          <Btn variant="primary" size="lg" block disabled={sum.hasUnavailable || sum.subtotal <= 0} onClick={() => navigate('/checkout')}>Continue to checkout <LuArrowRight /></Btn>
          <Link to="/menu" className="link" style={{ alignSelf: 'center' }}>Add more items</Link>
        </aside>
      </div>
    </SiteLayout>
  );
}
const productEditable = (m: any, pid: string) => { const p = m.products.find((x: any) => x.id === pid); return p?.is_customizable && m.links.some((l: any) => l.product_id === pid); };

// ───────── CHECKOUT ─────────
const PAY_ICON: Record<string, any> = { cash: <LuBanknote />, upi: <LuSmartphone />, card: <LuCreditCard /> };
export function CheckoutPage() {
  useTitle('Checkout');
  const m = useMenu(); const c = useCart(); const s = useSettings().data;
  const sum = cartSummary(m, c);
  const cp = useCouponPreview(c.coupon, sum.subtotal); const coupon = cp.result;
  const couponPending = !!c.coupon && (cp.loading || !coupon);
  const methods = paymentMethods(s).filter((x) => x.enabled);
  const types = [s?.takeaway_enabled && 'takeaway', s?.dine_in_enabled && 'dine_in'].filter(Boolean) as string[];
  const [f, setF] = useState({ name: '', phone: '', type: '', table: '', pay: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverErr, setServerErr] = useState('');
  useEffect(() => { setF((x) => ({ ...x, type: x.type || types[0] || '', pay: x.pay || methods[0]?.key || '' })); }, [s]); // eslint-disable-line
  if (m.status === 'loading' || !s) return <SiteLayout><div className="container section"><Skel h={400} r={20} /></div></SiteLayout>;
  if (!c.lines.length) return <SiteLayout><div className="container section"><Empty icon={<LuShoppingBag />} title="Your cart is empty" text="Add something delicious before checking out." action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>} /></div></SiteLayout>;
  const set = (k: string, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const discount = coupon?.ok ? coupon.discount_paise : 0;
  const total = sum.subtotal - discount + taxOn(sum.subtotal - discount, s.tax_percent);
  const closed = !s.ordering_enabled || !types.length || !methods.length;
  const submit = async (e: any) => {
    e.preventDefault(); if (busy) return;
    const er: Record<string, string> = {};
    if (f.name.trim().length < 2) er.name = 'Please enter your name.';
    if (!validPhone(f.phone)) er.phone = 'Enter a valid 10-digit mobile number.';
    if (!f.type) er.type = 'Choose takeaway or dine-in.';
    if (!f.pay) er.pay = 'Choose how you’ll pay.';
    setErrors(er); if (Object.keys(er).length) { toast.error('Please check the highlighted fields.'); return; }
    if (sum.hasUnavailable) { navigate('/cart'); return; }
    setBusy(true); setServerErr('');
    let ref = sessionStorage.getItem('cc.checkout.ref'); if (!ref) { ref = uid(); sessionStorage.setItem('cc.checkout.ref', ref); }
    try {
      const order = await db.rpc('place_order', { p: {
        client_ref: ref, customer_name: f.name.trim(), phone: normalizePhone(f.phone), order_type: f.type, table_label: f.type === 'dine_in' ? f.table : '',
        payment_method: f.pay, notes: f.notes, coupon_code: c.coupon || null,
        items: c.lines.map((l) => ({ product_id: l.product_id, option_ids: l.option_ids, quantity: l.qty, notes: l.notes })),
      } });
      sessionStorage.removeItem('cc.checkout.ref');
      rememberOrder(order.order_number, normalizePhone(f.phone));
      sessionStorage.setItem(`cc.order.${order.order_number}`, JSON.stringify(order));
      cart.clear();
      navigate(`/order-success?o=${encodeURIComponent(order.order_number)}`);
    } catch (err) {
      const msg = errMsg(err); setServerErr(msg); toast.error(msg);
      if (/no longer available|add-ons/i.test(msg)) loadMenu();
    } finally { setBusy(false); }
  };
  return (
    <SiteLayout>
      <div className="container page-head"><h1>Checkout</h1><p>Almost there — tell us who it’s for and how you’d like it.</p></div>
      <form className="container two-col" style={{ paddingBottom: 60 }} onSubmit={submit} noValidate>
        <div className="stack" style={{ gap: 20 }}>
          {closed && <div className="notice notice-red"><LuCircleAlert /><span>{!s.ordering_enabled ? 'We’re not accepting online orders right now. Please order at the counter.' : 'Online ordering isn’t fully set up yet. Please order at the counter.'}</span></div>}
          <section className="card card-pad">
            <div className="step-title"><span>1</span>Your details</div>
            <div className="form-grid">
              <Field label="Name" htmlFor="co-name" error={errors.name}><input id="co-name" className={`input ${errors.name ? 'invalid' : ''}`} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={60} placeholder="Your name" /></Field>
              <Field label="Mobile number" htmlFor="co-phone" error={errors.phone} hint="Used to look up your order — never shared.">
                <div className="input-group"><span className="addon">+91</span><input id="co-phone" className={`input ${errors.phone ? 'invalid' : ''}`} value={f.phone} onChange={(e) => set('phone', e.target.value.replace(/[^\d\s+-]/g, ''))} inputMode="tel" autoComplete="tel" maxLength={14} placeholder="98765 43210" /></div>
              </Field>
            </div>
          </section>
          <section className="card card-pad">
            <div className="step-title"><span>2</span>How would you like it?</div>
            {types.length > 1 ? <Seg label="Order type" value={f.type} onChange={(v) => set('type', v)} options={types.map((t) => ({ value: t, label: t === 'dine_in' ? 'Dine-in' : 'Takeaway / Pickup', icon: t === 'dine_in' ? <LuArmchair /> : <LuStore /> }))} />
              : types[0] ? <span className="badge">{types[0] === 'dine_in' ? 'Dine-in' : 'Takeaway / Pickup'}</span> : null}
            {errors.type && <p className="err small" style={{ color: 'var(--red)', marginTop: 8 }}>{errors.type}</p>}
            {f.type === 'dine_in' && <div style={{ marginTop: 14, maxWidth: 260 }}><Field label="Table number (optional)" htmlFor="co-table"><input id="co-table" className="input" value={f.table} maxLength={20} onChange={(e) => set('table', e.target.value)} placeholder="e.g. T4" /></Field></div>}
            <p className="small muted" style={{ marginTop: 14 }}><LuClock style={{ width: 15, verticalAlign: '-3px' }} /> Usually ready in about {s.prep_minutes} minutes after the shop accepts it.</p>
            <div style={{ marginTop: 16 }}><Field label="Notes for the shop (optional)" htmlFor="co-notes"><textarea id="co-notes" className="textarea" maxLength={500} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything we should know?" /></Field></div>
          </section>
          <section className="card card-pad">
            <div className="step-title"><span>3</span>Payment</div>
            <div className="pay-opts" role="radiogroup" aria-label="Payment method">
              {methods.map((pm) => (
                <button key={pm.key} type="button" role="radio" aria-checked={f.pay === pm.key} aria-pressed={f.pay === pm.key} className="pay-opt" onClick={() => set('pay', pm.key)}>
                  <span className="ic">{PAY_ICON[pm.key] || <LuWallet />}</span>
                  <span><b>{pm.label}</b><br /><span className="small muted">{pm.hint || 'Pay at the counter'}</span></span>
                  <span className="radio" />
                </button>
              ))}
            </div>
            {errors.pay && <p className="small" style={{ color: 'var(--red)', marginTop: 8 }}>{errors.pay}</p>}
            <div className="notice notice-info" style={{ marginTop: 14 }}><LuInfo /><span>No payment is taken on this website. You pay at the counter{f.pay === 'upi' && s.upi_id ? ` or to our UPI ID ${s.upi_id}` : ''}, and our staff confirm it.{s.demo_mode ? ' Demo mode is on — this order will be marked as a demo order.' : ''}</span></div>
          </section>
        </div>
        <aside className="card card-pad sticky-col stack" style={{ gap: 14 }}>
          <h2 className="card-title">Your order</h2>
          <div>
            {sum.lines.map((l) => (
              <div key={l.key} className="mini-line">
                <Img src={l.product?.image_url} alt={l.product?.name || ''} />
                <div className="grow"><b>{l.qty} × {l.product?.name}</b>{l.options.length > 0 && <div className="tiny muted">{l.options.map((o: any) => o.name).join(', ')}</div>}</div>
                <span className="num">{inr(l.total)}</span>
              </div>
            ))}
          </div>
          <hr className="divider" style={{ margin: 0 }} />
          <CouponBox subtotal={sum.subtotal} />
          <OrderTotals subtotal={sum.subtotal} coupon={coupon} s={s} compact />
          {serverErr && <div className="notice notice-red"><LuCircleAlert /><span>{serverErr}</span></div>}
          <Btn variant="primary" size="lg" block type="submit" loading={busy} disabled={closed || sum.hasUnavailable || couponPending}>{busy ? 'Placing order…' : couponPending ? 'Checking coupon…' : `Place order · ${inr(total)}`}</Btn>
          {c.coupon && coupon && !coupon.ok && <p className="tiny" style={{ color: 'var(--red)', textAlign: 'center' }}>Remove the coupon that can’t be applied, or the order will be rejected.</p>}
          <Link to="/cart" className="link" style={{ alignSelf: 'center' }}>Back to cart</Link>
        </aside>
      </form>
    </SiteLayout>
  );
}

// ───────── ORDER STATUS (shared by success + tracking) ─────────
const STEPS = [['new', 'Order placed', LuReceipt], ['accepted', 'Accepted', LuCheck], ['preparing', 'Preparing', LuCookingPot], ['ready', 'Ready', LuPackage], ['completed', 'Completed', LuCircleCheckBig]] as const;
const STATUS_COPY: Record<string, string> = {
  new: 'We’ve received your order and will accept it shortly.', accepted: 'The shop has accepted your order. It will go on the iron shortly.',
  preparing: 'Your waffles are being made right now.', ready: 'Your order is ready! Head to the counter.', completed: 'Order completed. Enjoy every bite!', cancelled: 'This order was cancelled.',
};
function Timeline({ o }: { o: any }) {
  const idx = STEPS.findIndex((x) => x[0] === o.status);
  const at: Record<string, string | null> = { new: o.created_at, accepted: o.accepted_at, preparing: o.preparing_at, ready: o.ready_at, completed: o.completed_at };
  return (
    <div className="timeline" aria-label="Order progress">
      {STEPS.map(([k, label, Icon], i) => (
        <div key={k} className={`tl-step ${i < idx ? 'done' : i === idx ? (k === 'completed' ? 'done' : 'current') : ''}`} aria-current={i === idx ? 'step' : undefined}>
          <span className="tl-dot"><Icon /></span>
          <div><b>{label}</b><small>{at[k] ? fmtTime(at[k] as string) : i > idx ? 'Pending' : ''}</small></div>
        </div>
      ))}
    </div>
  );
}
function OrderCard({ o, s, live }: { o: any; s: any; live?: string }) {
  const eta = o.status !== 'cancelled' && o.status !== 'completed' && o.prep_minutes ? new Date(new Date(o.accepted_at || o.created_at).getTime() + (o.prep_minutes + (o.accepted_at ? 0 : 3)) * 60000) : null;
  const upi = o.payment_method === 'upi' && s?.upi_id && o.payment_status === 'unpaid' && o.status !== 'cancelled';
  const upiLink = upi ? `upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.upi_name || s.shop_name)}&am=${(o.total_paise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent('Order ' + o.order_number)}` : '';
  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="card card-pad">
        <div className="row spread row-wrap" style={{ marginBottom: 14 }}>
          <div><span className="tiny muted">Order number</span><div className="order-no">{o.order_number}</div></div>
          <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
            <span className={`st st-${o.status}`}>{o.status === 'new' ? 'Order placed' : o.status[0].toUpperCase() + o.status.slice(1)}</span>
            {live && <span className={`live-dot ${live === 'off' ? 'off' : ''}`}>{live === 'off' ? 'Final status' : `Live · updated ${live}`}</span>}
          </div>
        </div>
        {o.status === 'cancelled' ? (
          <div className="notice notice-red"><LuCircleX /><span><b>This order was cancelled.</b> {o.cancel_reason ? `Reason: ${o.cancel_reason}.` : ''} If you already paid, please speak to the staff at the counter.</span></div>
        ) : <>
          <p style={{ marginBottom: 18, fontSize: 17 }}>{STATUS_COPY[o.status]}{eta && o.status !== 'ready' ? <> Estimated ready around <b>{fmtTime(eta)}</b>.</> : null}</p>
          <Timeline o={o} />
        </>}
      </div>
      <div className="card card-pad">
        <div className="kv" style={{ marginBottom: 14 }}>
          <dt>Placed</dt><dd>{fmtDateTime(o.created_at)}</dd>
          <dt>Name</dt><dd>{o.customer_name}</dd>
          <dt>Order type</dt><dd>{orderTypeLabel(o.order_type, o.table_label)}</dd>
          <dt>Payment</dt><dd>{paymentLabel(s, o.payment_method)} · <span style={{ color: o.payment_status === 'paid' ? 'var(--ok)' : 'var(--warn)' }}>{o.payment_status === 'paid' ? 'Paid' : o.payment_status === 'refunded' ? 'Refunded' : 'Pay at counter'}</span></dd>
        </div>
        <hr className="divider" />
        {(o.items || []).map((it: any, i: number) => (
          <div key={i} className="sum-row" style={{ alignItems: 'flex-start' }}>
            <span><b>{it.quantity} × {it.name}</b>{it.options?.length > 0 && <span className="tiny muted" style={{ display: 'block' }}>{it.options.map((x: any) => x.name).join(', ')}</span>}{it.notes && <span className="tiny" style={{ display: 'block', color: 'var(--caramel-ink)' }}>“{it.notes}”</span>}</span>
            <span>{inr(it.line_total_paise)}</span>
          </div>
        ))}
        <hr className="divider" />
        <div className="sum-row"><span className="muted">Subtotal</span><span>{inr(o.subtotal_paise)}</span></div>
        {o.discount_paise > 0 && <div className="sum-row"><span className="muted">Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span className="discount">−{inr(o.discount_paise)}</span></div>}
        {o.tax_paise > 0 && <div className="sum-row"><span className="muted">{s?.tax_label || 'Tax'} ({Number(o.tax_percent)}%)</span><span>{inr(o.tax_paise)}</span></div>}
        <div className="sum-row total"><span>Total</span><span>{inr(o.total_paise)}</span></div>
      </div>
      {upi && (
        <div className="card card-pad stack">
          <b>Paying by UPI?</b>
          <p className="small muted">Pay <b>{inr(o.total_paise)}</b> to <b>{s.upi_id}</b> and show the confirmation at the counter. This website can’t verify UPI payments automatically — staff confirm it.</p>
          <a className="btn btn-dark" href={upiLink}><LuSmartphone /> Open a UPI app</a>
        </div>
      )}
    </div>
  );
}

export function OrderSuccess() {
  useTitle('Order placed');
  const q = useQuery(); const no = (q.get('o') || '').toUpperCase(); const s = useSettings().data;
  const recent = useStore(recentOrders).find((r) => r.order_number === no);
  const [o, setO] = useState<any>(() => { try { return JSON.parse(sessionStorage.getItem(`cc.order.${no}`) || 'null'); } catch { return null; } });
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!no || !recent) return;
    db.rpc('track_order', { p_order_number: no, p_phone: recent.phone }).then((r) => { if (r) setO(r); else if (!o) setErr('not-found'); }).catch((e) => !o && setErr(errMsg(e)));
  }, [no]); // eslint-disable-line
  if (!no || (!recent && !o)) return <SiteLayout><div className="container section"><Empty icon={<LuReceipt />} title="Looking for your order?" text="Use your order number and phone number to see its status." action={<Link to="/track-order" className="btn btn-primary">Track an order</Link>} /></div></SiteLayout>;
  return (
    <SiteLayout>
      <div className="container section" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="success-mark"><LuCheck /></div>
          <h1 className="serif" style={{ fontSize: 'clamp(34px,5vw,48px)' }}>Order placed!</h1>
          <p className="lede" style={{ margin: '10px auto 0' }}>Thank you{o?.customer_name ? `, ${o.customer_name.split(' ')[0]}` : ''}. Keep your order number handy — we’ll call it out when it’s ready.</p>
        </div>
        {o ? <OrderCard o={o} s={s} /> : err ? <ErrorState text={err === 'not-found' ? 'We could not load this order on this device.' : err} /> : <Skel h={300} r={20} />}
        <div className="row row-wrap" style={{ justifyContent: 'center', marginTop: 26 }}>
          <Link to={`/track-order?o=${encodeURIComponent(no)}`} className="btn btn-primary btn-lg">Track order <LuArrowRight /></Link>
          <Link to="/menu" className="btn btn-outline btn-lg">Back to menu</Link>
        </div>
      </div>
    </SiteLayout>
  );
}

export function TrackPage() {
  useTitle('Track your order');
  const q = useQuery(); const s = useSettings().data; const recent = useStore(recentOrders);
  const initial = (q.get('o') || '').toUpperCase();
  const [no, setNo] = useState(initial);
  const [phone, setPhone] = useState(recent.find((r) => r.order_number === initial)?.phone || '');
  const [o, setO] = useState<any>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'notfound' | 'error'>('idle');
  const [err, setErr] = useState('');
  const [updated, setUpdated] = useState('');
  const lookup = async (n = no, p = phone, quiet = false) => {
    const num = n.trim().toUpperCase();
    if (!num || !validPhone(p)) { if (!quiet) { setState('error'); setErr('Enter your order number and the 10-digit mobile number used for the order.'); } return; }
    if (!quiet) setState('loading');
    try {
      const r = await db.rpc('track_order', { p_order_number: num, p_phone: normalizePhone(p) });
      if (!r) { if (!quiet) { setO(null); setState('notfound'); } return; }
      setO(r); setState('idle'); setUpdated(fmtTime(new Date()));
      if (!quiet) rememberOrder(r.order_number, normalizePhone(p));
    } catch (e) { if (!quiet) { setState('error'); setErr(errMsg(e)); } }
  };
  useEffect(() => { if (initial && phone) lookup(initial, phone); }, []); // eslint-disable-line
  const final = o && (o.status === 'completed' || o.status === 'cancelled');
  useInterval(() => { if (o && !final && document.visibilityState === 'visible') lookup(o.order_number, phone, true); }, o && !final ? 10000 : null);
  return (
    <SiteLayout>
      <div className="container page-head" style={{ maxWidth: 760 }}><span className="eyebrow">Order status</span><h1>Track your order</h1><p>Enter your order number and the mobile number you ordered with.</p></div>
      <div className="container stack" style={{ maxWidth: 760, paddingBottom: 60, gap: 22 }}>
        <form className="card card-pad" onSubmit={(e) => { e.preventDefault(); lookup(); }}>
          <div className="form-grid">
            <Field label="Order number" htmlFor="tr-no"><input id="tr-no" className="input" value={no} onChange={(e) => setNo(e.target.value.toUpperCase())} placeholder="CC-XXXXXX" autoComplete="off" /></Field>
            <Field label="Mobile number" htmlFor="tr-ph"><div className="input-group"><span className="addon">+91</span><input id="tr-ph" className="input" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></div></Field>
          </div>
          <div className="row row-wrap spread" style={{ marginTop: 16 }}>
            {recent.length > 0 ? <div className="row row-wrap" style={{ gap: 6 }}><span className="tiny muted">On this device:</span>{recent.slice(0, 4).map((r) => <button type="button" key={r.order_number} className="badge badge-outline" onClick={() => { setNo(r.order_number); setPhone(r.phone); lookup(r.order_number, r.phone); }}>{r.order_number}</button>)}</div> : <span />}
            <Btn variant="primary" type="submit" loading={state === 'loading'}><LuSearch /> Find my order</Btn>
          </div>
        </form>
        {state === 'notfound' && <Empty icon={<LuSearch />} title="We couldn’t find that order" text="Check the order number and use the same mobile number you placed the order with." />}
        {state === 'error' && <div className="notice notice-red"><LuCircleAlert /><span>{err}</span></div>}
        {o && state !== 'notfound' && <>
          <OrderCard o={o} s={s} live={final ? 'off' : updated} />
          {!final && <button className="link" style={{ alignSelf: 'center' }} onClick={() => lookup(o.order_number, phone)}><LuRefreshCw /> Refresh now</button>}
        </>}
      </div>
    </SiteLayout>
  );
}

// ───────── ABOUT / CONTACT / 404 ─────────
export function About() {
  useTitle('About');
  const s = useSettings().data || {}; const m = useMenu();
  const img = visibleProducts(m).find((p) => p.is_bestseller)?.image_url;
  return (
    <SiteLayout>
      <section className="section">
        <div className="container about-hero">
          <div>
            <span className="eyebrow">Our story</span>
            <h1 className="section-title" style={{ fontSize: 'clamp(40px,5.5vw,64px)', margin: '14px 0 20px' }}>Golden waffles. <em>Melting chocolate.</em> Unforgettable moments.</h1>
            <p className="lede">{s.description}</p>
            <div className="row row-wrap" style={{ marginTop: 28 }}><Link to="/menu" className="btn btn-primary btn-lg">See the menu <LuArrowRight /></Link><Link to="/contact" className="btn btn-outline btn-lg">Visit us</Link></div>
          </div>
          <Img src={img} alt="A signature waffle" />
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container why-grid">
          {[[<LuFlame key="1" />, 'Off the iron, onto your plate', 'We cook every waffle to order, so it reaches you crisp and warm.'], [<LuWheat key="2" />, 'Ingredients we’re proud of', 'Real butter, proper chocolate, fresh fruit — no shortcuts.'], [<LuChefHat key="3" />, 'Your waffle, your way', 'Mix sauces, toppings and extras until it’s exactly right.'], [<LuHeart key="4" />, 'Made with care', 'A small team that loves what it makes — and the people we make it for.']].map(([ic, t, d]: any) => <div className="why" key={t}><div className="ic">{ic}</div><h3>{t}</h3><p>{d}</p></div>)}
        </div>
      </section>
    </SiteLayout>
  );
}

export function Contact() {
  useTitle('Contact');
  const s = useSettings().data || {}; const wa = String(s.whatsapp || '').replace(/\D/g, '');
  return (
    <SiteLayout>
      <div className="container page-head"><span className="eyebrow">Say hello</span><h1>Contact &amp; visit</h1><p>Questions, big orders or just craving advice — we’re happy to help.</p></div>
      <div className="container stack" style={{ paddingBottom: 60, gap: 18 }}>
        <div className="contact-grid">
          {s.phone && <div className="card contact-card"><span className="ic"><LuPhone /></span><div><b>Call us</b><p className="muted small" style={{ margin: '4px 0 10px' }}>{s.phone}</p><a className="btn btn-dark btn-sm" href={`tel:${String(s.phone).replace(/\s/g, '')}`}>Call now</a></div></div>}
          {wa && <div className="card contact-card"><span className="ic"><LuMessageCircle /></span><div><b>WhatsApp</b><p className="muted small" style={{ margin: '4px 0 10px' }}>Fastest for questions and bulk orders</p><a className="btn btn-dark btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Message us <LuExternalLink /></a></div></div>}
          {s.address && <div className="card contact-card"><span className="ic"><LuMapPin /></span><div><b>Visit</b><p className="muted small" style={{ margin: '4px 0 10px' }}>{s.address}</p>{s.maps_url && <a className="btn btn-dark btn-sm" href={s.maps_url} target="_blank" rel="noreferrer">Get directions <LuExternalLink /></a>}</div></div>}
          {s.instagram_url && <div className="card contact-card"><span className="ic"><LuInstagram /></span><div><b>Instagram</b><p className="muted small" style={{ margin: '4px 0 10px' }}>New flavours and offers first</p><a className="btn btn-dark btn-sm" href={s.instagram_url} target="_blank" rel="noreferrer">Follow us <LuExternalLink /></a></div></div>}
        </div>
        <div className="card card-pad">
          <h2 className="card-title" style={{ marginBottom: 12 }}><LuClock style={{ width: 18, verticalAlign: '-3px' }} /> Opening hours</h2>
          <div className="kv">{(s.hours || []).map((h: any) => <Fragment key={h.day}><dt>{h.day}</dt><dd>{h.closed ? 'Closed' : `${h.open} – ${h.close}`}</dd></Fragment>)}</div>
        </div>
      </div>
    </SiteLayout>
  );
}

export function NotFound() {
  useTitle('Page not found');
  return (
    <SiteLayout>
      <div className="notfound container">
        <div className="big">404</div>
        <h1 className="serif" style={{ fontSize: 34, marginTop: 6 }}>This waffle went missing.</h1>
        <p className="lede" style={{ margin: '12px auto 28px' }}>The page you’re looking for isn’t on the menu. Let’s get you back to something delicious.</p>
        <div className="row row-wrap" style={{ justifyContent: 'center' }}><Link to="/" className="btn btn-outline btn-lg">Go home</Link><Link to="/menu" className="btn btn-primary btn-lg">Browse the menu</Link></div>
      </div>
    </SiteLayout>
  );
}
