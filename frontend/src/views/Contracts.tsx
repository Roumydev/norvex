'use client'

import { useState, useEffect, useRef } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { statusColors, formatFullDZD, formatDZD } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
const Badge = ({ status }: { status: string }) => {
  const style = statusColors[status] || 'background:var(--muted);color:var(--fg)';
  const obj = Object.fromEntries(style.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())));
  return <span className="badge" style={obj}>{tr(status)}</span>;
};

const STATUSES = ['Draft', 'Pending', 'Active', 'Completed', 'Cancelled'];

interface Agent { _id: string; name: string; }
interface Client { _id: string; name: string; }
interface Property { _id: string; title: string; }

interface Contract {
  _id: string;
  property?: Property;
  client?: Client;
  agent?: Agent;
  type: string;
  value: number;
  paid: number;
  startDate?: string;
  endDate?: string;
  status: string;
  documentName?: string;
  documentSize?: number;
  documentUploadedAt?: string;
}

const ErrorBanner = ({ message }: { message: string }) => message ? (
  <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{message}</div>
) : null;

const MAX_PDF_BYTES = 5 * 1024 * 1024;
const fmtSize = (b?: number) => (!b ? '' : b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

// رفع / تحميل / حذف ملف PDF تاع العقد
function ContractDocument({ contract, onUpdated }: { contract: Contract; onUpdated: (c: Contract) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file?: File | null) => {
    if (!file) return;
    setError('');
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) {
      setError(tr('Only PDF files are allowed.'));
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(tr('File is too large (max 5 MB).'));
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post(`/contracts/${contract._id}/document`, fd);
      onUpdated(res.data);
    } catch (err) {
      setError(tr(apiError(err, tr('Could not upload the document.'))));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const download = async () => {
    setError('');
    try {
      const res = await api.get(`/contracts/${contract._id}/document`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = contract.documentName || 'contract.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(tr('Could not download the document.'));
    }
  };

  const remove = async () => {
    if (!window.confirm(tr('Delete this document?'))) return;
    setError('');
    setBusy(true);
    try {
      const res = await api.delete(`/contracts/${contract._id}/document`);
      onUpdated(res.data);
    } catch (err) {
      setError(tr(apiError(err, tr('Could not remove the document.'))));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{tr('Contract Document')}</div>
      <ErrorBanner message={error} />
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0])} />

      {contract.documentName ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 30 }}>📄</div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontWeight: 500, fontSize: 14, wordBreak: 'break-all' }}>{contract.documentName}</div>
            <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>
              {fmtSize(contract.documentSize)}{contract.documentUploadedAt ? ` · ${new Date(contract.documentUploadedAt).toLocaleDateString()}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={download} disabled={busy}>{tr('Download')}</button>
            <button className="btn-secondary" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? tr('Uploading...') : tr('Replace')}</button>
            <AdminOnly><button className="btn-secondary" style={{ color: 'var(--red)' }} onClick={remove} disabled={busy}>{tr('Remove')}</button></AdminOnly>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (!busy) upload(e.dataTransfer.files?.[0]); }}
          style={{ border: `2px dashed ${dragOver ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 8, padding: '24px', textAlign: 'center', cursor: busy ? 'default' : 'pointer', color: 'var(--muted-fg)', background: dragOver ? 'var(--blue-light)' : 'transparent' }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13.5, marginBottom: 4 }}>{busy ? tr('Uploading...') : tr('Upload Contract PDF')}</div>
          <div style={{ fontSize: 12 }}>{tr('Drag & drop or click to browse')} · {tr('PDF only, up to 5 MB')}</div>
        </div>
      )}
    </div>
  );
}

