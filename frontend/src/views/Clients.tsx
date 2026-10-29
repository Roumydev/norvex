'use client'

import { useState, useEffect, useRef } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { statusColors, formatFullDZD } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import EmailMenu from '../components/ui/EmailMenu';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
import { WILAYAS, normalizeCity } from '../data/wilayas';

const CLIENT_TYPES = ['Apartment', 'Villa', 'Office', 'Commercial', 'Land'];

interface Agent {
  _id: string;
  name: string;
}

interface Client {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  interestedIn?: string;
  budget?: number;
  preferredCity?: string;
  agent?: Agent;
  status: string;
  createdAt?: string;
}

const Badge = ({ status }: { status: string }) => {
  const style = statusColors[status] || 'background:var(--muted);color:var(--fg)';
  const obj = Object.fromEntries(style.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())));
  return <span className="badge" style={obj}>{tr(status)}</span>;
};

const ErrorBanner = ({ message, onClose }: { message: string; onClose?: () => void }) => (
  <div
    onClick={onClose}
    style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16, cursor: onClose ? 'pointer' : 'default' }}
  >
    {message}
  </div>
);

const deleteClient = (id: string) => api.delete(`/clients/${id}`);

interface Activity { _id: string; client?: { _id: string }; property?: { title?: string }; status?: string; date?: string; time?: string; createdAt?: string; type?: string; startDate?: string; stage?: string; phone?: string; email?: string; name?: string }

// الـleads ما فيهاش ربط مباشر بالعميل (client)، فنقارنو بالهاتف (آخر 9 أرقام) أو الإيميل
const phoneKey = (p?: string) => (p || '').replace(/\D/g, '').slice(-9);
const sameContact = (l: Activity, c: Client) =>
  (!!phoneKey(l.phone) && phoneKey(l.phone) === phoneKey(c.phone)) ||
  (!!l.email && !!c.email && l.email.toLowerCase() === c.email.toLowerCase());

interface TimelineItem { icon: string; text: string; date: string; sort: number }
const fmtDate = (s?: string) => (s ? s.slice(0, 10) : '');
const sortOf = (s?: string) => { const t = s ? new Date(s).getTime() : 0; return isNaN(t) ? 0 : t; };


