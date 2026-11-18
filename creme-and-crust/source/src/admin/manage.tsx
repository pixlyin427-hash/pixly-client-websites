import { Fragment, useEffect, useMemo, useState } from 'react';
import { LuPlus, LuPencil, LuCopy, LuTrash2, LuUpload, LuArrowUp, LuArrowDown, LuPackage, LuHistory, LuTicket, LuCircleAlert, LuInfo, LuTag, LuBoxes } from 'react-icons/lu';
import { useMenu, loadMenu, inr, toPaise, rupees, errMsg, toast, confirmAction, ask, slugify, fmtDateTime, fmtDate, useTitle, isOwner, useAuth } from '../lib/core';
import { db, uploadImage } from '../lib/supa';
import { Btn, Drawer, Modal, Empty, Skel, Field, Toggle, Seg, SearchInput, Img, useDebounced } from '../ui';

const ownerOnly = (fn: () => any) => () => { if (!isOwner()) { toast.error('Only the owner can change this.'); return; } return fn(); };

// ════════ PRODUCTS ════════
export function ProductsPage() {
  useTitle('Products');
  const [tab, setTab] = useState('products');
  return (
    <div>
      <div className="toolbar"><Seg label="Section" value={tab} onChange={setTab} options={[{ value: 'products', label: 'Products', icon: <LuPackage /> }, { value: 'addons', label: 'Add-ons & options', icon: <LuTag /> }]} /></div>
      {tab === 'products' ? <ProductList /> : <AddonsManager />}
    </div>
  );
}

