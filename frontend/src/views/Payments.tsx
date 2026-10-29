'use client'

import { useState, useEffect } from 'react';
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

const METHOD_ICONS: Record<string, string> = { 'Bank Transfer': '🏦', Cash: '💵', Cheque: '📝', 'CCP / Bank': '🏛️' };
const METHODS = ['Bank Transfer', 'Cash', 'Cheque', 'CCP / Bank'];
const STATUSES = ['Paid', 'Pending', 'Overdue'];
const PAGE_SIZE = 10;

const today = () => new Date().toISOString().split('T')[0];

interface Client { _id: string; name: string; }
interface Property { _id: string; title: string; }
interface Contract {
  _id: string;
  client?: Client;
  property?: Property;
}

interface Payment {
  _id: string;
  contract?: Contract;
  amount: number;
  dueDate: string;
  paidDate?: string;
  method?: string;
  status: string;
}

// مودال واحد للإضافة والتعديل (إذا جاء initial يعني تعديل)
function PaymentModal({ initial, onClose, onSaved }: { initial?: Payment; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!initial;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    contract: initial?.contract?._id || '',
    amount: initial ? String(initial.amount) : '',
    dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    paidDate: initial?.paidDate ? initial.paidDate.slice(0, 10) : '',
    method: initial?.method || 'Bank Transfer',
    status: initial?.status || 'Pending',
  });

  useEffect(() => {
    api.get('/contracts').then(res => setContracts(res.data)).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.contract || !form.amount || !form.dueDate) {
      setError(tr('Contract, amount and due date are required.'));
      return;
    }
    const amount = Number(form.amount);
    if (!(amount > 0)) {
      setError(tr('Amount must be greater than 0.'));
      return;
    }
    setSaving(true);
    setError('');
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = isEdit ? null : undefined;
    const payload = {
      contract: form.contract,
      amount,
      dueDate: form.dueDate,
      // دفعة Paid بلا تاريخ دفع -> نحطو تاريخ اليوم
      paidDate: form.paidDate || (form.status === 'Paid' ? today() : EMPTY),
      method: form.method,
      status: form.status,
    };
    try {
      if (isEdit) await api.patch(`/payments/${initial!._id}`, payload);
      else await api.post('/payments', payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save payment. Please check the fields.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr(isEdit ? 'Edit Payment' : 'Add New Payment')}</h3>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{error}</div>
          )}
          <div>
            <label className="label">{tr('Contract')}</label>
            <select className="select input" value={form.contract} onChange={e => setForm({...form, contract: e.target.value})}>
              <option value="">{tr('Select contract...')}</option>
              {contracts.map(c => <option key={c._id} value={c._id}>{c.property?.title || tr('Contract')} — {c.client?.name || ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Amount (DZD)')}</label>
            <input className="input" type="number" min="0" placeholder={tr('e.g. 5000000')} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">{tr('Due Date')}</label>
              <input className="input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Paid Date (optional)')}</label>
              <input className="input" type="date" value={form.paidDate} onChange={e => setForm({...form, paidDate: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="label">{tr('Method')}</label>
            <select className="select input" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
              {METHODS.map(m => <option key={m} value={m}>{tr(m)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{tr('Status')}</label>
            <select className="select input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              {['Pending', 'Paid', 'Overdue'].map(s => <option key={s} value={s}>{tr(s)}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>{tr('Cancel')}</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Add Payment')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Payments() {
  const { t } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [methodFilter, setMethodFilter] = useState('All Methods');
  const [page, setPage] = useState(1);

  const loadPayments = () => {
    setLoading(true);
    setLoadError('');
    api.get('/payments')
      .then(res => setPayments(res.data))
      .catch(err => {
        setPayments([]);
        setLoadError(apiError(err, tr('Could not load data from the server.')));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // كل ما يتبدل فلتر نرجعو للصفحة الأولى
  useEffect(() => { setPage(1); }, [search, statusFilter, methodFilter]);

  const markPaid = async (id: string) => {
    setActionError('');
    try {
      await api.patch(`/payments/${id}`, { status: 'Paid', paidDate: today() });
      loadPayments();
    } catch (err) {
      setActionError(apiError(err, tr('Could not mark payment as paid.')));
    }
  };

  const handleDelete = async (p: Payment) => {
    if (!window.confirm(tr('Delete this payment? This cannot be undone.'))) return;
    setActionError('');
    try {
      await api.delete(`/payments/${p._id}`);
      setPayments(prev => prev.filter(x => x._id !== p._id));
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete payment.')));
    }
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (p: Payment) => { setEditing(p); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const totalReceived = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((a, p) => a + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'Overdue').reduce((a, p) => a + p.amount, 0);

  const q = search.trim().toLowerCase();
  const filtered = payments.filter(p => {
    if (statusFilter !== 'All Statuses' && p.status !== statusFilter) return false;
    if (methodFilter !== 'All Methods' && p.method !== methodFilter) return false;
    if (q && ![p._id.slice(-8), p.contract?.property?.title, p.contract?.client?.name].some(v => (v || '').toLowerCase().includes(q))) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // تصدير CSV للنتائج الحالية (مع BOM باش Excel يقرا العربية)
  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['ID', 'Contract', 'Client', 'Amount (DZD)', 'Due Date', 'Paid Date', 'Method', 'Status'],
      ...filtered.map(p => [
        p._id.slice(-8), p.contract?.property?.title || '', p.contract?.client?.name || '',
        p.amount, (p.dueDate || '').slice(0, 10), (p.paidDate || '').slice(0, 10), p.method || '', p.status,
      ]),
    ];
    const csv = '\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('payments')} />
      <div className="page-content">
        {(loadError || actionError) && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
            {actionError || loadError}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading payments...')}</div>
        ) : (
          <>
            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div className="card" style={{ padding: '22px', borderLeft: '4px solid #10B981' }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{tr('Total Received')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#10B981', letterSpacing: '-0.5px' }}>{formatDZD(totalReceived)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 4 }}>{tr('{n} payments collected', { n: payments.filter(p => p.status === 'Paid').length })}</div>
              </div>
              <div className="card" style={{ padding: '22px', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{tr('Pending Payments')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B', letterSpacing: '-0.5px' }}>{formatDZD(totalPending)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 4 }}>{tr('{n} awaiting collection', { n: payments.filter(p => p.status === 'Pending').length })}</div>
              </div>
              <div className="card" style={{ padding: '22px', borderLeft: '4px solid #EF4444' }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>{tr('Overdue Payments')}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#EF4444', letterSpacing: '-0.5px' }}>{formatDZD(totalOverdue)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 4 }}>{tr('{n} overdue — action required', { n: payments.filter(p => p.status === 'Overdue').length })}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340, minWidth: 0 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
                <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search payments...')} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All Statuses">{tr('All Statuses')}</option>
                {STATUSES.map(s => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
              <select className="select" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                <option value="All Methods">{tr('All Methods')}</option>
                {METHODS.map(m => <option key={m} value={m}>{tr(m)}</option>)}
              </select>
              <button className="btn-secondary" onClick={exportCsv} disabled={filtered.length === 0}>{tr('↓ Export')}</button>
              <button className="btn-primary" onClick={openAdd}>{tr('+ Add Payment')}</button>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{tr('Payment ID')}</th>
                      <th>{tr('Contract')}</th>
                      <th>{tr('Client')}</th>
                      <th>{tr('Amount')}</th>
                      <th>{tr('Due Date')}</th>
                      <th>{tr('Paid Date')}</th>
                      <th>{tr('Method')}</th>
                      <th>{tr('Status')}</th>
                      <th>{tr('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--muted-fg)' }}>{tr('No payments match your filters.')}</td></tr>
                    )}
                    {pageRows.map(p => (
                      <tr key={p._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-fg)' }}>{p._id.slice(-8)}</td>
                        <td style={{ fontSize: 13, color: 'var(--muted-fg)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.contract?.property?.title || tr('Unknown')}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{(p.contract?.client?.name || '?')[0]}</div>
                            <span style={{ fontWeight: 500, fontSize: 13.5 }}>{p.contract?.client?.name || tr('Unknown')}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatFullDZD(p.amount)}</td>
                        <td style={{ fontSize: 13, color: p.status === 'Overdue' ? 'var(--red)' : 'var(--muted-fg)' }}>{(p.dueDate || '').slice(0, 10)}</td>
                        <td style={{ fontSize: 13, color: 'var(--muted-fg)' }}>{p.paidDate ? p.paidDate.slice(0, 10) : '—'}</td>
                        <td>
                          <span style={{ fontSize: 12.5 }}>{METHOD_ICONS[p.method || ''] || ''} {p.method ? tr(p.method) : '—'}</span>
                        </td>
                        <td><Badge status={p.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openEdit(p)}>{tr('Edit')}</button>
                            {p.status !== 'Paid' && <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--green)' }} onClick={() => markPaid(p._id)}>{tr('Mark Paid')}</button>}
                            <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(p)}>{tr('Delete')}</button></AdminOnly>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{tr('{n} total payments', { n: filtered.length })}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>{tr('← Prev')}</button>
                  <span style={{ fontSize: 12.5, color: 'var(--muted-fg)', padding: '0 8px' }}>{tr('Page {p} of {n}', { p: currentPage, n: totalPages })}</span>
                  <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>{tr('Next →')}</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <PaymentModal
          initial={editing || undefined}
          onClose={closeModal}
          onSaved={() => { closeModal(); loadPayments(); }}
        />
      )}
    </div>
  );
}
