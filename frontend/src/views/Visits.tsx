'use client'

import { useState, useEffect } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { statusColors } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
const Badge = ({ status }: { status: string }) => {
  const style = statusColors[status] || 'background:var(--muted);color:var(--fg)';
  const obj = Object.fromEntries(style.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())));
  return <span className="badge" style={obj}>{tr(status)}</span>;
};

const STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];
const STATUS_COLORS: Record<string, string> = { Scheduled: '#2563EB', Completed: '#10B981', Cancelled: '#EF4444', 'No-show': '#F59E0B' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Agent { _id: string; name: string; }
interface Client { _id: string; name: string; }
interface Property { _id: string; title: string; }

interface Visit {
  _id: string;
  client?: Client;
  property?: Property;
  agent?: Agent;
  date: string;
  time?: string;
  status: string;
  notes?: string;
}

function CalendarView({ visits }: { visits: Visit[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : i - firstDay + 1);

  const visitsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return visits.filter(v => (v.date || '').slice(0, 10) === dateStr);
  };

  const today = new Date();

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-ghost" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>{tr('← Prev')}</button>
        <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr(MONTHS[month])} {year}</h3>
        <button className="btn-ghost" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>{tr('Next →')}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 600, color: 'var(--muted-fg)', padding: '6px 0', letterSpacing: '0.03em' }}>{tr(d)}</div>)}
        {cells.map((day, i) => {
          const dayVisits = day ? visitsOnDay(day) : [];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={i} style={{
              minHeight: 72, padding: '6px 6px', borderRadius: 7, background: day ? (isToday ? 'var(--blue-light)' : 'transparent') : 'transparent',
              border: isToday ? '1px solid var(--blue)' : '1px solid transparent',
              opacity: day ? 1 : 0,
            }}>
              {day && (
                <>
                  <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--blue)' : 'var(--fg)', marginBottom: 4 }}>{day}</div>
                  {dayVisits.map(v => (
                    <div key={v._id} style={{ fontSize: 10, background: STATUS_COLORS[v.status] + '20', color: STATUS_COLORS[v.status], borderRadius: 4, padding: '2px 5px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.time} {v.client?.name?.split(' ')[0] || ''}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// مودال واحد للجدولة والتعديل (إذا جاء initial يعني تعديل)
function VisitModal({ initial, onClose, onSaved }: { initial?: Visit; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const { isAdmin, agentId } = useApp(); // الوكيل: الحقل مقفول على ملفو
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    client: initial?.client?._id || '',
    property: initial?.property?._id || '',
    agent: initial?.agent?._id || (isAdmin ? '' : agentId ?? ''),
    date: initial?.date ? initial.date.slice(0, 10) : '',
    time: initial ? (initial.time || '') : '10:00',
    status: initial?.status || 'Scheduled',
    notes: initial?.notes || '',
  });

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/properties').then(res => setProperties(res.data)).catch(() => {});
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.client || !form.property || !form.agent || !form.date) {
      setError(tr('Client, property, agent and date are required.'));
      return;
    }
    setSaving(true);
    setError('');
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = isEdit ? null : undefined;
    const payload = {
      client: form.client,
      property: form.property,
      agent: form.agent,
      date: form.date,
      time: form.time || EMPTY,
      notes: form.notes || EMPTY,
      status: form.status,
    };
    try {
      if (isEdit) await api.patch(`/visits/${initial!._id}`, payload);
      else await api.post('/visits', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not schedule visit. Please check the fields.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr(isEdit ? 'Edit Visit' : 'Schedule Visit')}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{error}</div>
          )}
          <div>
            <label className="label">{tr('Client')}</label>
            <select className="select input" value={form.client} onChange={e => setForm({...form, client: e.target.value})}>
              <option value="">{tr('Select client...')}</option>
              {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Property')}</label>
            <select className="select input" value={form.property} onChange={e => setForm({...form, property: e.target.value})}>
              <option value="">{tr('Select property...')}</option>
              {properties.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Agent')}</label>
            <select className="select input" value={form.agent} disabled={!isAdmin} onChange={e => setForm({...form, agent: e.target.value})}>
              <option value="">{tr('Select agent...')}</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">{tr('Date')}</label>
              <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Time')}</label>
              <input className="input" type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="label">{tr('Status')}</label>
              <select className="select input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">{tr('Notes')}</label>
            <textarea className="input" rows={2} placeholder={tr('Any special instructions...')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>{tr('Cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Schedule Visit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Visits() {
  const { t } = useApp();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [agentFilter, setAgentFilter] = useState('All Agents');

  const loadVisits = () => {
    setLoading(true);
    setLoadError('');
    api.get('/visits')
      .then(res => setVisits(res.data))
      .catch(err => {
        setVisits([]);
        setLoadError(apiError(err, tr('Could not load data from the server.')));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVisits();
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const filtered = visits.filter(v =>
    (!filterStatus || v.status === filterStatus) &&
    (agentFilter === 'All Agents' || v.agent?._id === agentFilter)
  );

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (v: Visit) => { setEditing(v); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  // إلغاء الزيارة = نبدلو الحالة لـ Cancelled (ما نمسحوهاش)
  const handleCancelVisit = async (v: Visit) => {
    if (!window.confirm(tr('Cancel this visit?'))) return;
    setActionError('');
    try {
      await api.patch(`/visits/${v._id}`, { status: 'Cancelled' });
      setVisits(prev => prev.map(x => x._id === v._id ? { ...x, status: 'Cancelled' } : x));
    } catch (err) {
      setActionError(apiError(err, tr('Could not cancel visit.')));
    }
  };

  const handleDelete = async (v: Visit) => {
    if (!window.confirm(tr('Delete this visit? This cannot be undone.'))) return;
    setActionError('');
    try {
      await api.delete(`/visits/${v._id}`);
      setVisits(prev => prev.filter(x => x._id !== v._id));
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete visit.')));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('visits')} />
      <div className="page-content">
        {(loadError || actionError) && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
            {actionError || loadError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{tr('All Statuses')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
          </select>
          <select className="select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
            <option value="All Agents">{tr('All Agents')}</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            {(['list', 'calendar'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: viewMode === m ? 'var(--card)' : 'transparent', color: viewMode === m ? 'var(--fg)' : 'var(--muted-fg)', transition: 'all 0.15s' }}>
                {m === 'list' ? '≡ ' + tr('List') : '📅 ' + tr('Calendar')}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={openAdd}>+ {t('scheduleVisit')}</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading visits...')}</div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {STATUSES.map(s => ({ label: tr(s), count: visits.filter(v => v.status === s).length, color: STATUS_COLORS[s] })).map(s => (
                <div key={s.label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 32, background: s.color, borderRadius: 99 }} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{s.count}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted-fg)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {viewMode === 'calendar' ? <CalendarView visits={filtered} /> : (
              <div className="card">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr('Visit ID')}</th>
                        <th>{tr('Client')}</th>
                        <th>{tr('Property')}</th>
                        <th>{tr('Agent')}</th>
                        <th>{tr('Date & Time')}</th>
                        <th>{tr('Status')}</th>
                        <th>{tr('Notes')}</th>
                        <th>{tr('Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-fg)' }}>{tr('No visits match your filters.')}</td></tr>
                      )}
                      {filtered.map(v => (
                        <tr key={v._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-fg)' }}>{v._id.slice(-8)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{(v.client?.name || '?')[0]}</div>
                              <span style={{ fontWeight: 500, fontSize: 13.5 }}>{v.client?.name || tr('Unknown')}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--muted-fg)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.property?.title || tr('Unknown')}</td>
                          <td style={{ fontSize: 13 }}>{v.agent?.name || tr('Unassigned')}</td>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{(v.date || '').slice(0, 10)}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{tr('at')} {v.time || '—'}</div>
                          </td>
                          <td><Badge status={v.status} /></td>
                          <td style={{ fontSize: 12.5, color: 'var(--muted-fg)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.notes || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openEdit(v)}>{tr('Edit')}</button>
                              {v.status === 'Scheduled' && (
                                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => handleCancelVisit(v)}>{tr('Cancel Visit')}</button>
                              )}
                              <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(v)}>{tr('Delete')}</button></AdminOnly>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <VisitModal
          initial={editing || undefined}
          onClose={closeModal}
          onSaved={() => { closeModal(); loadVisits(); }}
        />
      )}
    </div>
  );
}