function ClientDetail({ client, onBack, onEdit, onDeleted }: { client: Client; onBack: () => void; onEdit: () => void; onDeleted: () => void }) {
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [visits, setVisits] = useState<Activity[]>([]);
  const [contracts, setContracts] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Activity[]>([]);
  const [actLoading, setActLoading] = useState(true);
  const [actError, setActError] = useState('');

  useEffect(() => {
    setActLoading(true);
    setActError('');
    Promise.all([api.get('/visits'), api.get('/contracts'), api.get('/leads')])
      .then(([v, c, l]) => {
        setVisits((v.data as Activity[]).filter(x => x.client?._id === client._id));
        setContracts((c.data as Activity[]).filter(x => x.client?._id === client._id));
        setLeads((l.data as Activity[]).filter(x => sameContact(x, client)));
      })
      .catch(err => setActError(apiError(err, tr('Could not load client activity.'))))
      .finally(() => setActLoading(false));
  }, [client._id]);

  const timeline: TimelineItem[] = [
    ...(client.createdAt ? [{ icon: '📋', text: tr('Client added'), date: fmtDate(client.createdAt), sort: sortOf(client.createdAt) }] : []),
    ...visits.map(v => ({
      icon: '📅',
      text: `${tr('Visit')} · ${v.property?.title || tr('Unknown')} · ${tr(v.status || '')}`,
      date: `${fmtDate(v.date)}${v.time ? ' ' + v.time : ''}`,
      sort: sortOf(v.date),
    })),
    ...contracts.map(c => ({
      icon: '📄',
      text: `${tr('Contract')} · ${tr(c.type || '')} · ${c.property?.title || tr('Unknown')} · ${tr(c.status || '')}`,
      date: fmtDate(c.startDate || c.createdAt),
      sort: sortOf(c.startDate || c.createdAt),
    })),
    ...leads.map(l => ({
      icon: '🎯',
      text: `${tr('Lead')} · ${tr(l.stage || '')}`,
      date: fmtDate(l.createdAt),
      sort: sortOf(l.createdAt),
    })),
  ].sort((a, b) => b.sort - a.sort).slice(0, 10);

  const handleDelete = async () => {
    if (!window.confirm(tr('Delete this client? This cannot be undone.'))) return;
    setDeleting(true);
    setError('');
    try {
      await deleteClient(client._id);
      onDeleted();
    } catch (err) {
      setError(apiError(err, tr('Could not delete client.')));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr('Client Profile')} />
      <div className="page-content">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 20 }}>{tr('← Back to Clients')}</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div className="card" style={{ padding: 24 }}>
              {error && <ErrorBanner message={error} onClose={() => setError('')} />}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700 }}>{client.name[0]}</div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{client.name}</h2>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Badge status={client.status} />
                    <span style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{tr('Client since {d}', { d: client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '—' })}</span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <EmailMenu email={client.email} label={tr('📧 Email')} />
                  <button className="btn-secondary" disabled={!client.phone} onClick={() => { window.location.href = `tel:${client.phone.replace(/\s/g, '')}`; }}>{tr('📞 Call')}</button>
                  <button className="btn-primary" onClick={onEdit}>{tr('Edit')}</button>
                  <AdminOnly><button className="btn-secondary" style={{ color: 'var(--red)' }} onClick={handleDelete} disabled={deleting}>{deleting ? '...' : tr('Delete')}</button></AdminOnly>
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 14 }}>{tr('Contact Information')}</div>
                {[['Phone', client.phone], ['Email', client.email || '—']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13.5 }}>
                    <span style={{ color: 'var(--muted-fg)' }}>{tr(l)}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 14 }}>{tr('Preferences')}</div>
                {[
                  ['Interested In', client.interestedIn || '—'],
                  ['Budget', client.budget ? formatFullDZD(client.budget) : '—'],
                  ['Preferred City', client.preferredCity ? tr(normalizeCity(client.preferredCity)) : '—'],
                  ['Assigned Agent', client.agent?.name || tr('Unassigned')],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                    <span style={{ color: 'var(--muted-fg)' }}>{tr(l)}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>{tr('Activity Timeline')}</div>
              {actError && <ErrorBanner message={actError} />}
              {actLoading ? (
                <div style={{ color: 'var(--muted-fg)', fontSize: 13 }}>…</div>
              ) : timeline.length === 0 ? (
                <div style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{tr('No activity yet.')}</div>
              ) : (
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{ position: 'absolute', left: 8, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
                {timeline.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 20, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: -20, width: 18, height: 18, borderRadius: '50%', background: 'var(--card)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{item.icon}</div>
                    <div style={{ paddingLeft: 4 }}>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{item.text}</div>
                      <div style={{ color: 'var(--muted-fg)', fontSize: 12, marginTop: 2 }}>{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>

          {/* Sidebar stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[['Visits', actLoading ? '…' : String(visits.length)], ['Leads', actLoading ? '…' : String(leads.length)], ['Contracts', actLoading ? '…' : String(contracts.length)]].map(([l, v]) => (
              <div key={l} className="card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted-fg)', fontSize: 13.5 }}>{tr(l)}</span>
                <span style={{ fontWeight: 700, fontSize: 20 }}>{v}</span>
              </div>
            ))}
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 12 }}>{tr('Budget Range')}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>{client.budget ? formatFullDZD(client.budget) : '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{tr('Maximum budget')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// فورم واحد للإضافة والتعديل: إذا جات initial => تعديل (PATCH)، وإلا إضافة (POST)
function ClientForm({ initial, onBack, onSaved }: { initial?: Client; onBack: () => void; onSaved: () => void }) {
  const { t } = useApp();
  const isEdit = !!initial;
  const [agents, setAgents] = useState<Agent[]>([]);
  const { isAdmin, agentId } = useApp(); // الوكيل: الحقل مقفول على ملفو
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? '',
    interestedIn: initial?.interestedIn ?? '',
    budget: initial?.budget != null ? String(initial.budget) : '',
    preferredCity: initial?.preferredCity ? normalizeCity(initial.preferredCity) : '',
    agent: initial?.agent?._id ?? (isAdmin ? '' : agentId ?? ''),
    status: initial?.status ?? 'Active',
  });

  useEffect(() => {
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      setError(tr('Name and phone are required.'));
      return;
    }
    setSaving(true);
    setError('');
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = isEdit ? null : undefined;
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email || EMPTY,
      interestedIn: form.interestedIn || EMPTY,
      budget: form.budget ? Number(form.budget) : EMPTY,
      preferredCity: form.preferredCity || EMPTY,
      agent: form.agent || EMPTY,
      status: form.status,
    };
    try {
      if (isEdit) await api.patch(`/clients/${initial!._id}`, payload);
      else await api.post('/clients', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save client. Please check the fields and try again.')));
    } finally {
      setSaving(false);
    }
  };

  const cityIsKnown = WILAYAS.some(w => w.name === form.preferredCity);
  const typeIsKnown = CLIENT_TYPES.includes(form.interestedIn);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr(isEdit ? 'Edit Client' : 'Add Client')} />
      <div className="page-content" style={{ maxWidth: 700 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 24 }}>{tr('← Back to Clients')}</button>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{isEdit ? tr('Edit Client') : t('addClient')}</h2>

          {error && <ErrorBanner message={error} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label className="label">{tr('Full Name')}</label>
              <input className="input" placeholder={tr('e.g. Yacine Bouaziz')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Phone')}</label>
              <input className="input" placeholder="+213 555 123 456" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Email')}</label>
              <input className="input" type="email" placeholder="client@email.dz" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Interested In')}</label>
              <select className="select input" value={form.interestedIn} onChange={e => setForm({...form, interestedIn: e.target.value})}>
                <option value="">{tr('Select type...')}</option>
                {!typeIsKnown && form.interestedIn && <option value={form.interestedIn}>{form.interestedIn}</option>}
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{tr(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Budget (DZD)</label>
              <input className="input" type="number" placeholder={tr('e.g. 15000000')} value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Preferred City')}</label>
              <select className="select input" value={form.preferredCity} onChange={e => setForm({...form, preferredCity: e.target.value})}>
                <option value="">{tr('Select city...')}</option>
                {!cityIsKnown && form.preferredCity && <option value={form.preferredCity}>{form.preferredCity}</option>}
                {WILAYAS.map(w => <option key={w.code} value={w.name}>{String(w.code).padStart(2, '0')} - {tr(w.name)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{tr('Assigned Agent')}</label>
              <select className="select input" value={form.agent} disabled={!isAdmin} onChange={e => setForm({...form, agent: e.target.value})}>
                <option value="">{tr('Select agent...')}</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{tr('Status')}</label>
              <select className="select input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="Active">{tr('Active')}</option>
                <option value="Inactive">{tr('Inactive')}</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Save Client')}</button>
            <button className="btn-secondary" onClick={onBack}>{tr('Cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { t, page: appPage, selectedId, setPage: setAppPage } = useApp();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'edit'>('list');
  const [selected, setSelected] = useState<Client | null>(null);
  const [actionError, setActionError] = useState('');

  const loadClients = () => {
    setLoading(true);
    api.get('/clients')
      .then(res => setClients(res.data))
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleDelete = async (c: Client) => {
    if (!window.confirm(tr('Delete this client? This cannot be undone.'))) return;
    setActionError('');
    try {
      await deleteClient(c._id);
      loadClients();
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete client.')));
    }
  };

  const backToList = () => {
    setView('list');
    setSelected(null);
    if (appPage === 'client-detail') setAppPage('clients');
  };

  // فتح التفاصيل من البحث العام في الـTopBar
  useEffect(() => {
    if (appPage === 'client-detail' && selectedId) {
      const found = clients.find(x => x._id === selectedId);
      if (found) { setSelected(found); setView('detail'); }
    }
  }, [appPage, selectedId, clients]); // eslint-disable-line react-hooks/exhaustive-deps

  // الضغط على "Clients" في الـsidebar يرجعنا للقائمة
  const prevAppPage = useRef(appPage);
  useEffect(() => {
    if (appPage === 'clients' && prevAppPage.current !== 'clients') { setView('list'); setSelected(null); }
    prevAppPage.current = appPage;
  }, [appPage]);

  if (view === 'detail' && selected) {
    return <ClientDetail client={selected} onBack={backToList} onEdit={() => setView('edit')} onDeleted={() => { backToList(); loadClients(); }} />;
  }
  if (view === 'edit' && selected) {
    return <ClientForm initial={selected} onBack={backToList} onSaved={() => { backToList(); loadClients(); }} />;
  }
  if (view === 'add') return <ClientForm onBack={backToList} onSaved={() => { backToList(); loadClients(); }} />;

  const filtered = clients.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false;
    return !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('clients')} />
      <div className="page-content">
        {actionError && <ErrorBanner message={actionError} onClose={() => setActionError('')} />}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search clients...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{tr('All Statuses')}</option>
            <option value="Active">{tr('Active')}</option>
            <option value="Inactive">{tr('Inactive')}</option>
          </select>
          <button className="btn-primary" onClick={() => setView('add')}>+ {t('addClient')}</button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading clients...')}</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{tr('Client')}</th>
                    <th>{tr('Phone')}</th>
                    <th>{tr('Email')}</th>
                    <th>{tr('Interested In')}</th>
                    <th>{tr('Budget')}</th>
                    <th>{tr('Assigned Agent')}</th>
                    <th>{tr('Status')}</th>
                    <th>{tr('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{c.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{c.name}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{c._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.phone}</td>
                      <td style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{c.email || '—'}</td>
                      <td><span style={{ fontSize: 12.5, background: 'var(--muted)', padding: '2px 8px', borderRadius: 99 }}>{c.interestedIn || '—'}</span></td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{c.budget ? formatFullDZD(c.budget) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{(c.agent?.name || '?')[0]}</div>
                          <span style={{ fontSize: 13 }}>{c.agent?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(c); setView('detail'); }}>{tr('View')}</button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(c); setView('edit'); }}>{tr('Edit')}</button>
                          <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(c)}>{tr('Delete')}</button></AdminOnly>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', color: 'var(--muted-fg)', fontSize: 13 }}>
            {tr('{n} clients', { n: filtered.length })}
          </div>
        </div>
      </div>
    </div>
  );
}