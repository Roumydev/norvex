'use client'

import { useState, useEffect, useRef } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { formatDZD } from '../lib/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TopBar from '../components/layout/TopBar';
import EmailMenu from '../components/ui/EmailMenu';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
import { WILAYAS, normalizeCity, sortCities } from '../data/wilayas';
interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  city?: string;
  rating: number;
  properties: number;
  activeLeads: number;
  visits: number;
  closedDeals: number;
  revenue: number;
}

type Perf = { metric: string; deals: number; leads: number };

const ErrorBanner = ({ message, onClose }: { message: string; onClose?: () => void }) => (
  <div
    onClick={onClose}
    style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16, cursor: onClose ? 'pointer' : 'default' }}
  >
    {message}
  </div>
);

const deleteAgent = (id: string) => api.delete(`/agents/${id}`);

function AgentDetail({ agent, perf, onBack, onEdit, onDeleted }: { agent: Agent; perf: Perf[]; onBack: () => void; onEdit: () => void; onDeleted: () => void }) {
  const perfData = perf;
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(tr('Delete this agent? Their linked records will show as unassigned. This cannot be undone.'))) return;
    setDeleting(true);
    setError('');
    try {
      await deleteAgent(agent._id);
      onDeleted();
    } catch (err) {
      setError(apiError(err, tr('Could not delete agent.')));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr('Agent Profile')} />
      <div className="page-content">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 20 }}>{tr('← Back to Agents')}</button>

        {/* Header */}
        <div className="card" style={{ padding: 26, marginBottom: 20 }}>
          {error && <ErrorBanner message={error} onClose={() => setError('')} />}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 800 }}>{agent.name[0]}</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{agent.name}</h2>
              <div style={{ color: 'var(--muted-fg)', fontSize: 14, marginBottom: 8 }}>{tr(agent.role)} · {agent.city ? tr(normalizeCity(agent.city)) : '—'}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted-fg)' }}>
                <span>📞 {agent.phone || '—'}</span>
                <span>📧 {agent.email}</span>
                <span>⭐ {agent.rating}/5.0</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <EmailMenu email={agent.email} label={tr('Message')} />
              <button className="btn-primary" onClick={onEdit}>{tr('Edit Profile')}</button>
              <AdminOnly><button className="btn-secondary" style={{ color: 'var(--red)' }} onClick={handleDelete} disabled={deleting}>{deleting ? '...' : tr('Delete')}</button></AdminOnly>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Properties', value: agent.properties, icon: '🏠' },
            { label: 'Active Leads', value: agent.activeLeads, icon: '📊' },
            { label: 'Visits', value: agent.visits, icon: '📅' },
            { label: 'Closed Deals', value: agent.closedDeals, icon: '✅' },
            { label: 'Revenue', value: formatDZD(agent.revenue), icon: '💰' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{tr(s.label)}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>{tr('Performance Overview')}</div>
          <div dir="ltr"><ResponsiveContainer width="100%" height={200}>
            <BarChart data={perfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="metric" tickFormatter={(v: string) => tr(v)} tick={{ fill: 'var(--muted-fg)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="deals" fill="#2563EB" radius={[4,4,0,0]} name="Deals" />
              <Bar dataKey="leads" fill="#93C5FD" radius={[4,4,0,0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer></div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#2563EB' }} /> {tr('Deals Closed')}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#93C5FD' }} /> {tr('Leads Handled')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// فورم واحد للإضافة والتعديل: إذا جات initial => تعديل (PATCH)، وإلا إضافة (POST)
function AgentForm({ initial, onBack, onSaved }: { initial?: Agent; onBack: () => void; onSaved: () => void }) {
  const { t } = useApp();
  const isEdit = !!initial;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    role: initial?.role ?? 'Agent',
    city: initial?.city ? normalizeCity(initial.city) : '',
    rating: initial?.rating != null ? String(initial.rating) : '',
  });

  const handleSave = async () => {
    if (!form.name || !form.email) {
      setError(tr('Name and email are required.'));
      return;
    }
    setSaving(true);
    setError('');
    // ما نبعتوش العدّادات (properties/visits/revenue...) لأنها تتحسب في الواجهة
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = isEdit ? null : undefined;
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone || EMPTY,
      role: form.role,
      city: form.city || EMPTY,
      rating: form.rating ? Number(form.rating) : EMPTY,
    };
    try {
      if (isEdit) await api.patch(`/agents/${initial!._id}`, payload);
      else await api.post('/agents', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save agent. Email might already be in use.')));
    } finally {
      setSaving(false);
    }
  };

  const cityIsKnown = WILAYAS.some(w => w.name === form.city);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr(isEdit ? 'Edit Agent' : 'Add Agent')} />
      <div className="page-content" style={{ maxWidth: 700 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 24 }}>{tr('← Back to Agents')}</button>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{isEdit ? tr('Edit Agent') : t('addAgent')}</h2>

          {error && <ErrorBanner message={error} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label className="label">{tr('Full Name')}</label>
              <input className="input" placeholder={tr('e.g. Sarah Benali')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Email')}</label>
              <input className="input" type="email" placeholder="agent@norvex.dz" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Phone')}</label>
              <input className="input" placeholder="+213 555 123 456" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Role')}</label>
              <select className="select input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="Senior Agent">{tr('Senior Agent')}</option>
                <option value="Agent">{tr('Agent')}</option>
                <option value="Junior Agent">{tr('Junior Agent')}</option>
              </select>
            </div>
            <div>
              <label className="label">{tr('City')}</label>
              <select className="select input" value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                <option value="">{tr('Select city...')}</option>
                {!cityIsKnown && form.city && <option value={form.city}>{form.city}</option>}
                {WILAYAS.map(w => <option key={w.code} value={w.name}>{String(w.code).padStart(2, '0')} - {tr(w.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Rating (0-5)</label>
              <input className="input" type="number" step="0.1" min="0" max="5" placeholder="4.5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Save Agent')}</button>
            <button className="btn-secondary" onClick={onBack}>{tr('Cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const idOf = (x: any) => (x && typeof x === 'object' ? x._id : x);
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// الأرقام الحقيقية لكل وكيل، محسوبة من العقارات والـleads والزيارات والعقود والدفعات
function buildStats(agents: Agent[], d: { properties: any[]; leads: any[]; visits: any[]; contracts: any[]; payments: any[] }) {
  const contractAgent: Record<string, string> = {};
  d.contracts.forEach(c => { contractAgent[c._id] = idOf(c.agent); });
  const isClosed = (c: any) => c.status === 'Active' || c.status === 'Completed';

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - (5 - i), 1));
  const perf: Record<string, Perf[]> = {};

  const enriched = agents.map(a => {
    const revenue = d.payments
      .filter(p => p.status === 'Paid' && contractAgent[idOf(p.contract)] === a._id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const myContracts = d.contracts.filter(c => idOf(c.agent) === a._id && isClosed(c));
    const myLeads = d.leads.filter(l => idOf(l.agent) === a._id);

    perf[a._id] = months.map(m => {
      const inMonth = (s?: string) => { const x = s ? new Date(s) : null; return !!x && x.getFullYear() === m.getFullYear() && x.getMonth() === m.getMonth(); };
      return {
        metric: MONTHS_EN[m.getMonth()],
        deals: myContracts.filter(c => inMonth(c.startDate || c.createdAt)).length,
        leads: myLeads.filter(l => inMonth(l.createdAt)).length,
      };
    });

    return {
      ...a,
      properties: d.properties.filter(p => idOf(p.agent) === a._id).length,
      activeLeads: myLeads.filter(l => !['Won', 'Lost'].includes(l.stage)).length,
      visits: d.visits.filter(v => idOf(v.agent) === a._id).length,
      closedDeals: myContracts.length,
      revenue,
    };
  });
  return { enriched, perf };
}

export default function Agents() {
  const { t, page: appPage, selectedId, setPage: setAppPage } = useApp();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'edit'>('list');
  const [selected, setSelected] = useState<Agent | null>(null);
  const [perf, setPerf] = useState<Record<string, Perf[]>>({});
  const [actionError, setActionError] = useState('');

  const loadAgents = () => {
    setLoading(true);
    Promise.all([
      api.get('/agents'),
      api.get('/properties').catch(() => ({ data: [] })),
      api.get('/leads').catch(() => ({ data: [] })),
      api.get('/visits').catch(() => ({ data: [] })),
      api.get('/contracts').catch(() => ({ data: [] })),
      api.get('/payments').catch(() => ({ data: [] })),
    ])
      .then(([a, properties, leads, visits, contracts, payments]) => {
        const { enriched, perf: pf } = buildStats(a.data, {
          properties: properties.data, leads: leads.data, visits: visits.data,
          contracts: contracts.data, payments: payments.data,
        });
        setAgents(enriched);
        setPerf(pf);
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleDelete = async (a: Agent) => {
    if (!window.confirm(tr('Delete this agent? Their linked records will show as unassigned. This cannot be undone.'))) return;
    setActionError('');
    try {
      await deleteAgent(a._id);
      loadAgents();
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete agent.')));
    }
  };

  const backToList = () => {
    setView('list');
    setSelected(null);
    if (appPage === 'agent-detail') setAppPage('agents');
  };

  // فتح التفاصيل من البحث العام في الـTopBar
  useEffect(() => {
    if (appPage === 'agent-detail' && selectedId) {
      const found = agents.find(x => x._id === selectedId);
      if (found) { setSelected(found); setView('detail'); }
    }
  }, [appPage, selectedId, agents]); // eslint-disable-line react-hooks/exhaustive-deps

  // الضغط على "Agents" في الـsidebar يرجعنا للقائمة
  const prevAppPage = useRef(appPage);
  useEffect(() => {
    if (appPage === 'agents' && prevAppPage.current !== 'agents') { setView('list'); setSelected(null); }
    prevAppPage.current = appPage;
  }, [appPage]);

  if (view === 'detail' && selected) {
    return <AgentDetail agent={selected} perf={perf[selected._id] || []} onBack={backToList} onEdit={() => setView('edit')} onDeleted={() => { backToList(); loadAgents(); }} />;
  }
  if (view === 'edit' && selected) {
    return <AgentForm initial={selected} onBack={backToList} onSaved={() => { backToList(); loadAgents(); }} />;
  }
  if (view === 'add') return <AgentForm onBack={backToList} onSaved={() => { backToList(); loadAgents(); }} />;

  const filtered = agents.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('agents')} />
      <div className="page-content">
        {actionError && <ErrorBanner message={actionError} onClose={() => setActionError('')} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search agents...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setView('add')}>+ {t('addAgent')}</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading agents...')}</div>
        ) : (
          <>
            {/* Agent cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
              {filtered.map(a => (
                <div key={a._id} className="card" style={{ padding: 20, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onClick={() => { setSelected(a); setView('detail'); }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>{a.name[0]}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                      <div style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{tr(a.role)}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3, color: '#F59E0B' }}>⭐ {a.rating}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Properties', a.properties],
                      ['Leads', a.activeLeads],
                      ['Visits', a.visits],
                      ['Deals', a.closedDeals],
                    ].map(([l, v]) => (
                      <div key={l as string} style={{ background: 'var(--muted)', borderRadius: 7, padding: '10px 12px' }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, padding: '10px 0 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--muted-fg)' }}>{tr('Revenue')}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>{formatDZD(a.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table view */}
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>{tr('All Agents')}</div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{tr('Agent')}</th>
                      <th>{tr('Role')}</th>
                      <th>{tr('City')}</th>
                      <th>{tr('Properties')}</th>
                      <th>{tr('Active Leads')}</th>
                      <th>{tr('Visits')}</th>
                      <th>{tr('Closed Deals')}</th>
                      <th>{tr('Revenue')}</th>
                      <th>{tr('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr key={a._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>{a.name[0]}</div>
                            <div>
                              <div style={{ fontWeight: 500 }}>{a.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{tr(a.role)}</td>
                        <td style={{ fontSize: 13 }}>📍 {a.city ? tr(normalizeCity(a.city)) : '—'}</td>
                        <td style={{ fontWeight: 600 }}>{a.properties}</td>
                        <td style={{ fontWeight: 600 }}>{a.activeLeads}</td>
                        <td style={{ fontWeight: 600 }}>{a.visits}</td>
                        <td style={{ fontWeight: 600 }}>{a.closedDeals}</td>
                        <td style={{ fontWeight: 600, color: 'var(--blue)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatDZD(a.revenue)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(a); setView('detail'); }}>{tr('View')}</button>
                            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(a); setView('edit'); }}>{tr('Edit')}</button>
                            <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(a)}>{tr('Delete')}</button></AdminOnly>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}