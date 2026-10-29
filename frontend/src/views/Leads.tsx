'use client'

import { useState, useEffect } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { statusColors, formatFullDZD } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
const STAGES = ['New', 'Contacted', 'Qualified', 'Visit Scheduled', 'Negotiation', 'Won', 'Lost'];
const SOURCES = ['Website', 'Instagram', 'Facebook', 'Referral', 'Phone', 'Walk-in', 'Other'];
const STAGE_COLORS: Record<string, string> = {
  New: '#6B7280', Contacted: '#3B82F6', Qualified: '#8B5CF6',
  'Visit Scheduled': '#F59E0B', Negotiation: '#F97316', Won: '#10B981', Lost: '#EF4444',
};
const SOURCE_ICONS: Record<string, string> = {
  Instagram: '📸', Website: '🌐', Referral: '👥', Facebook: '📘', Phone: '📞', 'Walk-in': '🚶',
};

interface Agent {
  _id: string;
  name: string;
}

interface Lead {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  property?: string;
  budget?: number;
  source?: string;
  stage: string;
  agent?: Agent;
  updatedAt?: string;
}

const Badge = ({ status }: { status: string }) => {
  const style = statusColors[status] || 'background:var(--muted);color:var(--fg)';
  const obj = Object.fromEntries(style.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())));
  return <span className="badge" style={obj}>{tr(status)}</span>;
};