function ContractDetail({ contract, error, onBack, onEdit, onDelete, onUpdated }: {
  contract: Contract; error: string; onBack: () => void; onEdit: () => void; onDelete: () => void; onUpdated: (c: Contract) => void;
}) {
  const paidPct = contract.value > 0 ? Math.round((contract.paid / contract.value) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr('Contract Details')} />
      <div className="page-content" style={{ maxWidth: 900 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 20 }}>{tr('← Back to Contracts')}</button>
        <ErrorBanner message={error} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-fg)', marginBottom: 6 }}>{contract._id.slice(-8)}</div>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>{contract.property?.title || tr('Unknown Property')}</h2>
                  <div style={{ color: 'var(--muted-fg)', fontSize: 14, marginTop: 4 }}>{contract.client?.name || tr('Unknown Client')}</div>
                </div>
                <Badge status={contract.status} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ background: 'var(--muted)', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginBottom: 4 }}>{tr('Contract Value')}</div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{formatDZD(contract.value)}</div>
                </div>
                <div style={{ background: '#D1FAE5', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: '#065F46', marginBottom: 4 }}>{tr('Total Paid')}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#065F46' }}>{formatDZD(contract.paid)}</div>
                </div>
                <div style={{ background: '#FEF3C7', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: '#92400E', marginBottom: 4 }}>{tr('Remaining')}</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#92400E' }}>{formatDZD(contract.value - contract.paid)}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{tr('Payment Progress')}</div>
                <span style={{ fontWeight: 700, color: 'var(--blue)', fontSize: 16 }}>{paidPct}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--muted)', borderRadius: 99, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(paidPct, 100)}%`, background: `linear-gradient(90deg, var(--blue), #60A5FA)`, borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--muted-fg)' }}>
                <span>{tr('Paid:')} {formatFullDZD(contract.paid)}</span>
                <span>{tr('Total:')} {formatFullDZD(contract.value)}</span>
              </div>
            </div>

            <ContractDocument contract={contract} onUpdated={onUpdated} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>{tr('Contract Details')}</div>
              {[
                ['Contract ID', contract._id.slice(-8)],
                ['Type', tr(contract.type)],
                ['Start Date', contract.startDate ? contract.startDate.slice(0, 10) : tr('Not set')],
                ['End Date', contract.endDate ? contract.endDate.slice(0, 10) : tr('Not set')],
                ['Agent', contract.agent?.name || tr('Unassigned')],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                  <span style={{ color: 'var(--muted-fg)' }}>{tr(l)}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}>{tr('Edit')}</button>
              <button className="btn-secondary" onClick={() => window.print()}>{tr('Print')}</button>
              <AdminOnly><button className="btn-secondary" style={{ color: 'var(--red)' }} onClick={onDelete}>{tr('Delete')}</button></AdminOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// مودال واحد للإضافة والتعديل (إذا جاء initial يعني تعديل)
function ContractModal({ initial, onClose, onSaved }: { initial?: Contract; onClose: () => void; onSaved: () => void }) {
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
    type: initial?.type || 'Sale',
    value: initial ? String(initial.value) : '',
    paid: initial ? String(initial.paid ?? 0) : '',
    startDate: initial?.startDate ? initial.startDate.slice(0, 10) : '',
    endDate: initial?.endDate ? initial.endDate.slice(0, 10) : '',
    status: initial?.status || 'Draft',
  });

  useEffect(() => {
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/properties').then(res => setProperties(res.data)).catch(() => {});
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.client || !form.property || !form.agent || !form.value) {
      setError(tr('Client, property, agent and value are required.'));
      return;
    }
    const value = Number(form.value);
    const paid = form.paid ? Number(form.paid) : 0;
    if (!(value > 0)) {
      setError(tr('Contract value must be greater than 0.'));
      return;
    }
    if (paid > value) {
      setError(tr('Paid amount cannot exceed the contract value.'));
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError(tr('End date must be after the start date.'));
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
      type: form.type,
      value,
      paid,
      startDate: form.startDate || EMPTY,
      endDate: form.endDate || EMPTY,
      status: form.status,
    };
    try {
      if (isEdit) await api.patch(`/contracts/${initial!._id}`, payload);
      else await api.post('/contracts', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save contract. Please check the fields.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr(isEdit ? 'Edit Contract' : 'Add New Contract')}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrorBanner message={error} />
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
              <label className="label">{tr('Type')}</label>
              <select className="select input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="Sale">{tr('Sale')}</option>
                <option value="Rent">{tr('Rent')}</option>
              </select>
            </div>
            <div>
              <label className="label">{tr('Status')}</label>
              <select className="select input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">{tr('Contract Value (DZD)')}</label>
              <input className="input" type="number" min="0" placeholder={tr('e.g. 25000000')} value={form.value} onChange={e => setForm({...form, value: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Already Paid (DZD)')}</label>
              <input className="input" type="number" min="0" placeholder="0" value={form.paid} onChange={e => setForm({...form, paid: e.target.value})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">{tr('Start Date')}</label>
              <input className="input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('End Date')}</label>
              <input className="input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>{tr('Cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Add Contract')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contracts() {
  const { t } = useApp();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const loadContracts = () => {
    setLoading(true);
    setLoadError('');
    api.get('/contracts')
      .then(res => setContracts(res.data))
      .catch(err => {
        setContracts([]);
        setLoadError(apiError(err, tr('Could not load data from the server.')));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadContracts();
  }, []);

  // نشتقو الـselected من القائمة، باش بعد التعديل تتحدث صفحة التفاصيل
  const selected = selectedId ? contracts.find(c => c._id === selectedId) || null : null;

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (c: Contract) => { setEditing(c); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleDelete = async (c: Contract) => {
    if (!window.confirm(tr('Delete this contract? This cannot be undone.'))) return;
    setActionError('');
    try {
      await api.delete(`/contracts/${c._id}`);
      setContracts(prev => prev.filter(x => x._id !== c._id));
      setSelectedId(null);
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete contract.')));
    }
  };

  const modal = showModal ? (
    <ContractModal
      initial={editing || undefined}
      onClose={closeModal}
      onSaved={() => { closeModal(); loadContracts(); }}
    />
  ) : null;

  if (selected) {
    return (
      <>
        <ContractDetail
          contract={selected}
          error={actionError}
          onBack={() => { setSelectedId(null); setActionError(''); }}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected)}
          onUpdated={updated => setContracts(prev => prev.map(c => (c._id === updated._id ? updated : c)))}
        />
        {modal}
      </>
    );
  }

  const totalValue = contracts.reduce((a, c) => a + c.value, 0);
  const totalPaid = contracts.reduce((a, c) => a + c.paid, 0);

  const q = search.trim().toLowerCase();
  const filtered = contracts.filter(c => {
    if (statusFilter !== 'All Statuses' && c.status !== statusFilter) return false;
    if (q && ![c.client?.name, c.property?.title, c.agent?.name, c._id.slice(-8)].some(v => (v || '').toLowerCase().includes(q))) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('contracts')} />
      <div className="page-content">
        <ErrorBanner message={actionError || loadError} />
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading contracts...')}</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { label: tr('Total Contracts'), value: contracts.length.toString(), icon: '📄' },
                { label: tr('Total Value'), value: formatDZD(totalValue), icon: '💰' },
                { label: tr('Total Paid'), value: formatDZD(totalPaid), icon: '✅' },
                { label: tr('Active'), value: contracts.filter(c => c.status === 'Active').length.toString(), icon: '🟢' },
              ].map(s => (
                <div key={s.label} className="stat-card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
                <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search contracts...')} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All Statuses">{tr('All Statuses')}</option>
                {STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
              <button className="btn-primary" onClick={openAdd}>+ {t('addContract')}</button>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{tr('Contract ID')}</th>
                      <th>{tr('Client')}</th>
                      <th>{tr('Property')}</th>
                      <th>{tr('Agent')}</th>
                      <th>{tr('Type')}</th>
                      <th>{tr('Value')}</th>
                      <th>{tr('Progress')}</th>
                      <th>{tr('Status')}</th>
                      <th>{tr('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-fg)' }}>{tr('No contracts match your filters.')}</td></tr>
                    )}
                    {filtered.map(c => {
                      const pct = c.value > 0 ? Math.round((c.paid / c.value) * 100) : 0;
                      return (
                        <tr key={c._id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--muted-fg)' }}>{c._id.slice(-8)}</td>
                          <td style={{ fontWeight: 500 }}>{c.client?.name || tr('Unknown')}</td>
                          <td style={{ color: 'var(--muted-fg)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.property?.title || tr('Unknown')}</td>
                          <td style={{ fontSize: 13 }}>{c.agent?.name || tr('Unassigned')}</td>
                          <td><span style={{ fontSize: 12.5, background: 'var(--muted)', padding: '2px 8px', borderRadius: 99 }}>{tr(c.type)}</span></td>
                          <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{formatDZD(c.value)}</td>
                          <td style={{ minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'var(--blue)', borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>{pct}%</span>
                            </div>
                          </td>
                          <td><Badge status={c.status} /></td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelectedId(c._id)}>{tr('View')}</button>
                              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openEdit(c)}>{tr('Edit')}</button>
                              <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(c)}>{tr('Delete')}</button></AdminOnly>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {modal}
    </div>
  );
}
