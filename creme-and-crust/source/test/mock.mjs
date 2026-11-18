// Test-only stand-in for Supabase's HTTP API that runs every request against the LOCAL Postgres
// (same schema, RLS and functions as production) using the caller's role, so UI tests exercise the real SQL.
import { execFileSync } from 'child_process';

const PG = ['-h', '/tmp', '-p', '5544', '-U', 'postgres', '-d', 'cc', '-At', '-v', 'ON_ERROR_STOP=1', '-c'];
const lit = (v) => (v === null || v === undefined ? 'NULL' : `$q${'x'}$${String(typeof v === 'object' ? JSON.stringify(v) : v)}$q${'x'}$`);
export const log = [];

function sql(query, role = 'anon', sub = '') {
  const env = { ...process.env, PGOPTIONS: `-c role=${role}${sub ? ` -c request.jwt.claim.sub=${sub}` : ''}` };
  try { return { out: execFileSync('psql', [...PG, query], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() }; }
  catch (e) {
    const err = String(e.stderr || e.message);
    const msg = (err.match(/ERROR:\s+(.*)/) || [])[1] || err;
    const hint = (err.match(/HINT:\s+(.*)/) || [])[1];
    return { error: { message: msg.trim(), hint: hint?.trim(), code: /permission denied/.test(msg) ? '42501' : 'P0001' } };
  }
}

const OPS = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
function where(params, skip = []) {
  const conds = [];
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'offset', 'or', ...skip].includes(k) || k.includes('.')) continue;
    if (v === 'not.is.null') { conds.push(`${k} is not null`); continue; }
    if (v === 'is.null') { conds.push(`${k} is null`); continue; }
    const m = v.match(/^(eq|neq|gt|gte|lt|lte|in|ilike)\.(.*)$/s); if (!m) continue;
    if (m[1] === 'in') conds.push(`${k}::text in (${m[2].replace(/^\(|\)$/g, '').split(',').map(lit).join(',')})`);
    else if (m[1] === 'ilike') conds.push(`${k}::text ilike ${lit(m[2].replace(/\*/g, '%'))}`);
    else conds.push(`${k} ${OPS[m[1]]} ${lit(m[2])}`);
  }
  const or = params.get('or');
  if (or) {
    const inner = or.replace(/^\(|\)$/g, '');
    const parts = []; let depth = 0, cur = '';
    for (const ch of inner) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch; }
    parts.push(cur);
    const ors = parts.map((p) => { const m = p.match(/^([a-z_]+)\.(eq|gte|lte|gt|lt|in|ilike)\.(.*)$/s); if (!m) return null;
      if (m[2] === 'in') return `${m[1]}::text in (${m[3].replace(/^\(|\)$/g, '').split(',').map(lit).join(',')})`;
      if (m[2] === 'ilike') return `${m[1]}::text ilike ${lit(m[3].replace(/\*/g, '%'))}`;
      return `${m[1]} ${OPS[m[2]]} ${lit(m[3])}`; }).filter(Boolean);
    if (ors.length) conds.push(`(${ors.join(' or ')})`);
  }
  return conds.length ? `where ${conds.join(' and ')}` : '';
}
const orderBy = (params) => { const o = params.get('order'); if (!o) return ''; return 'order by ' + o.split(',').map((x) => { const [c, d] = x.split('.'); return `${c} ${d === 'desc' ? 'desc' : 'asc'}`; }).join(', '); };

const ORDER_EMBED = `, 'order_items', coalesce((select json_agg(to_jsonb(i) || jsonb_build_object('order_item_options', coalesce((select json_agg(x) from order_item_options x where x.order_item_id = i.id), '[]')) order by i.position) from order_items i where i.order_id = t.id), '[]')`;
function selectSql(table, params, range) {
  const sel = params.get('select') || '*';
  const limit = params.get('limit') ? `limit ${parseInt(params.get('limit'))}` : range ? `limit ${range[1] - range[0] + 1} offset ${range[0]}` : '';
  let row = 'to_jsonb(t)';
  if (table === 'orders' && sel.includes('order_items')) {
    row = `to_jsonb(t) || jsonb_build_object('_' , 1 ${ORDER_EMBED}`;
    if (sel.includes('order_status_history')) row += `, 'order_status_history', coalesce((select json_agg(h order by h.created_at) from order_status_history h where h.order_id = t.id), '[]')`;
    if (sel.includes('receipts')) row += `, 'receipts', coalesce((select json_agg(r order by r.created_at desc) from receipts r where r.order_id = t.id), '[]')`;
    row += ')';
  }
  if (table === 'inventory_transactions' && sel.includes('orders(')) row = `to_jsonb(t) || jsonb_build_object('orders', (select jsonb_build_object('order_number', o.order_number) from orders o where o.id = t.order_id))`;
  return `select coalesce(json_agg(r), '[]') from (select ${row} r from ${table} t ${where(params)} ${orderBy(params)} ${limit}) z`;
}