// مودال واحد للإضافة والتعديل (إذا جاء initial يعني تعديل)
function LeadModal({ initial, onClose, onSaved }: { initial?: Lead; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [agents, setAgents] = useState<Agent[]>([]);
  const { isAdmin, agentId } = useApp(); // الوكيل: الحقل مقفول على ملفو
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: initial?.name || '',
    phone: initial?.phone || '',
    email: initial?.email || '',
    property: initial?.property || '',
    budget: initial?.budget != null ? String(initial.budget) : '',
    source: initial?.source || 'Website',
    stage: initial?.stage || 'New',
    agent: initial?.agent?._id || (isAdmin ? '' : agentId ?? ''),
  });

  useEffect(() => {
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(tr('Name is required.'));
      return;
    }
    setSaving(true);
    setError('');
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = isEdit ? null : undefined;
    const payload = {
      name: form.name.trim(),
      phone: form.phone || EMPTY,
      email: form.email || EMPTY,
      property: form.property || EMPTY,
      budget: form.budget ? Number(form.budget) : EMPTY,
      source: form.source,
      stage: form.stage,
      agent: form.agent || EMPTY,
    };
    try {
      if (isEdit) await api.patch(`/leads/${initial!._id}`, payload);
      else await api.post('/leads', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save lead. Please check the fields.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr(isEdit ? 'Edit Lead' : 'Add New Lead')}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{error}</div>
          )}
          <div>
            <label className="label">{tr('Name')}</label>
            <input className="input" placeholder={tr('Full name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="label">{tr('Phone')}</label>
            <input className="input" placeholder="+213..." value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="label">{tr('Email')}</label>
            <input className="input" type="email" placeholder="email@example.dz" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="label">{tr('Property Interested In')}</label>
            <input className="input" placeholder={tr('e.g. Villa — Hydra')} value={form.property} onChange={e => setForm({...form, property: e.target.value})} />
          </div>
          <div>
            <label className="label">{tr('Budget (DZD)')}</label>
            <input className="input" type="number" min="0" placeholder={tr('e.g. 15000000')} value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
          </div>
          <div>
            <label className="label">{tr('Source')}</label>
            <select className="select input" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
              {SOURCES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Stage')}</label>
            <select className="select input" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
              {STAGES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Assigned Agent')}</label>
            <select className="select input" value={form.agent} disabled={!isAdmin} onChange={e => setForm({...form, agent: e.target.value})}>
              <option value="">{tr('Select agent...')}</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>{tr('Cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Add Lead')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const { t } = useApp();
  const [leadsData, setLeadsData] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [agentFilter, setAgentFilter] = useState('All Agents');

  // على الموبايل: نوقفو الـdrag&drop (يخلط مع الـscroll) ونستعملو select
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const loadLeads = () => {
    setLoading(true);
    setLoadError('');
    api.get('/leads')
      .then(res => setLeadsData(res.data))
      .catch(err => {
        setLeadsData([]);
        setLoadError(apiError(err, tr('Could not load data from the server.')));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  // الفلاتر (البحث بالاسم/الهاتف/الإيميل/العقار)
  const q = search.trim().toLowerCase();
  const visibleLeads = leadsData.filter(l => {
    if (sourceFilter !== 'All Sources' && l.source !== sourceFilter) return false;
    if (agentFilter !== 'All Agents' && l.agent?._id !== agentFilter) return false;
    if (q && ![l.name, l.phone, l.email, l.property].some(v => (v || '').toLowerCase().includes(q))) return false;
    return true;
  });
  const byStage = (stage: string) => visibleLeads.filter(l => l.stage === stage);

  const updateStage = async (leadId: string, newStage: string) => {
    setActionError('');
    setLeadsData(prev => prev.map(l => l._id === leadId ? { ...l, stage: newStage } : l));
    try {
      await api.patch(`/leads/${leadId}`, { stage: newStage });
    } catch (err) {
      setActionError(apiError(err, tr('Could not save lead. Please check the fields.')));
      loadLeads();
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!window.confirm(tr('Delete this lead? This cannot be undone.'))) return;
    setActionError('');
    try {
      await api.delete(`/leads/${lead._id}`);
      setLeadsData(prev => prev.filter(l => l._id !== lead._id));
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete lead.')));
    }
  };

  const handleDrop = (targetStage: string) => {
    if (!dragging) return;
    const lead = leadsData.find(l => l._id === dragging);
    if (lead && lead.stage !== targetStage) updateStage(dragging, targetStage);
    setDragging(null);
    setDragOver(null);
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (lead: Lead) => { setEditing(lead); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('leads')} />
      <div className="page-content">
        {(loadError || actionError) && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
            {actionError || loadError}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search leads...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="All Sources">{tr('All Sources')}</option>
            {SOURCES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
          </select>
          <select className="select" value={agentFilter} onChange={e => setAgentFilter(e.target.value)}>
            <option value="All Agents">{tr('All Agents')}</option>
            {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
            {(['kanban', 'table'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: viewMode === m ? 'var(--card)' : 'transparent', color: viewMode === m ? 'var(--fg)' : 'var(--muted-fg)', transition: 'all 0.15s' }}>
                {m === 'kanban' ? '⊞ ' + tr('Kanban') : '≡ ' + tr('Table')}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={openAdd}>+ {t('addLead')}</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading leads...')}</div>
        ) : (
          <>
            {/* Summary bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {STAGES.map(s => {
                const count = byStage(s).length;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 99, fontSize: 12.5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: STAGE_COLORS[s] }} />
                    <span style={{ color: 'var(--muted-fg)' }}>{tr(s)}</span>
                    <span style={{ fontWeight: 700 }}>{count}</span>
                  </div>
                );
              })}
            </div>

            {viewMode === 'kanban' ? (
              <div className="kanban-board" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
                {STAGES.map(stage => (
                  <div
                    key={stage}
                    className="kanban-col"
                    style={{ outline: dragOver === stage ? `2px dashed ${STAGE_COLORS[stage]}` : 'none', transition: 'outline 0.15s' }}
                    onDragOver={e => { e.preventDefault(); setDragOver(stage); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => handleDrop(stage)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{tr(stage)}</span>
                      </div>
                      <span style={{ fontSize: 11.5, background: 'var(--card)', color: 'var(--muted-fg)', padding: '1px 7px', borderRadius: 99, border: '1px solid var(--border)' }}>{byStage(stage).length}</span>
                    </div>

                    {byStage(stage).map(lead => (
                      <div
                        key={lead._id}
                        className={`kanban-card ${dragging === lead._id ? 'dragging' : ''}`}
                        draggable={!isMobile}
                        onDragStart={() => setDragging(lead._id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{lead.name}</div>
                          <span style={{ fontSize: 13 }}>{SOURCE_ICONS[lead.source || ''] || '💬'}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.property || '—'}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--blue)', marginBottom: 8 }}>{lead.budget ? formatFullDZD(lead.budget) : '—'}</div>
                        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>{(lead.agent?.name || '?')[0]}</div>
                            <span style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{lead.agent?.name?.split(' ')[0] || tr('Unassigned')}</span>
                          </div>
                          <span style={{ fontSize: 10.5, color: 'var(--muted-fg)' }}>{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : ''}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                          <button className="btn-ghost" style={{ fontSize: 11.5, padding: '2px 8px' }} onClick={() => openEdit(lead)}>{tr('Edit')}</button>
                          <AdminOnly><button className="btn-ghost" style={{ fontSize: 11.5, padding: '2px 8px', color: 'var(--red)' }} onClick={() => handleDelete(lead)}>{tr('Delete')}</button></AdminOnly>
                        </div>

                        {isMobile && (
                          <select
                            className="select"
                            value={lead.stage}
                            onChange={e => updateStage(lead._id, e.target.value)}
                            style={{ width: '100%', marginTop: 10, fontSize: 12 }}
                            aria-label="Move lead to stage"
                          >
                            {STAGES.map(st => <option key={st} value={st}>{tr(st)}</option>)}
                          </select>
                        )}
                      </div>
                    ))}

                    <button style={{ border: '1.5px dashed var(--border)', borderRadius: 8, padding: '8px', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontSize: 12.5, width: '100%', transition: 'background 0.15s' }}
                      onClick={openAdd}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--card)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {tr('+ Add lead')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>{tr('Lead')}</th>
                        <th>{tr('Property')}</th>
                        <th>{tr('Budget')}</th>
                        <th>{tr('Source')}</th>
                        <th>{tr('Agent')}</th>
                        <th>{tr('Stage')}</th>
                        <th>{tr('Last Activity')}</th>
                        <th>{tr('Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-fg)' }}>{tr('No leads match your filters.')}</td></tr>
                      )}
                      {visibleLeads.map(l => (
                        <tr key={l._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: STAGE_COLORS[l.stage] + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{l.name[0]}</div>
                              <div>
                                <div style={{ fontWeight: 500 }}>{l.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{l.phone || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--muted-fg)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.property || '—'}</td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{l.budget ? formatFullDZD(l.budget) : '—'}</td>
                          <td>
                            <span style={{ fontSize: 12.5 }}>{SOURCE_ICONS[l.source || ''] || ''} {l.source ? tr(l.source) : '—'}</span>
                          </td>
                          <td style={{ fontSize: 13 }}>{l.agent?.name || tr('Unassigned')}</td>
                          <td><Badge status={l.stage} /></td>
                          <td style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{l.updatedAt ? new Date(l.updatedAt).toLocaleDateString() : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openEdit(l)}>{tr('Edit')}</button>
                              <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(l)}>{tr('Delete')}</button></AdminOnly>
                              <select className="select" style={{ fontSize: 11, padding: '3px 6px' }} value={l.stage} onChange={e => updateStage(l._id, e.target.value)}>
                                {STAGES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
                              </select>
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
        <LeadModal
          initial={editing || undefined}
          onClose={closeModal}
          onSaved={() => { closeModal(); loadLeads(); }}
        />
      )}
    </div>
  );
}
