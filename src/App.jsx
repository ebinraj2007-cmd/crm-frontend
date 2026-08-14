import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'https://crm-backend-production-5488.up.railway.app/api';
const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'https://crm-backend-production-5488.up.railway.app');

/* ============================================================
   SHARED DATA
   ============================================================ */

const SERVICES = [
  { name: 'Business Website', category: 'Digital Presence', price: 800 },
  { name: 'Google Business Profile', category: 'Digital Presence', price: 300 },
  { name: 'Local SEO', category: 'Digital Presence', price: 500 },
  { name: 'WhatsApp AI Front Desk', category: 'WhatsApp Automation', price: 1000 },
  { name: 'Appointment Reminders', category: 'WhatsApp Automation', price: 400 },
  { name: 'CRM Setup', category: 'CRM Operations', price: 600 },
  { name: 'E-Invoicing Setup', category: 'CRM Operations', price: 400 },
  { name: 'Review Automation', category: 'Reputation', price: 300 },
  { name: 'Competitor Monitoring', category: 'Reputation', price: 350 },
  { name: 'Cybersecurity Audit', category: 'Security', price: 500 }
];

const SOURCES = [
  { value: 'cold_call', label: 'Cold call' },
  { value: 'cold_mail', label: 'Cold mail' },
  { value: 'cold_message', label: 'Cold message' },
  { value: 'onsite_pitch', label: 'Onsite pitch' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' }
];

const sourceLabel = (v) => SOURCES.find(s => s.value === v)?.label || 'Other';

const COMMON_EXTRAS = [
  { label: 'Domain purchase (1 year)', amount: 60 },
  { label: 'Hosting (1 year)', amount: 350 },
  { label: 'Business email setup', amount: 200 },
  { label: 'WhatsApp API number', amount: 150 },
  { label: 'Logo / branding', amount: 400 }
];

const money = (n) => `AED ${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '—');
const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

/* ============================================================
   ROOT
   ============================================================ */

export default function CRMApp() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [page, setPage] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPage('dashboard');
  };

  if (!token) {
    return (
      <>
        <Styles />
        <LoginPage setToken={setToken} setUser={setUser} />
      </>
    );
  }

  const isAdmin = user?.role === 'admin';

  const NAV = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'operations', label: 'Operations' },
    { key: 'clients', label: 'Clients' },
    { key: 'new-client', label: 'Add Client' },
    { key: 'product', label: 'Product' },
    { key: 'invoices', label: 'Invoices' },
    ...(isAdmin ? [{ key: 'finance', label: 'Finance' }] : []),
    ...(isAdmin ? [{ key: 'team', label: 'Team' }] : [])
  ];

  return (
    <div className="app">
      <Styles />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">DS</span>
          <span className="brand-name">Digital Services CRM</span>
        </div>

        <nav className="nav">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setPage(n.key)}
              className={`nav-btn ${page === n.key ? 'active' : ''}`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="who">
          <span className="who-name">{user?.name}</span>
          <span className={`role-chip ${isAdmin ? 'admin' : ''}`}>{isAdmin ? 'admin' : 'sales rep'}</span>
          <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="main">
        {page === 'dashboard' && <DashboardPage token={token} user={user} />}
        {page === 'operations' && <OperationsPage token={token} />}
        {page === 'clients' && <ClientsPage token={token} user={user} />}
        {page === 'new-client' && <NewClientPage token={token} setPage={setPage} />}
        {page === 'product' && <ProductPage />}
        {page === 'invoices' && <InvoicesPage token={token} user={user} />}
        {page === 'finance' && isAdmin && <FinancePage token={token} />}
        {page === 'team' && isAdmin && <TeamPage token={token} />}
      </main>
    </div>
  );
}

/* ============================================================
   LOGIN
   ============================================================ */

function LoginPage({ setToken, setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const url = isRegister ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
      const body = isRegister ? form : { email: form.email, password: form.password };
      const { data } = await axios.post(url, body);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">DS</div>
        <h1>Digital Services CRM</h1>
        <p className="muted">{isRegister ? 'Create your account' : 'Sign in to continue'}</p>

        {isRegister && (
          <>
            <input placeholder="Full name" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="Phone" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </>
        )}

        <input type="email" placeholder="Email" value={form.email} autoComplete="off"
          onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Password" value={form.password} autoComplete="new-password"
          onChange={e => setForm({ ...form, password: e.target.value })} required />

        {error && <div className="alert">{error}</div>}

        <button className="btn-primary wide" disabled={loading}>
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        <button type="button" className="link" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function DashboardPage({ token, user }) {
  const [clients, setClients] = useState([]);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/clients`, auth(token));
      setClients(data || []);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    load();
    socket.on('client-created', load);
    socket.on('client-updated', load);
    socket.on('client-deleted', load);
    return () => {
      socket.off('client-created', load);
      socket.off('client-updated', load);
      socket.off('client-deleted', load);
    };
  }, [load]);

  const interested = clients.filter(c => c.interested).length;
  const demos = clients.filter(c => c.demo_requested).length;
  const highPriority = clients.filter(c => c.priority === 'high' && !c.completed).length;
  const pipeline = clients.filter(c => !c.completed).reduce((s, c) => s + (c.total_amount || 0), 0);

  const serviceStats = {};
  clients.forEach(c => (c.services || []).forEach(s => {
    if (!serviceStats[s.name]) serviceStats[s.name] = { pending: 0, in_progress: 0, completed: 0 };
    serviceStats[s.name][s.status || 'pending'] += 1;
  }));

  const dueSoon = clients
    .filter(c => c.deadline && !c.completed)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Dashboard</h2>
        <p className="muted">Welcome back, {user?.name?.split(' ')[0]}.</p>
      </div>

      <div className="stat-row">
        <Stat label="Total clients" value={clients.length} />
        <Stat label="Interested" value={interested} tone="good" />
        <Stat label="Demos requested" value={demos} tone="info" />
        <Stat label="High priority" value={highPriority} tone="warn" />
        <Stat label="Open pipeline" value={money(pipeline)} />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h3>Service status</h3></div>
          {Object.keys(serviceStats).length === 0 && <p className="muted pad">No services sold yet.</p>}
          {Object.entries(serviceStats).map(([name, s]) => (
            <div key={name} className="row-line">
              <span>{name}</span>
              <span className="chips">
                <span className="chip pending">{s.pending} pending</span>
                <span className="chip progress">{s.in_progress} in progress</span>
                <span className="chip done">{s.completed} done</span>
              </span>
            </div>
          ))}
        </section>

        <section className="card">
          <div className="card-head"><h3>Deadlines coming up</h3></div>
          {dueSoon.length === 0 && <p className="muted pad">No deadlines set.</p>}
          {dueSoon.map(c => (
            <div key={c.id} className="row-line">
              <span>{c.business_name}</span>
              <span className={`chip ${new Date(c.deadline) < new Date() ? 'danger' : 'progress'}`}>
                {fmtDate(c.deadline)}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

/* ============================================================
   OPERATIONS  — every sold service as a work item
   ============================================================ */

function OperationsPage({ token }) {
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/clients`, auth(token));
    setClients(data || []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const items = [];
  clients.forEach(c => (c.services || []).forEach((s, idx) => {
    items.push({ client: c, service: s, idx });
  }));

  const shown = filter === 'all' ? items : items.filter(i => (i.service.status || 'pending') === filter);

  const setStatus = async (client, idx, status) => {
    const services = [...(client.services || [])];
    services[idx] = { ...services[idx], status };
    await axios.put(`${API_URL}/clients/${client.id}`, { services }, auth(token));
    load();
  };

  const counts = {
    all: items.length,
    pending: items.filter(i => (i.service.status || 'pending') === 'pending').length,
    in_progress: items.filter(i => i.service.status === 'in_progress').length,
    completed: items.filter(i => i.service.status === 'completed').length
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Operations</h2>
        <p className="muted">Every service you've sold, and where it stands.</p>
      </div>

      <div className="filter-row">
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button key={f} className={`filter ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.replace('_', ' ')} <span className="count">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Value</th>
              <th>Deadline</th>
              <th style={{ width: 160 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={5} className="muted pad">Nothing here.</td></tr>
            )}
            {shown.map((i, k) => (
              <tr key={k}>
                <td className="strong">{i.client.business_name}</td>
                <td>{i.service.name}</td>
                <td>{money(i.service.price)}</td>
                <td>{fmtDate(i.client.deadline)}</td>
                <td>
                  <select
                    className={`status-select ${i.service.status || 'pending'}`}
                    value={i.service.status || 'pending'}
                    onChange={e => setStatus(i.client, i.idx, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="in_progress">in progress</option>
                    <option value="completed">completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   CLIENTS  — dense table, manual priority ordering
   ============================================================ */

function ClientsPage({ token, user }) {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const isAdmin = user?.role === 'admin';

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/clients`, auth(token));
    setClients(data || []);
  }, [token]);

  useEffect(() => {
    load();
    socket.on('client-created', load);
    socket.on('client-updated', load);
    socket.on('client-deleted', load);
    return () => {
      socket.off('client-created', load);
      socket.off('client-updated', load);
      socket.off('client-deleted', load);
    };
  }, [load]);

  const patch = async (id, fields) => {
    setClients(cs => cs.map(c => (c.id === id ? { ...c, ...fields } : c)));
    await axios.put(`${API_URL}/clients/${id}`, fields, auth(token));
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= clients.length) return;
    const next = [...clients];
    [next[index], next[target]] = [next[target], next[index]];
    setClients(next);
    await axios.post(`${API_URL}/clients/reorder`, { ids: next.map(c => c.id) }, auth(token));
  };

  const remove = async (c) => {
    if (!isAdmin) return alert('Only an admin can delete a client.');
    if (!window.confirm(`Delete ${c.business_name}? This also deletes their invoices and cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/clients/${c.id}`, auth(token));
      setOpen(null);
      load();
    } catch (err) {
      alert(err.response?.data?.msg || 'Could not delete');
    }
  };

  const term = q.trim().toLowerCase();
  const list = term
    ? clients.filter(c =>
        [c.business_name, c.contact_person, c.about, c.location, c.phone]
          .filter(Boolean).some(v => String(v).toLowerCase().includes(term)))
    : clients;

  return (
    <div className="page">
      <div className="page-head row-between">
        <div>
          <h2>Clients <span className="muted-count">{clients.length}</span></h2>
          <p className="muted">Use the arrows to push a lead up the list. Top = work on it first.</p>
        </div>
        <input className="search" placeholder="Search clients…" value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card">
        <table className="table clients-table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Rank</th>
              <th>Company</th>
              <th style={{ width: 150 }}>Source</th>
              <th>About / what they want</th>
              {isAdmin && <th style={{ width: 130 }}>Added by</th>}
              <th style={{ width: 110 }}>Added</th>
              <th style={{ width: 140 }}>Deadline</th>
              <th style={{ width: 110 }}>Priority</th>
              <th style={{ width: 70 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 8} className="muted pad">No clients yet.</td></tr>
            )}
            {list.map((c, i) => (
              <tr key={c.id} className={c.completed ? 'is-done' : ''}>
                <td>
                  <div className="rank">
                    <button className="arrow" title="Move up" disabled={!!term || i === 0}
                      onClick={() => move(i, -1)}>▲</button>
                    <span className="rank-n">{i + 1}</span>
                    <button className="arrow" title="Move down" disabled={!!term || i === list.length - 1}
                      onClick={() => move(i, 1)}>▼</button>
                  </div>
                </td>

                <td>
                  <button className="company" onClick={() => setOpen(c)}>{c.business_name}</button>
                  <div className="sub">
                    {c.contact_person || '—'}{c.phone ? ` · ${c.phone}` : ''}
                  </div>
                  <div className="flags">
                    {c.interested ? <span className="chip good">interested</span> : null}
                    {c.demo_requested ? <span className="chip info">demo</span> : null}
                    {c.completed ? <span className="chip done">completed</span> : null}
                  </div>
                </td>

                <td>
                  <select className="cell-select" value={c.source || 'cold_call'}
                    onChange={e => patch(c.id, { source: e.target.value })}>
                    {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </td>

                <td className="about">{c.about || <span className="muted">—</span>}</td>

                {isAdmin && <td className="sub">{c.users?.name || '—'}</td>}

                <td className="sub">{fmtDate(c.created_at)}</td>

                <td>
                  <input type="date" className="cell-input"
                    value={c.deadline ? String(c.deadline).slice(0, 10) : ''}
                    onChange={e => patch(c.id, { deadline: e.target.value || null })} />
                </td>

                <td>
                  <select className={`cell-select prio-${c.priority || 'low'}`} value={c.priority || 'low'}
                    onChange={e => patch(c.id, { priority: e.target.value })}>
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>
                </td>

                <td><button className="btn-ghost sm" onClick={() => setOpen(c)}>Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <ClientDrawer
          client={open}
          token={token}
          user={user}
          onClose={() => setOpen(null)}
          onSaved={() => { setOpen(null); load(); }}
          onDelete={() => remove(open)}
        />
      )}
    </div>
  );
}

function ClientDrawer({ client, token, user, onClose, onSaved, onDelete }) {
  const [c, setC] = useState(client);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  const set = (k, v) => setC({ ...c, [k]: v });

  const removeService = (idx) => {
    const s = c.services[idx];
    if (!window.confirm(`Remove "${s.name}" from this client?`)) return;
    set('services', c.services.filter((_, i) => i !== idx));
  };

  const addService = (name) => {
    if (!name) return;
    const svc = SERVICES.find(s => s.name === name);
    if (!svc) return;
    set('services', [...(c.services || []), { ...svc, status: 'pending' }]);
  };

  const servicesTotal = (c.services || []).reduce((s, x) => s + Number(x.price || 0), 0);

  const save = async () => {
    setSaving(true);
    await axios.put(`${API_URL}/clients/${c.id}`, {
      business_name: c.business_name,
      contact_person: c.contact_person,
      email: c.email,
      phone: c.phone,
      industry: c.industry,
      location: c.location,
      about: c.about,
      notes: c.notes,
      source: c.source,
      priority: c.priority,
      deadline: c.deadline || null,
      services: c.services,
      interested: !!c.interested,
      demo_requested: !!c.demo_requested,
      completed: !!c.completed,
      project_cost: Number(c.project_cost || 0)
    }, auth(token));
    setSaving(false);
    onSaved();
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>{c.business_name}</h3>
          <button className="btn-ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="drawer-body">
          <Field label="Business name">
            <input value={c.business_name || ''} onChange={e => set('business_name', e.target.value)} />
          </Field>
          <Field label="Contact person">
            <input value={c.contact_person || ''} onChange={e => set('contact_person', e.target.value)} />
          </Field>
          <div className="two">
            <Field label="Email">
              <input value={c.email || ''} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input value={c.phone || ''} onChange={e => set('phone', e.target.value)} />
            </Field>
          </div>
          <div className="two">
            <Field label="Industry">
              <input value={c.industry || ''} onChange={e => set('industry', e.target.value)} />
            </Field>
            <Field label="Location">
              <input value={c.location || ''} onChange={e => set('location', e.target.value)} />
            </Field>
          </div>

          <Field label="About the company / what they want">
            <textarea rows={3} value={c.about || ''} onChange={e => set('about', e.target.value)} />
          </Field>

          <Field label="Conversation notes">
            <textarea rows={5} value={c.notes || ''} onChange={e => set('notes', e.target.value)} />
          </Field>

          <div className="two">
            <Field label="Source">
              <select value={c.source || 'cold_call'} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={c.priority || 'low'} onChange={e => set('priority', e.target.value)}>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </Field>
          </div>

          <div className="two">
            <Field label="Deadline">
              <input type="date" value={c.deadline ? String(c.deadline).slice(0, 10) : ''}
                onChange={e => set('deadline', e.target.value)} />
            </Field>
            <Field label="Project cost (what it costs you)">
              <input type="number" value={c.project_cost || 0}
                onChange={e => set('project_cost', e.target.value)} />
            </Field>
          </div>

          <Field label={`Services — ${money(servicesTotal)}`}>
            {(c.services || []).map((s, idx) => (
              <div key={idx} className="svc-line">
                <span>{s.name}</span>
                <span className="muted">{money(s.price)}</span>
                <select value={s.status || 'pending'} onChange={e => {
                  const services = [...c.services];
                  services[idx] = { ...services[idx], status: e.target.value };
                  set('services', services);
                }}>
                  <option value="pending">pending</option>
                  <option value="in_progress">in progress</option>
                  <option value="completed">completed</option>
                </select>
                <button type="button" className="btn-ghost sm danger" title="Remove this service"
                  onClick={() => removeService(idx)}>×</button>
              </div>
            ))}
            {(c.services || []).length === 0 && <p className="muted">No services on this client yet.</p>}

            <select className="add-svc" value="" onChange={e => addService(e.target.value)}>
              <option value="">+ Add a service…</option>
              {SERVICES.filter(s => !(c.services || []).some(x => x.name === s.name))
                .map(s => <option key={s.name} value={s.name}>{s.name} — {money(s.price)}</option>)}
            </select>
            <p className="muted">Changes to services save when you hit Save changes.</p>
          </Field>

          <div className="toggles">
            <Toggle label="Interested" checked={!!c.interested} onChange={v => set('interested', v)} />
            <Toggle label="Demo requested by email" checked={!!c.demo_requested} onChange={v => set('demo_requested', v)} />
            <Toggle label="Project completed" checked={!!c.completed} onChange={v => set('completed', v)} />
          </div>
        </div>

        <div className="drawer-foot">
          {isAdmin
            ? <button className="btn-danger" onClick={onDelete}>Delete client</button>
            : <span className="muted">Only an admin can delete a client</span>}
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" className="toggle-input" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="toggle-switch" />
    </label>
  );
}

/* ============================================================
   ADD CLIENT
   ============================================================ */

function NewClientPage({ token, setPage }) {
  const [f, setF] = useState({
    businessName: '', contactPerson: '', email: '', phone: '',
    industry: '', location: '', about: '', notes: '',
    source: 'cold_call', priority: 'low', deadline: '',
    services: [], demoRequested: false, interested: false
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF({ ...f, [k]: v });

  const toggleService = (svc) => {
    const on = f.services.some(s => s.name === svc.name);
    set('services', on ? f.services.filter(s => s.name !== svc.name)
                       : [...f.services, { ...svc, status: 'pending' }]);
  };

  const total = f.services.reduce((s, x) => s + x.price, 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.businessName) return alert('Business name is required');
    setSaving(true);
    try {
      await axios.post(`${API_URL}/clients`, { ...f, deadline: f.deadline || null }, auth(token));
      setPage('clients');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.response?.data?.msg || 'failed'));
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>Add client</h2>
        <p className="muted">Log the lead while the conversation is fresh.</p>
      </div>

      <form onSubmit={submit} className="form-grid">
        <section className="card pad-card">
          <h3>Company</h3>
          <Field label="Business name *">
            <input value={f.businessName} onChange={e => set('businessName', e.target.value)} required />
          </Field>
          <div className="two">
            <Field label="Contact person"><input value={f.contactPerson} onChange={e => set('contactPerson', e.target.value)} /></Field>
            <Field label="Phone"><input value={f.phone} onChange={e => set('phone', e.target.value)} /></Field>
          </div>
          <div className="two">
            <Field label="Email"><input type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
            <Field label="Location"><input value={f.location} onChange={e => set('location', e.target.value)} /></Field>
          </div>
          <Field label="Industry">
            <select value={f.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">Select industry</option>
              <option>Salon</option><option>Clinic</option><option>Restaurant</option>
              <option>Retail</option><option>Contracting</option><option>Trading</option>
              <option>E-commerce</option><option>Other</option>
            </select>
          </Field>
          <Field label="About the company / what they want">
            <textarea rows={3} placeholder="e.g. Wholesale of fresh meat — wants an e-commerce site with online ordering"
              value={f.about} onChange={e => set('about', e.target.value)} />
          </Field>
        </section>

        <section className="card pad-card">
          <h3>How you reached them</h3>
          <div className="two">
            <Field label="Source">
              <select value={f.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={f.priority} onChange={e => set('priority', e.target.value)}>
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
            </Field>
          </div>
          <Field label="Deadline / follow-up date">
            <input type="date" value={f.deadline} onChange={e => set('deadline', e.target.value)} />
          </Field>
          <Field label="Conversation notes">
            <textarea rows={5} placeholder="What did they say? Budget, objections, who decides, when to follow up…"
              value={f.notes} onChange={e => set('notes', e.target.value)} />
          </Field>
          <div className="toggles">
            <Toggle label="Asked for a demo by email" checked={f.demoRequested} onChange={v => set('demoRequested', v)} />
            <Toggle label="Interested" checked={f.interested} onChange={v => set('interested', v)} />
          </div>
        </section>

        <section className="card pad-card span-2">
          <h3>Services discussed</h3>
          <div className="svc-grid">
            {SERVICES.map(s => {
              const on = f.services.some(x => x.name === s.name);
              return (
                <button type="button" key={s.name} className={`svc-pick ${on ? 'on' : ''}`} onClick={() => toggleService(s)}>
                  <span className="svc-name">{s.name}</span>
                  <span className="svc-cat">{s.category}</span>
                  <span className="svc-price">{money(s.price)}</span>
                </button>
              );
            })}
          </div>

          <div className="form-foot">
            <div className="total-box">
              <span className="muted">{f.services.length} selected</span>
              <strong>{money(total)}</strong>
            </div>
            <div>
              <button type="button" className="btn-ghost" onClick={() => setPage('clients')}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add client'}</button>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}

/* ============================================================
   PRODUCT — our service catalogue
   ============================================================ */

function ProductPage() {
  const cats = [...new Set(SERVICES.map(s => s.category))];
  return (
    <div className="page">
      <div className="page-head">
        <h2>Product</h2>
        <p className="muted">What we sell, and what we charge for it.</p>
      </div>

      {cats.map(cat => (
        <section className="card pad-card" key={cat}>
          <h3>{cat}</h3>
          <table className="table">
            <thead><tr><th>Service</th><th style={{ width: 160 }}>Price</th></tr></thead>
            <tbody>
              {SERVICES.filter(s => s.category === cat).map(s => (
                <tr key={s.name}>
                  <td className="strong">{s.name}</td>
                  <td className="accent-text">{money(s.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <section className="card pad-card">
        <h3>Common add-on charges</h3>
        <table className="table">
          <thead><tr><th>Item</th><th style={{ width: 160 }}>Typical cost</th></tr></thead>
          <tbody>
            {COMMON_EXTRAS.map(e => (
              <tr key={e.label}><td>{e.label}</td><td className="accent-text">{money(e.amount)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="muted">These get added as line items when you raise an invoice.</p>
      </section>
    </div>
  );
}

/* ============================================================
   INVOICES
   ============================================================ */

function InvoicesPage({ token, user }) {
  const isAdmin = user?.role === 'admin';
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState(null);

  const load = useCallback(async () => {
    const [inv, cl] = await Promise.all([
      axios.get(`${API_URL}/invoices`, auth(token)),
      axios.get(`${API_URL}/clients`, auth(token))
    ]);
    setInvoices(inv.data || []);
    setClients(cl.data || []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (inv, status) => {
    await axios.put(`${API_URL}/invoices/${inv.id}`, { status }, auth(token));
    load();
  };

  const remove = async (inv) => {
    if (!window.confirm(`Delete ${inv.invoice_number}?`)) return;
    try {
      await axios.delete(`${API_URL}/invoices/${inv.id}`, auth(token));
      load();
    } catch (err) {
      alert(err.response?.data?.msg || 'Could not delete');
    }
  };

  const outstanding = invoices.filter(i => i.status !== 'paid')
    .reduce((s, i) => s + ((i.total || 0) - (i.advance || 0)), 0);
  const collected = invoices.reduce((s, i) => s + (i.status === 'paid' ? (i.total || 0) : (i.advance || 0)), 0);

  return (
    <div className="page">
      <div className="page-head row-between">
        <div>
          <h2>Invoices <span className="muted-count">{invoices.length}</span></h2>
          <p className="muted">Services bought, add-on charges, advance paid, balance due.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>New invoice</button>
      </div>

      <div className="stat-row">
        <Stat label="Collected" value={money(collected)} tone="good" />
        <Stat label="Outstanding" value={money(outstanding)} tone="warn" />
        <Stat label="Invoices" value={invoices.length} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice</th><th>Client</th><th>Date</th>
              <th>Total</th><th>Advance</th><th>Balance</th>
              <th style={{ width: 130 }}>Status</th><th style={{ width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={8} className="muted pad">No invoices yet.</td></tr>}
            {invoices.map(i => (
              <tr key={i.id}>
                <td className="strong">{i.invoice_number}</td>
                <td>{i.clients?.business_name || '—'}</td>
                <td className="sub">{fmtDate(i.created_at)}</td>
                <td>{money(i.total)}</td>
                <td>{money(i.advance)}</td>
                <td className="accent-text">{money((i.total || 0) - (i.advance || 0))}</td>
                <td>
                  <select className={`cell-select st-${i.status}`} value={i.status}
                    onChange={e => setStatus(i, e.target.value)}>
                    <option value="unpaid">unpaid</option>
                    <option value="partial">partial</option>
                    <option value="paid">paid</option>
                  </select>
                </td>
                <td className="right">
                  <button className="btn-ghost sm" onClick={() => setView(i)}>View</button>
                  {isAdmin && <button className="btn-ghost sm danger" onClick={() => remove(i)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating && (
        <InvoiceForm
          clients={clients}
          token={token}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      )}

      {view && <InvoiceView invoice={view} onClose={() => setView(null)} />}
    </div>
  );
}

function InvoiceForm({ clients, token, onClose, onSaved }) {
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState([]);
  const [extras, setExtras] = useState([]);
  const [advance, setAdvance] = useState(0);
  const [saving, setSaving] = useState(false);

  const client = clients.find(c => c.id === clientId);

  const pickClient = (id) => {
    setClientId(id);
    const c = clients.find(x => x.id === id);
    setItems((c?.services || []).map(s => ({ label: s.name, amount: s.price })));
  };

  const addExtra = (preset) => setExtras([...extras, preset ? { ...preset } : { label: '', amount: 0 }]);
  const updExtra = (i, k, v) => setExtras(extras.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const delExtra = (i) => setExtras(extras.filter((_, idx) => idx !== i));
  const updItem = (i, k, v) => setItems(items.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)));
  const delItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const total = [...items, ...extras].reduce((s, x) => s + Number(x.amount || 0), 0);
  const balance = total - Number(advance || 0);

  const save = async () => {
    if (!clientId) return alert('Pick a client first');
    setSaving(true);
    try {
      await axios.post(`${API_URL}/invoices`, {
        clientId,
        items: items.map(i => ({ label: i.label, amount: Number(i.amount || 0) })),
        extras: extras.map(i => ({ label: i.label, amount: Number(i.amount || 0) })),
        advance: Number(advance || 0),
        total,
        status: Number(advance) >= total && total > 0 ? 'paid' : Number(advance) > 0 ? 'partial' : 'unpaid'
      }, auth(token));
      onSaved();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || 'failed'));
    }
    setSaving(false);
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer wide-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>New invoice</h3>
          <button className="btn-ghost sm" onClick={onClose}>Close</button>
        </div>

        <div className="drawer-body">
          <Field label="Client">
            <select value={clientId} onChange={e => pickClient(e.target.value)}>
              <option value="">Select a client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
          </Field>

          {client && (
            <>
              <Field label="Services bought">
                {items.length === 0 && <p className="muted">This client has no services selected.</p>}
                {items.map((it, i) => (
                  <div className="line-item" key={i}>
                    <input value={it.label} onChange={e => updItem(i, 'label', e.target.value)} />
                    <input type="number" value={it.amount} onChange={e => updItem(i, 'amount', e.target.value)} />
                    <button className="btn-ghost sm danger" onClick={() => delItem(i)}>×</button>
                  </div>
                ))}
              </Field>

              <Field label="Additional charges">
                {extras.map((it, i) => (
                  <div className="line-item" key={i}>
                    <input placeholder="e.g. Domain purchase" value={it.label}
                      onChange={e => updExtra(i, 'label', e.target.value)} />
                    <input type="number" value={it.amount} onChange={e => updExtra(i, 'amount', e.target.value)} />
                    <button className="btn-ghost sm danger" onClick={() => delExtra(i)}>×</button>
                  </div>
                ))}
                <div className="preset-row">
                  {COMMON_EXTRAS.map(p => (
                    <button key={p.label} type="button" className="preset" onClick={() => addExtra(p)}>
                      + {p.label}
                    </button>
                  ))}
                  <button type="button" className="preset" onClick={() => addExtra(null)}>+ Custom</button>
                </div>
              </Field>

              <Field label="Advance paid">
                <input type="number" value={advance} onChange={e => setAdvance(e.target.value)} />
              </Field>

              <div className="totals">
                <div><span>Total</span><strong>{money(total)}</strong></div>
                <div><span>Advance</span><strong>{money(advance)}</strong></div>
                <div className="balance"><span>Balance due</span><strong>{money(balance)}</strong></div>
              </div>
            </>
          )}
        </div>

        <div className="drawer-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving || !clientId}>
            {saving ? 'Saving…' : 'Create invoice'}
          </button>
        </div>
      </aside>
    </div>
  );
}

function InvoiceView({ invoice, onClose }) {
  const lines = [...(invoice.items || []), ...(invoice.extras || [])];
  const balance = (invoice.total || 0) - (invoice.advance || 0);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer wide-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <h3>{invoice.invoice_number}</h3>
          <button className="btn-ghost sm" onClick={onClose}>Close</button>
        </div>
        <div className="drawer-body" id="printable">
          <div className="inv-head">
            <div>
              <div className="muted">Billed to</div>
              <div className="inv-client">{invoice.clients?.business_name || '—'}</div>
              <div className="sub">{invoice.clients?.contact_person}</div>
              <div className="sub">{invoice.clients?.email}</div>
            </div>
            <div className="right">
              <div className="muted">Date</div>
              <div>{fmtDate(invoice.created_at)}</div>
              <div className={`chip ${invoice.status === 'paid' ? 'done' : invoice.status === 'partial' ? 'progress' : 'pending'}`}>
                {invoice.status}
              </div>
            </div>
          </div>

          <table className="table">
            <thead><tr><th>Description</th><th className="right" style={{ width: 140 }}>Amount</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}><td>{l.label}</td><td className="right">{money(l.amount)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div><span>Total</span><strong>{money(invoice.total)}</strong></div>
            <div><span>Advance paid</span><strong>{money(invoice.advance)}</strong></div>
            <div className="balance"><span>Balance due</span><strong>{money(balance)}</strong></div>
          </div>
        </div>
        <div className="drawer-foot">
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </aside>
    </div>
  );
}

/* ============================================================
   FINANCE (admin only)
   ============================================================ */

function FinancePage({ token }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ revenue: 0, cost: 0, profit: 0 });

  const load = useCallback(async () => {
    const { data } = await axios.get(`${API_URL}/analytics/finance`, auth(token));
    setRows(data.projects || []);
    setTotals(data.totals || { revenue: 0, cost: 0, profit: 0 });
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const setCost = async (row, cost) => {
    setRows(rs => rs.map(r => (r.id === row.id ? { ...r, cost: Number(cost) } : r)));
    await axios.put(`${API_URL}/clients/${row.id}`, { project_cost: Number(cost || 0) }, auth(token));
    load();
  };

  const margin = totals.revenue ? Math.round((totals.profit / totals.revenue) * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <h2>Finance <span className="chip admin-only">admin only</span></h2>
        <p className="muted">Completed projects only. Mark a project complete in the client drawer to bring it here.</p>
      </div>

      <div className="stat-row">
        <Stat label="Revenue" value={money(totals.revenue)} tone="info" />
        <Stat label="Cost" value={money(totals.cost)} tone="warn" />
        <Stat label="Profit" value={money(totals.profit)} tone="good" />
        <Stat label="Margin" value={`${margin}%`} />
        <Stat label="Projects done" value={rows.length} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Project</th><th>Rep</th><th>Completed</th>
              <th>Revenue</th><th style={{ width: 150 }}>Cost</th><th>Profit</th><th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted pad">No completed projects yet.</td></tr>}
            {rows.map(r => {
              const profit = (r.revenue || 0) - (r.cost || 0);
              const m = r.revenue ? Math.round((profit / r.revenue) * 100) : 0;
              return (
                <tr key={r.id}>
                  <td className="strong">{r.business_name}</td>
                  <td className="sub">{r.rep || '—'}</td>
                  <td className="sub">{fmtDate(r.updated_at || r.created_at)}</td>
                  <td>{money(r.revenue)}</td>
                  <td>
                    <input type="number" className="cell-input" value={r.cost || 0}
                      onChange={e => setCost(r, e.target.value)} />
                  </td>
                  <td className={profit >= 0 ? 'pos' : 'neg'}>{money(profit)}</td>
                  <td className={profit >= 0 ? 'pos' : 'neg'}>{m}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   TEAM (admin only)
   ============================================================ */

function TeamPage({ token }) {
  const [reps, setReps] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/analytics/all-reps`, auth(token))
      .then(({ data }) => setReps(data || []))
      .catch(() => {});
  }, [token]);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Team <span className="chip admin-only">admin only</span></h2>
        <p className="muted">Who's bringing in what.</p>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Rep</th><th>Email</th><th>Clients</th><th>Last added</th></tr></thead>
          <tbody>
            {reps.length === 0 && <tr><td colSpan={4} className="muted pad">No sales reps registered yet.</td></tr>}
            {reps.map(r => (
              <tr key={r.repId}>
                <td className="strong">{r.repName}</td>
                <td className="sub">{r.email}</td>
                <td>{r.clientCount}</td>
                <td className="sub">{fmtDate(r.lastClient)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

function Styles() {
  return (
    <style>{`
      :root{
        --bg:#121212; --surface:#1E1E1E; --surface-2:#181818;
        --line:#2A2A2A; --text:#E0E0E0; --muted:#8A8A8A; --accent:#00E5FF;
      }
      *{box-sizing:border-box}
      body{margin:0;background:var(--bg);color:var(--text);
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Roboto,sans-serif;
        -webkit-font-smoothing:antialiased}
      .app{min-height:100vh;background:var(--bg)}

      /* top bar */
      .topbar{display:flex;align-items:center;gap:24px;padding:0 22px;height:60px;
        background:var(--surface);border-bottom:1px solid var(--line);
        position:sticky;top:0;z-index:50}
      .brand{display:flex;align-items:center;gap:10px}
      .brand-mark{width:30px;height:30px;border-radius:7px;background:var(--accent);color:#04252b;
        display:grid;place-items:center;font-weight:800;font-size:12px;letter-spacing:.5px}
      .brand-name{font-weight:600;font-size:15px;white-space:nowrap}
      .nav{display:flex;gap:4px;flex:1;overflow-x:auto}
      .nav-btn{background:none;border:0;color:var(--muted);padding:8px 13px;border-radius:7px;
        font-size:14px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:.15s}
      .nav-btn:hover{color:var(--text);background:#242424}
      .nav-btn.active{color:var(--accent);background:rgba(0,229,255,.09)}
      .who{display:flex;align-items:center;gap:10px}
      .who-name{font-size:14px}
      .role-chip{font-size:11px;padding:3px 8px;border-radius:20px;background:#262626;color:var(--muted)}
      .role-chip.admin{background:rgba(0,229,255,.12);color:var(--accent)}

      .main{padding:26px 22px 60px}
      .page{max-width:1500px;margin:0 auto}
      .page-head{margin-bottom:20px}
      .page-head h2{margin:0 0 4px;font-size:22px;font-weight:600;display:flex;align-items:center;gap:10px}
      .row-between{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
      .muted{color:var(--muted);font-size:13px;margin:0}
      .muted-count{color:var(--muted);font-size:15px;font-weight:400}
      .pad{padding:18px !important}
      .right{text-align:right}
      .strong{font-weight:600}
      .sub{color:var(--muted);font-size:12.5px}
      .accent-text{color:var(--accent)}
      .pos{color:#4ADE80}.neg{color:#F87171}

      /* cards */
      .card{background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden;margin-bottom:18px}
      .pad-card{padding:18px}
      .pad-card h3{margin:0 0 14px;font-size:15px;font-weight:600}
      .card-head{padding:14px 18px;border-bottom:1px solid var(--line)}
      .card-head h3{margin:0;font-size:15px;font-weight:600}
      .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      @media(max-width:900px){.grid-2{grid-template-columns:1fr}}

      /* stats */
      .stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px}
      .stat{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px 18px}
      .stat-label{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px}
      .stat-value{font-size:24px;font-weight:600}
      .stat.good .stat-value{color:#4ADE80}
      .stat.warn .stat-value{color:#FBBF24}
      .stat.info .stat-value{color:var(--accent)}

      .row-line{display:flex;justify-content:space-between;align-items:center;
        padding:12px 18px;border-bottom:1px solid var(--line);font-size:14px}
      .row-line:last-child{border-bottom:0}
      .chips{display:flex;gap:6px}

      /* chips */
      .chip{font-size:11px;padding:3px 9px;border-radius:20px;background:#262626;color:var(--muted);white-space:nowrap}
      .chip.pending{background:rgba(248,113,113,.13);color:#F87171}
      .chip.progress{background:rgba(251,191,36,.13);color:#FBBF24}
      .chip.done{background:rgba(74,222,128,.13);color:#4ADE80}
      .chip.good{background:rgba(74,222,128,.13);color:#4ADE80}
      .chip.info{background:rgba(0,229,255,.13);color:var(--accent)}
      .chip.danger{background:rgba(248,113,113,.18);color:#F87171}
      .chip.admin-only{background:rgba(0,229,255,.1);color:var(--accent);font-weight:500}

      /* tables */
      .table{width:100%;border-collapse:collapse;font-size:13.5px}
      .table th{text-align:left;padding:11px 14px;color:var(--muted);font-weight:500;font-size:11.5px;
        text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid var(--line);background:var(--surface-2)}
      .table td{padding:11px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
      .table tbody tr:last-child td{border-bottom:0}
      .table tbody tr:hover{background:#232323}
      .clients-table td{vertical-align:top}
      .is-done{opacity:.55}
      .about{max-width:340px;color:#BDBDBD;line-height:1.45}
      .flags{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
      .company{background:none;border:0;color:var(--text);font-weight:600;font-size:13.5px;
        cursor:pointer;padding:0;font-family:inherit;text-align:left}
      .company:hover{color:var(--accent)}

      .rank{display:flex;flex-direction:column;align-items:center;gap:1px}
      .rank-n{font-size:11px;color:var(--muted)}
      .arrow{background:none;border:0;color:var(--muted);cursor:pointer;font-size:10px;padding:1px 4px;line-height:1}
      .arrow:hover:not(:disabled){color:var(--accent)}
      .arrow:disabled{opacity:.22;cursor:default}

      /* inputs */
      input,select,textarea{background:var(--surface-2);border:1px solid var(--line);color:var(--text);
        border-radius:7px;padding:9px 11px;font-family:inherit;font-size:13.5px;width:100%;outline:none}
      input:focus,select:focus,textarea:focus{border-color:var(--accent)}
      textarea{resize:vertical;line-height:1.5}
      input[type=date]{color-scheme:dark}
      select{cursor:pointer}
      .cell-select,.cell-input{padding:6px 8px;font-size:12.5px}
      .prio-high{color:#F87171;border-color:rgba(248,113,113,.4)}
      .prio-medium{color:#FBBF24}
      .prio-low{color:var(--muted)}
      .status-select.pending{color:#F87171}
      .status-select.in_progress{color:#FBBF24}
      .status-select.completed{color:#4ADE80}
      .st-paid{color:#4ADE80}.st-partial{color:#FBBF24}.st-unpaid{color:#F87171}
      .search{max-width:280px}

      .field{margin-bottom:14px}
      .field>label{display:block;color:var(--muted);font-size:12px;margin-bottom:6px}
      .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}

      /* buttons */
      .btn-primary{background:var(--accent);color:#04252b;border:0;border-radius:7px;padding:9px 16px;
        font-weight:600;font-size:13.5px;cursor:pointer;font-family:inherit}
      .btn-primary:hover{filter:brightness(1.08)}
      .btn-primary:disabled{opacity:.5;cursor:default}
      .btn-primary.wide{width:100%;padding:11px}
      .btn-ghost{background:none;border:1px solid var(--line);color:var(--text);border-radius:7px;
        padding:8px 14px;font-size:13px;cursor:pointer;font-family:inherit}
      .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
      .btn-ghost.sm{padding:5px 10px;font-size:12px;margin-left:6px}
      .btn-ghost.danger:hover{border-color:#F87171;color:#F87171}
      .btn-danger{background:none;border:1px solid rgba(248,113,113,.4);color:#F87171;
        border-radius:7px;padding:9px 16px;font-size:13.5px;cursor:pointer;font-family:inherit}
      .link{background:none;border:0;color:var(--accent);cursor:pointer;font-size:13px;font-family:inherit;margin-top:12px}

      .filter-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
      .filter{background:var(--surface);border:1px solid var(--line);color:var(--muted);
        border-radius:7px;padding:7px 13px;font-size:13px;cursor:pointer;text-transform:capitalize;font-family:inherit}
      .filter.active{border-color:var(--accent);color:var(--accent)}
      .filter .count{color:var(--muted);font-size:11px;margin-left:5px}

      /* toggles */
      .toggles{display:flex;flex-direction:column;gap:8px;margin-top:6px}
      .toggle-row{display:flex;align-items:center;justify-content:space-between;gap:12px;
        padding:11px 13px;border:1px solid var(--line);border-radius:8px;cursor:pointer;font-size:13.5px}
      .toggle-input{display:none}
      .toggle-switch{width:42px;height:24px;background:#333;border-radius:12px;position:relative;
        transition:.2s;flex-shrink:0}
      .toggle-switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;
        background:#888;border-radius:50%;transition:.2s}
      .toggle-input:checked + .toggle-switch{background:rgba(0,229,255,.25)}
      .toggle-input:checked + .toggle-switch::after{transform:translateX(18px);background:var(--accent)}

      /* add client */
      .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
      .span-2{grid-column:1 / -1}
      @media(max-width:1000px){.form-grid{grid-template-columns:1fr}}
      .svc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
      .svc-pick{background:var(--surface-2);border:1px solid var(--line);border-radius:9px;padding:13px;
        text-align:left;cursor:pointer;color:var(--text);font-family:inherit;display:flex;flex-direction:column;gap:3px}
      .svc-pick:hover{border-color:#3d3d3d}
      .svc-pick.on{border-color:var(--accent);background:rgba(0,229,255,.06)}
      .svc-name{font-size:13.5px;font-weight:600}
      .svc-cat{font-size:11px;color:var(--muted)}
      .svc-price{font-size:13px;color:var(--accent);margin-top:4px}
      .form-foot{display:flex;justify-content:space-between;align-items:center;margin-top:18px;
        padding-top:16px;border-top:1px solid var(--line);gap:12px;flex-wrap:wrap}
      .total-box{display:flex;flex-direction:column;gap:2px}
      .total-box strong{font-size:19px;color:var(--accent)}
      .form-foot .btn-ghost{margin-right:8px}

      /* drawer */
      .drawer-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:flex;justify-content:flex-end}
      .drawer{width:520px;max-width:100%;background:var(--surface);border-left:1px solid var(--line);
        display:flex;flex-direction:column;height:100vh}
      .wide-drawer{width:640px}
      .drawer-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;
        border-bottom:1px solid var(--line)}
      .drawer-head h3{margin:0;font-size:16px}
      .drawer-body{padding:20px;overflow-y:auto;flex:1}
      .drawer-foot{padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px}
      .svc-line{display:grid;grid-template-columns:1fr auto 130px auto;gap:10px;align-items:center;
        padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
      .add-svc{margin-top:10px;border-style:dashed;color:var(--accent)}
      .line-item{display:grid;grid-template-columns:1fr 120px auto;gap:8px;margin-bottom:8px}
      .preset-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
      .preset{background:var(--surface-2);border:1px dashed var(--line);color:var(--muted);
        border-radius:20px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit}
      .preset:hover{border-color:var(--accent);color:var(--accent)}
      .totals{margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
      .totals div{display:flex;justify-content:space-between;padding:6px 0;font-size:14px}
      .totals .balance{border-top:1px solid var(--line);margin-top:8px;padding-top:12px}
      .totals .balance strong{color:var(--accent);font-size:18px}
      .inv-head{display:flex;justify-content:space-between;margin-bottom:20px;gap:20px}
      .inv-client{font-size:17px;font-weight:600;margin:4px 0}

      /* login */
      .login-wrap{min-height:100vh;display:grid;place-items:center;background:var(--bg);padding:20px}
      .login-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;
        padding:34px 30px;width:100%;max-width:380px;text-align:center}
      .login-mark{width:46px;height:46px;border-radius:12px;background:var(--accent);color:#04252b;
        display:grid;place-items:center;font-weight:800;margin:0 auto 16px}
      .login-card h1{font-size:20px;margin:0 0 4px}
      .login-card p{margin-bottom:20px}
      .login-card input{margin-bottom:11px;text-align:left}
      .alert{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);color:#F87171;
        border-radius:7px;padding:9px;font-size:13px;margin-bottom:11px}

      @media print{
        .topbar,.drawer-head,.drawer-foot{display:none !important}
        .drawer-backdrop{position:static;background:#fff}
        .drawer{width:100%;border:0}
        body,.app{background:#fff;color:#000}
        .table th{background:#f3f3f3;color:#000}
        .table td,.table th{border-color:#ddd}
      }
    `}</style>
  );
}