function ProductList() {
  const m = useMenu(); const owner = useAuth().profile?.role === 'owner';
  const [search, setSearch] = useState(''); const [cat, setCat] = useState('all');
  const [edit, setEdit] = useState<any | null>(null);
  const dq = useDebounced(search.trim().toLowerCase(), 150);
  const list = m.products.filter((p) => (cat === 'all' || p.category_id === cat) && (!dq || p.name.toLowerCase().includes(dq)));
  const toggleAvail = async (p: any, v: boolean) => {
    try { await db.update('products', `id=eq.${p.id}`, { is_available: v }); toast.success(`${p.name} is now ${v ? 'available' : 'hidden as sold out'}`); loadMenu(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const dup = async (p: any) => { try { await db.rpc('duplicate_product', { p_id: p.id }); toast.success(`${p.name} duplicated (hidden until you enable it)`); loadMenu(); } catch (e) { toast.error(errMsg(e)); } };
  const del = async (p: any) => {
    if (!(await confirmAction(`Delete ${p.name}?`, 'It disappears from the menu. Past orders keep their own copy of the name and price.', 'Delete product', 'danger'))) return;
    try { await db.remove('products', `id=eq.${p.id}`); toast.success(`${p.name} deleted`); loadMenu(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products" />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{m.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        {owner && <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={() => setEdit({})}><LuPlus /> Add product</Btn>}
      </div>
      <div className="card table-wrap">
        {m.status === 'loading' ? <div style={{ padding: 16 }}><Skel h={300} /></div> : list.length === 0 ? <Empty icon={<LuPackage />} title="No products found" text="Try another search, or add your first product." /> : (
          <table className="tbl">
            <thead><tr><th>Product</th><th className="hide-sm">Category</th><th className="right">Price</th><th>Available</th><th /></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><div className="row"><Img className="thumb" src={p.image_url} alt={p.name} /><div><b>{p.name}</b><div className="row" style={{ gap: 4, marginTop: 3 }}>{p.is_bestseller && <span className="badge badge-caramel" style={{ height: 20 }}>Bestseller</span>}{p.is_new && <span className="badge badge-berry" style={{ height: 20 }}>New</span>}{p.is_customizable && m.links.some((l) => l.product_id === p.id) && <span className="badge" style={{ height: 20 }}>Customisable</span>}</div></div></div></td>
                  <td className="hide-sm">{m.categories.find((c) => c.id === p.category_id)?.name}</td>
                  <td className="right num"><b>{inr(p.price_paise)}</b></td>
                  <td><Toggle label={`${p.name} available`} checked={p.is_available} disabled={!owner} onChange={(v) => toggleAvail(p, v)} /></td>
                  <td><div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                    {owner && <><button className="icon-btn icon-btn-sm" aria-label="Edit" title="Edit" onClick={() => setEdit(p)}><LuPencil /></button>
                      <button className="icon-btn icon-btn-sm" aria-label="Duplicate" title="Duplicate" onClick={() => dup(p)}><LuCopy /></button>
                      <button className="icon-btn icon-btn-sm" aria-label="Delete" title="Delete" onClick={() => del(p)} style={{ color: 'var(--red)' }}><LuTrash2 /></button></>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {edit && <ProductEditor product={edit} onClose={() => setEdit(null)} />}
    </>
  );
}

function ProductEditor({ product, onClose }: { product: any; onClose: () => void }) {
  const m = useMenu(); const isNew = !product.id;
  const [f, setF] = useState({
    name: product.name || '', description: product.description || '', price: product.id ? rupees(product.price_paise) : '', category_id: product.category_id || m.categories[0]?.id || '',
    image_url: product.image_url || '', is_available: product.is_available ?? true, is_bestseller: !!product.is_bestseller, is_new: !!product.is_new, is_customizable: product.is_customizable ?? true,
  });
  const [groups, setGroups] = useState<string[]>(m.links.filter((l) => l.product_id === product.id).map((l) => l.group_id));
  const [recipe, setRecipe] = useState<{ item_id: string; quantity: string }[]>([]);
  const [inv, setInv] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false);
  useEffect(() => {
    db.select('inventory_items', 'select=id,name,unit&order=name.asc').then(setInv).catch(() => {});
    if (product.id) db.select('product_ingredients', `select=*&product_id=eq.${product.id}`).then((r) => setRecipe(r.map((x: any) => ({ item_id: x.item_id, quantity: String(x.quantity) })))).catch(() => {});
  }, [product.id]);
  const set = (k: string, v: any) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const upload = async (file?: File) => { if (!file) return; setUploading(true); try { set('image_url', await uploadImage(file)); toast.success('Image uploaded'); } catch (e) { toast.error(errMsg(e)); } finally { setUploading(false); } };
  const save = async () => {
    const er: Record<string, string> = {}; const price = toPaise(f.price);
    if (!f.name.trim()) er.name = 'Name is required.';
    if (!Number.isFinite(price) || price < 0) er.price = 'Enter a valid price (₹0 or more, up to 2 decimals).';
    if (price > 10000000) er.price = 'That price looks too high.';
    if (!f.category_id) er.category_id = 'Choose a category.';
    if (f.image_url && !/^https:\/\//.test(f.image_url)) er.image_url = 'Image link must start with https://';
    const rec = recipe.filter((r) => r.item_id);
    if (rec.some((r) => !(Number(r.quantity) > 0))) er.recipe = 'Each ingredient needs a quantity above 0.';
    setErrors(er); if (Object.keys(er).length) return;
    setBusy(true);
    const row = { name: f.name.trim(), description: f.description.trim(), price_paise: price, category_id: f.category_id, image_url: f.image_url.trim() || null, is_available: f.is_available, is_bestseller: f.is_bestseller, is_new: f.is_new, is_customizable: f.is_customizable };
    try {
      const saved = isNew ? (await db.insert('products', row))[0] : (await db.update('products', `id=eq.${product.id}`, row))[0];
      await db.remove('product_option_groups', `product_id=eq.${saved.id}`);
      if (groups.length) await db.insert('product_option_groups', groups.map((g) => ({ product_id: saved.id, group_id: g })));
      await db.remove('product_ingredients', `product_id=eq.${saved.id}`);
      const uniq = Array.from(new Map(rec.map((r) => [r.item_id, r])).values());
      if (uniq.length) await db.insert('product_ingredients', uniq.map((r) => ({ product_id: saved.id, item_id: r.item_id, quantity: Number(r.quantity) })));
      toast.success(isNew ? `${row.name} added to the menu` : `${row.name} saved`);
      await loadMenu(); onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Drawer open onClose={onClose} title={isNew ? 'Add product' : `Edit ${product.name}`} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={save} style={{ marginLeft: 'auto' }}>{isNew ? 'Add product' : 'Save changes'}</Btn></>}>
      <div className="od-sec stack">
        <Field label="Name" htmlFor="p-name" error={errors.name}><input id="p-name" className="input" maxLength={80} value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Description" htmlFor="p-desc" hint={`${f.description.length}/400`}><textarea id="p-desc" className="textarea" maxLength={400} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <div className="form-grid">
          <Field label="Price" htmlFor="p-price" error={errors.price}><div className="input-group"><span className="addon">₹</span><input id="p-price" className="input" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="149" /></div></Field>
          <Field label="Category" htmlFor="p-cat" error={errors.category_id}><select id="p-cat" className="select" value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>{m.categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_active ? '' : ' (hidden)'}</option>)}</select></Field>
        </div>
      </div>
      <div className="od-sec stack">
        <h4 style={{ margin: 0 }}>Image</h4>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Img className="thumb" src={f.image_url} alt={f.name || 'Product'} style={{ width: 92, height: 92, borderRadius: 14 }} />
          <div className="grow stack" style={{ gap: 8 }}>
            <label className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start' }}>{uploading ? <span className="spinner" /> : <LuUpload />} Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={(e) => upload(e.target.files?.[0])} /></label>
            <Field htmlFor="p-img" error={errors.image_url} hint="Or paste an https:// image link"><input id="p-img" className="input" value={f.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="https://…" /></Field>
          </div>
        </div>
      </div>
      <div className="od-sec">
        {([['is_available', 'Available to order', 'Off = shown as “Sold out today”'], ['is_bestseller', 'Bestseller badge', 'Shown on the homepage bestsellers'], ['is_new', 'New badge', ''], ['is_customizable', 'Customisable', 'Customers can choose add-ons']] as const).map(([k, l, h]) => (
          <div className="toggle-row" key={k}><div><b className="small">{l}</b>{h && <div className="tiny muted">{h}</div>}</div><Toggle label={l} checked={(f as any)[k]} onChange={(v) => set(k, v)} /></div>
        ))}
      </div>
      {f.is_customizable && <div className="od-sec stack">
        <h4 style={{ margin: 0 }}>Add-on groups for this product</h4>
        <p className="tiny muted">Prices for each option are managed in “Add-ons &amp; options”.</p>
        {m.groups.map((g) => (
          <label key={g.id} className="row" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={groups.includes(g.id)} onChange={(e) => setGroups(e.target.checked ? [...groups, g.id] : groups.filter((x) => x !== g.id))} style={{ width: 18, height: 18, accentColor: 'var(--espresso)' }} />
            <span className="grow"><b className="small">{g.name}</b> <span className="tiny muted">{m.options.filter((o) => o.group_id === g.id && o.is_active).map((o) => `${o.name} ${o.price_paise ? '+' + inr(o.price_paise) : ''}`).join(' · ')}</span></span>
          </label>
        ))}
      </div>}
      <div className="od-sec stack">
        <h4 style={{ margin: 0 }}>Recipe (for stock tracking)</h4>
        <p className="tiny muted">Stock is deducted once, when an order containing this product is marked Completed.</p>
        {recipe.map((r, i) => (
          <div key={i} className="row">
            <select className="select grow" value={r.item_id} aria-label="Ingredient" onChange={(e) => setRecipe(recipe.map((x, j) => (j === i ? { ...x, item_id: e.target.value } : x)))}><option value="">Choose ingredient…</option>{inv.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}</select>
            <input className="input" style={{ width: 110 }} inputMode="decimal" value={r.quantity} aria-label="Quantity" onChange={(e) => setRecipe(recipe.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} />
            <button className="icon-btn icon-btn-sm" aria-label="Remove ingredient" onClick={() => setRecipe(recipe.filter((_, j) => j !== i))}><LuTrash2 /></button>
          </div>
        ))}
        {errors.recipe && <span className="small" style={{ color: 'var(--red)' }}>{errors.recipe}</span>}
        <Btn variant="soft" size="sm" style={{ alignSelf: 'flex-start' }} onClick={() => setRecipe([...recipe, { item_id: '', quantity: '1' }])}><LuPlus /> Add ingredient</Btn>
      </div>
    </Drawer>
  );
}

function AddonsManager() {
  const m = useMenu(); const owner = useAuth().profile?.role === 'owner';
  const [editG, setEditG] = useState<any | null>(null);
  const saveOption = async (o: any, patch: any) => { try { await db.update('options', `id=eq.${o.id}`, patch); loadMenu(); } catch (e) { toast.error(errMsg(e)); } };
  const addOption = async (g: any) => {
    const r = await ask({ title: `New option in ${g.name}`, input: { label: 'Name', required: true, placeholder: 'e.g. Hazelnut crunch' }, actions: [{ label: 'Add option', value: 'ok' }] });
    if (r.value !== 'ok') return;
    try { await db.insert('options', { group_id: g.id, name: r.text.slice(0, 50), price_paise: 2000, sort_order: 99 }); toast.success('Option added — set its price below'); loadMenu(); } catch (e) { toast.error(errMsg(e)); }
  };
  const delOption = async (o: any) => { if (!(await confirmAction(`Delete “${o.name}”?`, 'Past orders keep their own record of this add-on.', 'Delete', 'danger'))) return; try { await db.remove('options', `id=eq.${o.id}`); loadMenu(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="notice notice-info"><LuInfo /><span>Option prices apply to every product that offers the group. Choose which products offer which groups when editing a product.</span></div>
      {owner && <Btn variant="primary" style={{ alignSelf: 'flex-start' }} onClick={() => setEditG({})}><LuPlus /> New add-on group</Btn>}
      {m.groups.map((g) => (
        <div key={g.id} className="card">
          <div className="card-head"><h3>{g.name} <span className="tiny muted" style={{ fontWeight: 400 }}>· {g.selection === 'single' ? 'choose one' : g.max_select ? `up to ${g.max_select}` : 'any number'}{g.required ? ' · required' : ''} · used by {m.links.filter((l) => l.group_id === g.id).length} products</span></h3>
            {owner && <div className="row" style={{ gap: 6 }}><Btn size="sm" variant="soft" onClick={() => setEditG(g)}><LuPencil /> Rules</Btn><Btn size="sm" variant="soft" onClick={() => addOption(g)}><LuPlus /> Option</Btn></div>}</div>
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Option</th><th>Price</th><th>Active</th><th /></tr></thead><tbody>
            {m.options.filter((o) => o.group_id === g.id).map((o) => <OptionRow key={o.id} o={o} owner={owner} onSave={saveOption} onDelete={delOption} />)}
          </tbody></table></div>
        </div>
      ))}
      {editG && <GroupEditor g={editG} onClose={() => setEditG(null)} />}
    </div>
  );
}
function OptionRow({ o, owner, onSave, onDelete }: any) {
  const [name, setName] = useState(o.name); const [price, setPrice] = useState(rupees(o.price_paise));
  const dirty = name.trim() !== o.name || toPaise(price) !== o.price_paise;
  const save = () => { const p = toPaise(price); if (!name.trim() || !Number.isFinite(p) || p < 0) { toast.error('Enter a name and a valid price.'); return; } onSave(o, { name: name.trim(), price_paise: p }).then(() => toast.success(`${name.trim()} saved`)); };
  return (
    <tr>
      <td><input className="input" style={{ minHeight: 38 }} value={name} disabled={!owner} maxLength={50} onChange={(e) => setName(e.target.value)} aria-label="Option name" /></td>
      <td style={{ width: 150 }}><div className="input-group"><span className="addon">₹</span><input className="input" style={{ minHeight: 38 }} inputMode="decimal" value={price} disabled={!owner} onChange={(e) => setPrice(e.target.value)} aria-label="Option price" /></div></td>
      <td><Toggle label={`${o.name} active`} checked={o.is_active} disabled={!owner} onChange={(v) => onSave(o, { is_active: v })} /></td>
      <td><div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>{owner && dirty && <Btn size="sm" variant="primary" onClick={save}>Save</Btn>}{owner && <button className="icon-btn icon-btn-sm" style={{ color: 'var(--red)' }} aria-label="Delete option" onClick={() => onDelete(o)}><LuTrash2 /></button>}</div></td>
    </tr>
  );
}
function GroupEditor({ g, onClose }: { g: any; onClose: () => void }) {
  const [f, setF] = useState({ name: g.name || '', selection: g.selection || 'multi', max_select: String(g.max_select ?? 0), required: !!g.required });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!f.name.trim()) { toast.error('Give the group a name.'); return; }
    const row = { name: f.name.trim(), selection: f.selection, max_select: f.selection === 'single' ? 1 : Math.max(0, Math.min(20, parseInt(f.max_select) || 0)), required: f.required };
    setBusy(true);
    try { g.id ? await db.update('option_groups', `id=eq.${g.id}`, row) : await db.insert('option_groups', { ...row, sort_order: 50 }); toast.success('Add-on group saved'); await loadMenu(); onClose(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const del = async () => { if (!(await confirmAction(`Delete ${g.name}?`, 'All its options are removed from every product. Past orders are not affected.', 'Delete group', 'danger'))) return; try { await db.remove('option_groups', `id=eq.${g.id}`); await loadMenu(); onClose(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <Modal open title={g.id ? `Edit ${g.name}` : 'New add-on group'} onClose={onClose} footer={<>{g.id && <Btn variant="danger-soft" onClick={del} style={{ marginRight: 'auto' }}>Delete</Btn>}<Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={save}>Save</Btn></>}>
      <div className="stack">
        <Field label="Group name" htmlFor="g-name"><input id="g-name" className="input" maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Sauces" /></Field>
        <Field label="Customers can choose"><Seg value={f.selection} onChange={(v) => setF({ ...f, selection: v })} options={[{ value: 'multi', label: 'Several' }, { value: 'single', label: 'Only one' }]} /></Field>
        {f.selection === 'multi' && <Field label="Maximum choices" hint="0 = no limit" htmlFor="g-max"><input id="g-max" className="input" inputMode="numeric" value={f.max_select} onChange={(e) => setF({ ...f, max_select: e.target.value.replace(/\D/g, '') })} style={{ maxWidth: 140 }} /></Field>}
        <div className="toggle-row"><div><b className="small">Required</b><div className="tiny muted">Customers must pick at least one</div></div><Toggle label="Required" checked={f.required} onChange={(v) => setF({ ...f, required: v })} /></div>
      </div>
    </Modal>
  );
}

// ════════ CATEGORIES ════════
export function CategoriesPage() {
  useTitle('Categories');
  const m = useMenu(); const owner = useAuth().profile?.role === 'owner';
  const [edit, setEdit] = useState<any | null>(null);
  const [del, setDel] = useState<any | null>(null);
  const cats = m.categories;
  const move = async (i: number, dir: number) => {
    const a = cats[i], b = cats[i + dir]; if (!a || !b) return;
    try { await Promise.all([db.update('categories', `id=eq.${a.id}`, { sort_order: b.sort_order === a.sort_order ? b.sort_order + dir : b.sort_order }), db.update('categories', `id=eq.${b.id}`, { sort_order: a.sort_order })]); loadMenu(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const toggle = async (c: any, v: boolean) => { try { await db.update('categories', `id=eq.${c.id}`, { is_active: v }); toast.success(`${c.name} ${v ? 'shown on' : 'hidden from'} the menu`); loadMenu(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <div className="toolbar"><p className="muted small">Order here is the order customers see. Hidden categories hide their products too.</p>{owner && <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={() => setEdit({})}><LuPlus /> Add category</Btn>}</div>
      <div className="card">
        {m.status === 'loading' ? <div style={{ padding: 16 }}><Skel h={300} /></div> : cats.map((c, i) => {
          const n = m.products.filter((p) => p.category_id === c.id).length;
          return (
            <div key={c.id} className="list-card">
              <div className="stack" style={{ gap: 0 }}>
                <button className="icon-btn icon-btn-sm" aria-label="Move up" disabled={!owner || i === 0} onClick={() => move(i, -1)}><LuArrowUp /></button>
                <button className="icon-btn icon-btn-sm" aria-label="Move down" disabled={!owner || i === cats.length - 1} onClick={() => move(i, 1)}><LuArrowDown /></button>
              </div>
              <div className="grow"><b>{c.name}</b>{!c.is_active && <span className="badge" style={{ marginLeft: 8, height: 22 }}>Hidden</span>}<div className="small muted">{n} product{n === 1 ? '' : 's'}{c.description ? ` · ${c.description}` : ''}</div></div>
              <Toggle label={`Show ${c.name}`} checked={c.is_active} disabled={!owner} onChange={(v) => toggle(c, v)} />
              {owner && <><button className="icon-btn icon-btn-sm" aria-label="Edit" onClick={() => setEdit(c)}><LuPencil /></button><button className="icon-btn icon-btn-sm" aria-label="Delete" style={{ color: 'var(--red)' }} onClick={() => setDel(c)}><LuTrash2 /></button></>}
            </div>
          );
        })}
      </div>
      {edit && <CategoryEditor c={edit} onClose={() => setEdit(null)} />}
      {del && <CategoryDelete c={del} onClose={() => setDel(null)} />}
    </div>
  );
}
function CategoryEditor({ c, onClose }: { c: any; onClose: () => void }) {
  const m = useMenu();
  const [name, setName] = useState(c.name || ''); const [desc, setDesc] = useState(c.description || ''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!name.trim()) { toast.error('Enter a category name.'); return; }
    setBusy(true);
    try {
      if (c.id) await db.update('categories', `id=eq.${c.id}`, { name: name.trim(), description: desc.trim() });
      else { let slug = slugify(name); if (m.categories.some((x) => x.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`; await db.insert('categories', { name: name.trim(), description: desc.trim(), slug, sort_order: Math.max(0, ...m.categories.map((x) => x.sort_order)) + 1 }); }
      toast.success('Category saved'); await loadMenu(); onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open size="narrow" title={c.id ? 'Edit category' : 'New category'} onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={save}>Save</Btn></>}>
      <div className="stack">
        <Field label="Name" htmlFor="c-name"><input id="c-name" className="input" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Short description" htmlFor="c-desc"><input id="c-desc" className="input" maxLength={80} value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
function CategoryDelete({ c, onClose }: { c: any; onClose: () => void }) {
  const m = useMenu(); const n = m.products.filter((p) => p.category_id === c.id).length;
  const others = m.categories.filter((x) => x.id !== c.id);
  const [target, setTarget] = useState(others[0]?.id || ''); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { const r = await db.rpc('delete_category', { p_id: c.id, p_move_to: n ? target : null }); toast.success(`${c.name} deleted${r?.moved ? ` · ${r.moved} product(s) moved` : ''}`); await loadMenu(); onClose(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open size="narrow" title={`Delete ${c.name}?`} onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="danger" loading={busy} disabled={n > 0 && !target} onClick={go}>Delete category</Btn></>}>
      {n > 0 ? <div className="stack"><div className="notice"><LuCircleAlert /><span>This category has <b>{n} product{n === 1 ? '' : 's'}</b>. Choose where to move them before deleting.</span></div>
        <Field label="Move products to" htmlFor="c-move"><select id="c-move" className="select" value={target} onChange={(e) => setTarget(e.target.value)}>{others.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field></div>
        : <p className="muted">This category is empty, so nothing else changes.</p>}
    </Modal>
  );
}

// ════════ INVENTORY ════════
export function InventoryPage() {
  useTitle('Inventory');
  const owner = useAuth().profile?.role === 'owner';
  const [items, setItems] = useState<any[] | null>(null); const [err, setErr] = useState('');
  const [search, setSearch] = useState(''); const [filter, setFilter] = useState('all');
  const [adjust, setAdjust] = useState<any | null>(null); const [hist, setHist] = useState<any | null>(null); const [edit, setEdit] = useState<any | null>(null);
  const load = () => db.select('inventory_items', 'select=*&order=name.asc').then(setItems).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);
  const low = (i: any) => Number(i.quantity) <= Number(i.low_threshold);
  const list = (items || []).filter((i) => (filter === 'all' || (filter === 'low' && low(i))) && i.name.toLowerCase().includes(search.trim().toLowerCase()));
  const value = (items || []).reduce((s, i) => s + (i.unit_cost_paise || 0) * Number(i.quantity), 0);
  return (
    <div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))', marginBottom: 18 }}>
        <div className="card kpi"><span className="k-label"><LuBoxes /> Items tracked</span><span className="k-value">{items ? items.length : '—'}</span></div>
        <div className="card kpi"><span className="k-label"><LuCircleAlert /> Low stock</span><span className="k-value" style={{ color: items?.some(low) ? 'var(--red)' : undefined }}>{items ? items.filter(low).length : '—'}</span></div>
        <div className="card kpi"><span className="k-label"><LuPackage /> Stock value</span><span className="k-value">{items ? inr(Math.round(value)) : '—'}</span><span className="k-sub">from unit costs</span></div>
      </div>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ingredients" />
        <Seg label="Filter" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All' }, { value: 'low', label: 'Low stock' }]} />
        {owner && <Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={() => setEdit({})}><LuPlus /> Add item</Btn>}
      </div>
      <div className="notice notice-info" style={{ marginBottom: 16 }}><LuInfo /><span>Stock is deducted automatically, once, when an order is marked <b>Completed</b> — using each product’s recipe. Cancelled orders never deduct stock.</span></div>
      <div className="card table-wrap">
        {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load inventory" text={err} /> : !items ? <div style={{ padding: 16 }}><Skel h={300} /></div> : list.length === 0 ? <Empty icon={<LuBoxes />} title={filter === 'low' ? 'Nothing is running low' : 'No items found'} text={filter === 'low' ? 'Every item is above its low-stock level.' : 'Add your first ingredient to start tracking.'} /> : (
          <table className="tbl">
            <thead><tr><th>Item</th><th className="right">In stock</th><th className="hide-sm right">Low at</th><th>Status</th><th className="hide-sm">Updated</th><th /></tr></thead>
            <tbody>{list.map((i) => (
              <tr key={i.id}>
                <td><b>{i.name}</b>{i.unit_cost_paise ? <div className="tiny muted">{inr(i.unit_cost_paise)} / {i.unit}</div> : null}</td>
                <td className="right num"><b>{Number(i.quantity)}</b> <span className="muted small">{i.unit}</span></td>
                <td className="hide-sm right num muted">{Number(i.low_threshold)} {i.unit}</td>
                <td>{Number(i.quantity) <= 0 ? <span className="badge badge-red">Out</span> : low(i) ? <span className="badge badge-warn">Low</span> : <span className="badge badge-ok">OK</span>}</td>
                <td className="hide-sm small muted">{fmtDateTime(i.updated_at)}</td>
                <td><div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                  <Btn size="sm" variant="soft" onClick={() => setAdjust(i)}>Adjust</Btn>
                  <button className="icon-btn icon-btn-sm" aria-label="History" title="History" onClick={() => setHist(i)}><LuHistory /></button>
                  {owner && <button className="icon-btn icon-btn-sm" aria-label="Edit" title="Edit" onClick={() => setEdit(i)}><LuPencil /></button>}
                </div></td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
      {adjust && <AdjustStock item={adjust} onClose={() => setAdjust(null)} onDone={load} />}
      {hist && <StockHistory item={hist} onClose={() => setHist(null)} />}
      {edit && <ItemEditor item={edit} onClose={() => setEdit(null)} onDone={load} />}
    </div>
  );
}
function AdjustStock({ item, onClose, onDone }: any) {
  const [mode, setMode] = useState('add'); const [amount, setAmount] = useState(''); const [reason, setReason] = useState('usage'); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const amt = Number(amount); const ok = amount !== '' && Number.isFinite(amt) && amt >= 0 && (mode === 'set' || amt > 0);
  const after = mode === 'add' ? Number(item.quantity) + amt : mode === 'remove' ? Number(item.quantity) - amt : amt;
  const go = async () => {
    setBusy(true);
    try { await db.rpc('adjust_inventory', { p_item_id: item.id, p_mode: mode, p_amount: amt, p_reason: reason, p_note: note }); toast.success(`${item.name}: now ${after} ${item.unit}`); onDone(); onClose(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open size="narrow" title={`Adjust ${item.name}`} onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} disabled={!ok || after < 0} onClick={go}>Save</Btn></>}>
      <div className="stack">
        <Seg value={mode} onChange={setMode} options={[{ value: 'add', label: 'Add stock' }, { value: 'remove', label: 'Use / waste' }, { value: 'set', label: 'Set count' }]} />
        <Field label={mode === 'set' ? `Counted quantity (${item.unit})` : `Amount (${item.unit})`} htmlFor="adj-amt"><input id="adj-amt" className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} autoFocus /></Field>
        {mode === 'remove' && <Seg value={reason} onChange={setReason} options={[{ value: 'usage', label: 'Used' }, { value: 'waste', label: 'Wasted / spoiled' }]} />}
        <Field label="Note (optional)" htmlFor="adj-note"><input id="adj-note" className="input" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Supplier delivery" /></Field>
        <p className="small muted">Current: <b>{Number(item.quantity)} {item.unit}</b>{ok && <> → after: <b style={{ color: after < 0 ? 'var(--red)' : undefined }}>{Math.round(after * 100) / 100} {item.unit}</b></>}</p>
        {after < 0 && <span className="small" style={{ color: 'var(--red)' }}>You can’t remove more than what’s in stock.</span>}
      </div>
    </Modal>
  );
}
function StockHistory({ item, onClose }: any) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => { db.select('inventory_transactions', `select=*,orders(order_number)&item_id=eq.${item.id}&order=created_at.desc&limit=100`).then(setRows).catch(() => setRows([])); }, [item.id]);
  const label: Record<string, string> = { restock: 'Restocked', usage: 'Used', waste: 'Wasted', count: 'Stock count', order: 'Order completed', demo_restore: 'Demo reset' };
  return (
    <Drawer open onClose={onClose} title={`${item.name} — history`}>
      {!rows ? <Skel h={300} /> : rows.length === 0 ? <Empty icon={<LuHistory />} title="No changes yet" text="Adjustments and order deductions will show here." /> :
        <div className="card">{rows.map((r) => <div key={r.id} className="list-card"><div className="grow"><b className="small">{label[r.reason] || r.reason}{r.orders?.order_number ? ` · ${r.orders.order_number}` : ''}</b><div className="tiny muted">{fmtDateTime(r.created_at)}{r.note ? ` · ${r.note}` : ''}</div></div><span className="num" style={{ fontWeight: 700, color: Number(r.change) < 0 ? 'var(--red)' : 'var(--ok)' }}>{Number(r.change) > 0 ? '+' : ''}{Number(r.change)}</span><span className="tiny muted num" style={{ minWidth: 70, textAlign: 'right' }}>→ {Number(r.quantity_after)} {item.unit}</span></div>)}</div>}
    </Drawer>
  );
}
function ItemEditor({ item, onClose, onDone }: any) {
  const [f, setF] = useState({ name: item.name || '', unit: item.unit || 'pcs', low_threshold: item.id ? String(Number(item.low_threshold)) : '', unit_cost: item.unit_cost_paise != null ? rupees(item.unit_cost_paise) : '', quantity: '' });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const thr = Number(f.low_threshold || 0); const cost = f.unit_cost.trim() ? toPaise(f.unit_cost) : null; const qty = Number(f.quantity || 0);
    if (!f.name.trim() || !f.unit.trim() || !(thr >= 0) || (cost != null && !(cost >= 0)) || !(qty >= 0)) { toast.error('Check the values — numbers must be 0 or more.'); return; }
    setBusy(true);
    try {
      const row: any = { name: f.name.trim(), unit: f.unit.trim().slice(0, 12), low_threshold: thr, unit_cost_paise: cost };
      if (item.id) await db.update('inventory_items', `id=eq.${item.id}`, row); else await db.insert('inventory_items', { ...row, quantity: qty });
      toast.success('Item saved'); onDone(); onClose();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const del = async () => { if (!(await confirmAction(`Delete ${item.name}?`, 'Its history and recipe links are removed too.', 'Delete item', 'danger'))) return; try { await db.remove('inventory_items', `id=eq.${item.id}`); onDone(); onClose(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <Modal open size="narrow" title={item.id ? `Edit ${item.name}` : 'New inventory item'} onClose={onClose} footer={<>{item.id && <Btn variant="danger-soft" style={{ marginRight: 'auto' }} onClick={del}>Delete</Btn>}<Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={save}>Save</Btn></>}>
      <div className="stack">
        <Field label="Name" htmlFor="i-name"><input id="i-name" className="input" maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="Unit" htmlFor="i-unit"><input id="i-unit" className="input" maxLength={12} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} placeholder="kg, pcs, litres" /></Field>
          <Field label="Low-stock level" htmlFor="i-thr"><input id="i-thr" className="input" inputMode="decimal" value={f.low_threshold} onChange={(e) => setF({ ...f, low_threshold: e.target.value })} /></Field>
          <Field label="Unit cost (optional)" htmlFor="i-cost"><div className="input-group"><span className="addon">₹</span><input id="i-cost" className="input" inputMode="decimal" value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value })} /></div></Field>
          {!item.id && <Field label="Starting quantity" htmlFor="i-qty"><input id="i-qty" className="input" inputMode="decimal" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} /></Field>}
        </div>
      </div>
    </Modal>
  );
}

// ════════ OFFERS & COUPONS ════════
const couponState = (c: any) => {
  const now = Date.now();
  if (!c.is_active) return ['Inactive', 'badge'];
  if (c.expires_at && +new Date(c.expires_at) <= now) return ['Expired', 'badge badge-red'];
  if (c.starts_at && +new Date(c.starts_at) > now) return ['Scheduled', 'badge badge-info'];
  if (c.usage_limit && c.used_count >= c.usage_limit) return ['Limit reached', 'badge badge-warn'];
  return ['Active', 'badge badge-ok'];
};
export function OffersPage() {
  useTitle('Offers');
  const [rows, setRows] = useState<any[] | null>(null); const [err, setErr] = useState(''); const [edit, setEdit] = useState<any | null>(null);
  const load = () => db.select('coupons', 'select=*&order=created_at.desc').then(setRows).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);
  const toggle = async (c: any, v: boolean) => { try { await db.update('coupons', `id=eq.${c.id}`, { is_active: v }); toast.success(`${c.code} ${v ? 'activated' : 'deactivated'}`); load(); } catch (e) { toast.error(errMsg(e)); } };
  const del = async (c: any) => { if (!(await confirmAction(`Delete ${c.code}?`, 'Only unused coupons can be deleted. Used ones can be deactivated instead.', 'Delete', 'danger'))) return; try { await db.remove('coupons', `id=eq.${c.id}`); load(); } catch (e) { toast.error(errMsg(e)); } };
  return (
    <div>
      <div className="toolbar"><p className="muted small">Coupons marked “Show on website” appear in the homepage offers section and in the cart.</p><Btn variant="primary" style={{ marginLeft: 'auto' }} onClick={() => setEdit({})}><LuPlus /> Create offer</Btn></div>
      {err ? <Empty icon={<LuCircleAlert />} title="Couldn’t load offers" text={err} /> : !rows ? <Skel h={200} /> : rows.length === 0 ? <Empty icon={<LuTicket />} title="No offers yet" text="Create a coupon code to reward customers." action={<Btn variant="primary" onClick={() => setEdit({})}>Create offer</Btn>} /> : (
        <div className="cards-grid">
          {rows.map((c) => {
            const [label, cls] = couponState(c);
            return (
              <div key={c.id} className="card coupon-card">
                <div className="row spread"><span className="coupon-code">{c.code}</span><span className={cls}>{label}</span></div>
                <b>{c.title || '—'}</b>
                <span className="small muted">{c.discount_type === 'percent' ? `${c.discount_value}% off${c.max_discount_paise ? ` (max ${inr(c.max_discount_paise)})` : ''}` : `${inr(c.discount_value)} off`}{c.min_order_paise ? ` · min order ${inr(c.min_order_paise)}` : ''}</span>
                <span className="tiny muted">{c.starts_at ? `From ${fmtDate(c.starts_at)} ` : ''}{c.expires_at ? `Until ${fmtDate(c.expires_at)}` : 'No expiry'}{c.show_on_site ? ' · shown on website' : ''}{c.is_demo ? ' · demo' : ''}</span>
                <div className="stack" style={{ gap: 4 }}><span className="tiny muted">Used {c.used_count}{c.usage_limit ? ` of ${c.usage_limit}` : ' times'}</span>{c.usage_limit ? <div className="usage"><div style={{ width: `${Math.min(100, (c.used_count / c.usage_limit) * 100)}%` }} /></div> : null}</div>
                <div className="row spread" style={{ marginTop: 6 }}><Toggle label={`${c.code} active`} checked={c.is_active} onChange={(v) => toggle(c, v)} /><div className="row" style={{ gap: 2 }}><button className="icon-btn icon-btn-sm" aria-label="Edit" onClick={() => setEdit(c)}><LuPencil /></button>{c.used_count === 0 && <button className="icon-btn icon-btn-sm" aria-label="Delete" style={{ color: 'var(--red)' }} onClick={() => del(c)}><LuTrash2 /></button>}</div></div>
              </div>
            );
          })}
        </div>
      )}
      {edit && <CouponEditor c={edit} onClose={() => setEdit(null)} onDone={load} />}
    </div>
  );
}
const toLocalInput = (d?: string | null) => { if (!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
function CouponEditor({ c, onClose, onDone }: any) {
  const [f, setF] = useState({ code: c.code || '', title: c.title || '', description: c.description || '', type: c.discount_type || 'percent', value: c.discount_type === 'fixed' ? rupees(c.discount_value) : c.discount_value ? String(c.discount_value) : '', max: c.max_discount_paise ? rupees(c.max_discount_paise) : '', min: c.min_order_paise ? rupees(c.min_order_paise) : '', starts: toLocalInput(c.starts_at), expires: toLocalInput(c.expires_at), limit: c.usage_limit ? String(c.usage_limit) : '', active: c.is_active ?? true, site: !!c.show_on_site });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => { setF((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const save = async () => {
    const er: Record<string, string> = {}; const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) er.code = '3–20 letters, numbers, - or _.';
    const value = f.type === 'percent' ? Number(f.value) : toPaise(f.value);
    if (f.type === 'percent' && !(Number.isInteger(value) && value >= 1 && value <= 100)) er.value = 'Whole number from 1 to 100.';
    if (f.type === 'fixed' && !(value > 0)) er.value = 'Enter an amount above ₹0.';
    const max = f.max.trim() ? toPaise(f.max) : null; if (max != null && !(max > 0)) er.max = 'Enter an amount above ₹0 or leave empty.';
    const min = f.min.trim() ? toPaise(f.min) : 0; if (!(min >= 0)) er.min = 'Enter a valid amount.';
    const limit = f.limit.trim() ? parseInt(f.limit) : null; if (limit != null && !(limit > 0)) er.limit = 'Whole number above 0, or empty for unlimited.';
    if (f.starts && f.expires && new Date(f.expires) <= new Date(f.starts)) er.expires = 'Must be after the start date.';
    setErrors(er); if (Object.keys(er).length) return;
    const row = { code, title: f.title.trim(), description: f.description.trim(), discount_type: f.type, discount_value: value, max_discount_paise: f.type === 'percent' ? max : null, min_order_paise: min, starts_at: f.starts ? new Date(f.starts).toISOString() : null, expires_at: f.expires ? new Date(f.expires).toISOString() : null, usage_limit: limit, is_active: f.active, show_on_site: f.site };
    setBusy(true);
    try { c.id ? await db.update('coupons', `id=eq.${c.id}`, row) : await db.insert('coupons', row); toast.success(`${code} saved`); onDone(); onClose(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open title={c.id ? `Edit ${c.code}` : 'Create offer'} onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={busy} onClick={save}>Save offer</Btn></>}>
      <div className="stack">
        <div className="form-grid">
          <Field label="Coupon code" htmlFor="cp-code" error={errors.code}><input id="cp-code" className="input mono" value={f.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WAFFLE10" /></Field>
          <Field label="Headline" htmlFor="cp-title" hint="Shown on the website"><input id="cp-title" className="input" maxLength={60} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Double the happiness." /></Field>
          <Field label="Description" htmlFor="cp-desc" className="full"><input id="cp-desc" className="input" maxLength={140} value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Discount type" className="full"><Seg value={f.type} onChange={(v) => set('type', v)} options={[{ value: 'percent', label: 'Percentage' }, { value: 'fixed', label: 'Fixed amount' }]} /></Field>
          <Field label={f.type === 'percent' ? 'Discount %' : 'Discount amount'} htmlFor="cp-val" error={errors.value}><div className="input-group"><span className="addon">{f.type === 'percent' ? '%' : '₹'}</span><input id="cp-val" className="input" inputMode="decimal" value={f.value} onChange={(e) => set('value', e.target.value)} /></div></Field>
          {f.type === 'percent' ? <Field label="Max discount (optional)" htmlFor="cp-max" error={errors.max}><div className="input-group"><span className="addon">₹</span><input id="cp-max" className="input" inputMode="decimal" value={f.max} onChange={(e) => set('max', e.target.value)} /></div></Field> : <span />}
          <Field label="Minimum order" htmlFor="cp-min" error={errors.min}><div className="input-group"><span className="addon">₹</span><input id="cp-min" className="input" inputMode="decimal" value={f.min} onChange={(e) => set('min', e.target.value)} placeholder="0" /></div></Field>
          <Field label="Usage limit" htmlFor="cp-lim" error={errors.limit} hint="Empty = unlimited"><input id="cp-lim" className="input" inputMode="numeric" value={f.limit} onChange={(e) => set('limit', e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Starts (optional)" htmlFor="cp-start"><input id="cp-start" type="datetime-local" className="input" value={f.starts} onChange={(e) => set('starts', e.target.value)} /></Field>
          <Field label="Expires (optional)" htmlFor="cp-exp" error={errors.expires}><input id="cp-exp" type="datetime-local" className="input" value={f.expires} onChange={(e) => set('expires', e.target.value)} /></Field>
        </div>
        <div><div className="toggle-row"><b className="small">Active</b><Toggle label="Active" checked={f.active} onChange={(v) => set('active', v)} /></div><div className="toggle-row"><div><b className="small">Show on website</b><div className="tiny muted">Appears in the homepage offers section</div></div><Toggle label="Show on website" checked={f.site} onChange={(v) => set('site', v)} /></div></div>
      </div>
    </Modal>
  );
}
export { Fragment, useMemo };