const VOID = new Set(['set_staff_active']); const SETOF = new Set(['sales_by_day']);
export function handle(method, url, headers, body) {
  const u = new URL(url); const p = u.pathname; const params = u.searchParams;
  const tok = (headers['authorization'] || '').replace('Bearer ', '');
  const sub = tok.startsWith('test.') ? tok.slice(5) : '';
  const role = sub ? 'authenticated' : 'anon';
  const json = (status, data) => ({ status, body: JSON.stringify(data), contentType: 'application/json' });
  log.push(`${method} ${p}${u.search ? '?' + decodeURIComponent(u.search.slice(1)).slice(0, 80) : ''}`);

  if (p === '/auth/v1/token') {
    const b = JSON.parse(body || '{}');
    if (params.get('grant_type') === 'password') {
      const r = sql(`select id from auth.users where email = ${lit(String(b.email).toLowerCase())} and encrypted_password = extensions.crypt(${lit(b.password)}, encrypted_password)`, 'postgres');
      if (!r.out) return json(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      return json(200, { access_token: 'test.' + r.out, refresh_token: 'r.' + r.out, expires_in: 3600, user: { id: r.out, email: b.email } });
    }
    const id = String(b.refresh_token || '').slice(2);
    return json(200, { access_token: 'test.' + id, refresh_token: 'r.' + id, expires_in: 3600, user: { id } });
  }
  if (p === '/auth/v1/logout') return { status: 204, body: '' };
  if (p === '/auth/v1/user') {
    const b = JSON.parse(body || '{}');
    if (b.password) sql(`update auth.users set encrypted_password = extensions.crypt(${lit(b.password)}, extensions.gen_salt('bf')) where id = ${lit(sub)}`, 'postgres');
    return json(200, { id: sub });
  }
  if (p.startsWith('/storage/v1/object/')) return json(200, { Key: p });

  const m = p.match(/^\/rest\/v1\/(rpc\/)?([a-z_]+)$/);
  if (!m) return json(404, { message: 'not found' });
  const [, isRpc, name] = m;
  let r;
  if (isRpc) {
    const args = JSON.parse(body || '{}');
    const call = `${name}(${Object.entries(args).map(([k, v]) => `${k} => ${lit(v)}`).join(', ')})`;
    r = sql(VOID.has(name) ? `select ${call}` : SETOF.has(name) ? `select coalesce(json_agg(t), '[]') from ${call} t` : `select coalesce(to_json(${call})::text, 'null')`, role, sub);
    if (r.error) return json(400, r.error);
    return { status: 200, body: VOID.has(name) ? '' : r.out, contentType: 'application/json' };
  }
  if (method === 'GET') {
    const range = headers['range'] ? headers['range'].split('-').map(Number) : null;
    r = sql(selectSql(name, params, range), role, sub);
  } else if (method === 'PATCH') {
    const b = JSON.parse(body); const cols = Object.keys(b);
    if (cols.length > 1) r = sql(`with u as (update ${name} t set (${cols.join(',')}) = (select ${cols.join(',')} from json_populate_record(null::${name}, ${lit(b)}::json)) ${where(params)} returning t.*) select coalesce(json_agg(u), '[]') from u`, role, sub);
    else r = sql(`with u as (update ${name} t set ${cols[0]} = (select ${cols[0]} from json_populate_record(null::${name}, ${lit(b)}::json)) ${where(params)} returning t.*) select coalesce(json_agg(u), '[]') from u`, role, sub);
  } else if (method === 'POST') {
    const rows = Array.isArray(JSON.parse(body)) ? JSON.parse(body) : [JSON.parse(body)];
    const cols = Object.keys(rows[0] || {});
    r = sql(`with i as (insert into ${name} (${cols.join(',')}) select ${cols.join(',')} from json_populate_recordset(null::${name}, ${lit(rows)}::json) returning *) select coalesce(json_agg(i), '[]') from i`, role, sub);
  } else if (method === 'DELETE') {
    r = sql(`with d as (delete from ${name} ${where(params)} returning 1) select count(*) from d`, role, sub);
    if (!r.error) return { status: 204, body: '' };
  }
  if (r.error) return json(r.error.code === '42501' ? 403 : 400, r.error);
  return { status: 200, body: r.out || '[]', contentType: 'application/json' };
}
