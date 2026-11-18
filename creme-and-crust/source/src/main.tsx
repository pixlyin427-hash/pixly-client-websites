import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import './styles.css';
import { useRoute, loadSettings, loadMenu, loadOffers, useSettings } from './lib/core';
import { CONFIGURED } from './lib/supa';
import { Toaster, AskHost } from './ui';
import { CustomizeHost } from './site/shop';
import { Home, MenuPage, CartPage, CheckoutPage, OrderSuccess, TrackPage, About, Contact, NotFound } from './site/pages';
import { AdminRoot } from './admin/shell';

const SITE: Record<string, any> = { '/': Home, '/menu': MenuPage, '/cart': CartPage, '/checkout': CheckoutPage, '/order-success': OrderSuccess, '/track-order': TrackPage, '/about': About, '/contact': Contact };

function App() {
  const { path } = useRoute();
  const s = useSettings();
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const admin = clean === '/admin' || clean.startsWith('/admin/');
  if (!CONFIGURED) return <div className="center-pad" style={{ minHeight: '100dvh' }}><div className="card card-pad" style={{ maxWidth: 460 }}><h1 className="serif" style={{ fontSize: 28 }}>Almost ready</h1><p className="muted" style={{ marginTop: 8 }}>This copy of Crème &amp; Crust isn’t connected to its database. Add the Supabase URL and publishable key in <code>config.js</code>.</p></div></div>;
  if (s.status === 'error' && !admin) return <div className="center-pad" style={{ minHeight: '100dvh' }}><div className="card card-pad" style={{ maxWidth: 460, textAlign: 'center' }}><h1 className="serif" style={{ fontSize: 28 }}>We’ll be right back</h1><p className="muted" style={{ margin: '8px 0 16px' }}>{s.error}</p><button className="btn btn-dark" onClick={() => { loadSettings(); loadMenu(); }}>Try again</button></div></div>;
  const Page = admin ? AdminRoot : SITE[clean] || NotFound;
  return <><Page /><CustomizeHost /><AskHost /><Toaster /></>;
}

function Boot() {
  useEffect(() => { if (CONFIGURED) { loadSettings(); loadMenu(); loadOffers(); } }, []);
  return <App />;
}
createRoot(document.getElementById('root')!).render(<Boot />);
