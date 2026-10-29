'use client'

import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';

interface Prefs {
  emailNotif: boolean;
  newLead: boolean;
  paymentReminders: boolean;
  visitReminders: boolean;
  contractUpdates: boolean;
  agencyName: string;
  agencyAddress: string;
  agencyPhone: string;
}

const DEFAULTS: Prefs = {
  emailNotif: true,
  newLead: true,
  paymentReminders: true,
  visitReminders: true,
  contractUpdates: false,
  agencyName: 'Norvex Real Estate Agency',
  agencyAddress: '',
  agencyPhone: '',
};

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ width: 44, height: 24, borderRadius: 99, background: on ? 'var(--blue)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

interface TeamUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  agent?: { _id: string; name: string } | null;
}

interface AgentOption { _id: string; name: string }

const ROLE_STYLE: Record<string, { bg: string; fg: string }> = {
  admin: { bg: '#EDE9FE', fg: '#6D28D9' },
  agent: { bg: '#DBEAFE', fg: '#1D4ED8' },
};

// كلمة سر مؤقتة عشوائية (بدون حروف تتشابه: 0/O و1/l/I)
function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

// قسم الفريق: يظهر للـadmin فقط (الـbackend يحمي /users بـadmin أيضا)
function TeamSection() {
  const { userEmail } = useApp();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [agentsList, setAgentsList] = useState<AgentOption[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'agent', agent: '' });
  const [resetFor, setResetFor] = useState<TeamUser | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const load = () => {
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(err => setError(tr(apiError(err, tr('Could not load users.')))))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/agents').then(res => setAgentsList(res.data)).catch(() => {});
  }, []);

  // ربط/فك ربط حساب وكيل بملف وكيل
  const linkAgent = async (u: TeamUser, agentId: string) => {
    setMessage('');
    setError('');
    try {
      const res = await api.patch(`/users/${u._id}`, { agent: agentId || null });
      setUsers(prev => prev.map(x => (x._id === u._id ? { ...x, agent: res.data.agent ?? null } : x)));
    } catch (err) {
      setError(tr(apiError(err, tr('Could not update the link.'))));
    }
  };

  const handleCreate = async () => {
    setMessage('');
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(tr('Name, email and password are required.'));
      return;
    }
    if (form.password.length < 6) {
      setError(tr('Password must be at least 6 characters.'));
      return;
    }
    setSaving(true);
    try {
      await api.post('/users', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        ...(form.role === 'agent' && form.agent ? { agent: form.agent } : {}),
      });
      setForm({ name: '', email: '', password: '', role: 'agent', agent: '' });
      setMessage(tr('Account created successfully.'));
      load();
    } catch (err) {
      setError(tr(apiError(err, tr('Could not create account.'))));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: TeamUser) => {
    if (!window.confirm(tr('Delete this account? This cannot be undone.'))) return;
    setMessage('');
    setError('');
    try {
      await api.delete(`/users/${u._id}`);
      setUsers(prev => prev.filter(x => x._id !== u._id));
    } catch (err) {
      setError(tr(apiError(err, tr('Could not delete account.'))));
    }
  };

  const openReset = (u: TeamUser) => {
    setMessage('');
    setError('');
    setResetError('');
    setNewPw(generatePassword());
    setResetFor(u);
  };

  const handleReset = async () => {
    if (!resetFor) return;
    if (newPw.length < 6) {
      setResetError(tr('Password must be at least 6 characters.'));
      return;
    }
    setResetting(true);
    setResetError('');
    try {
      await api.patch(`/users/${resetFor._id}`, { password: newPw });
      setMessage(tr('Password updated for {name}.', { name: resetFor.name }));
      setResetFor(null);
      setNewPw('');
    } catch (err) {
      setResetError(tr(apiError(err, tr('Could not reset password.'))));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ marginTop: 36 }}>
      <h3 style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tr('Team')}</h3>

      {message && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}>{message}</div>
      )}
      {error && (
        <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 12 }}>{error}</div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>{tr('Team members')}</div>
        {loading ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted-fg)' }}>…</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>{tr('Name')}</th>
                  <th>{tr('Email')}</th>
                  <th>{tr('Role')}</th>
                  <th>{tr('Agent profile')}</th>
                  <th>{tr('Created')}</th>
                  <th>{tr('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isMe = u.email.toLowerCase() === (userEmail || '').toLowerCase();
                  const style = ROLE_STYLE[u.role] || ROLE_STYLE.agent;
                  return (
                    <tr key={u._id}>
                      <td style={{ fontWeight: 500 }}>
                        {u.name} {isMe && <span style={{ fontSize: 11, color: 'var(--muted-fg)' }}>({tr('You')})</span>}
                      </td>
                      <td style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{u.email}</td>
                      <td><span className="badge" style={{ background: style.bg, color: style.fg }}>{tr(u.role === 'admin' ? 'Admin' : 'Agent')}</span></td>
                      <td>
                        {u.role === 'agent' ? (
                          <select className="select" style={{ fontSize: 12, padding: '3px 6px', maxWidth: 170, borderColor: u.agent ? undefined : '#F59E0B' }} value={u.agent?._id || ''} onChange={e => linkAgent(u, e.target.value)}>
                            <option value="">{tr('Not linked')}</option>
                            {agentsList.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                          </select>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        {!isMe && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => openReset(u)}>{tr('Reset password')}</button>
                            <button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(u)}>{tr('Delete')}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{tr('Create account')}</div>
        <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 16 }}>{tr('Create a login account for a new team member.')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label">{tr('Full Name')}</label>
            <input className="input" placeholder={tr('e.g. Yacine Bouaziz')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">{tr('Email')}</label>
            <input className="input" type="email" placeholder="agent@norvex.dz" autoComplete="off" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">{tr('Password')}</label>
            <input className="input" type="password" placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">{tr('Role')}</label>
            <select className="select input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="agent">{tr('Agent')}</option>
              <option value="admin">{tr('Admin')}</option>
            </select>
          </div>
          {form.role === 'agent' && (
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">{tr('Agent profile')}</label>
              <select className="select input" value={form.agent} onChange={e => setForm({ ...form, agent: e.target.value })}>
                <option value="">{tr('Not linked')}</option>
                {agentsList.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 6 }}>
                {tr('An agent account only sees the clients, leads, visits, contracts and payments of its linked agent profile.')}
              </div>
            </div>
          )}
        </div>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={handleCreate} disabled={saving}>
          {saving ? tr('Saving...') : tr('Create Account')}
        </button>
      </div>

      {resetFor && (
        <div className="modal-overlay" onClick={() => !resetting && setResetFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{tr('Reset password')}</h3>
              <button className="btn-ghost" onClick={() => setResetFor(null)} disabled={resetting}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {resetError && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{resetError}</div>
              )}
              <div style={{ fontSize: 13.5, color: 'var(--muted-fg)' }}>
                {tr('Set a new password for {name}. Share it with them securely.', { name: resetFor.name })}
              </div>
              <div>
                <label className="label">{tr('New Password')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" style={{ fontFamily: 'var(--font-mono)' }} value={newPw} onChange={e => setNewPw(e.target.value)} autoComplete="off" />
                  <button className="btn-secondary" type="button" onClick={() => setNewPw(generatePassword())} disabled={resetting}>{tr('Generate')}</button>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setResetFor(null)} disabled={resetting}>{tr('Cancel')}</button>
              <button className="btn-primary" onClick={handleReset} disabled={resetting}>{resetting ? tr('Saving...') : tr('Reset password')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { t, lang, setLang, dark, toggleDark, isAdmin } = useApp();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // الإعدادات تتقرا من الـbackend (مشتركة بين كل الأجهزة والمستخدمين)
  useEffect(() => {
    api.get('/settings')
      .then(res => setPrefs({ ...DEFAULTS, ...res.data }))
      .catch(err => setError(apiError(err, tr('Could not load data from the server.'))))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setMessage('');
    setError('');
    setPrefs(p => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    if (!prefs.agencyName.trim()) {
      setMessage('');
      setError(tr('Agency name is required.'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.patch('/settings', {
        ...prefs,
        agencyName: prefs.agencyName.trim(),
        // null = مسح القيمة
        agencyAddress: prefs.agencyAddress.trim() || null,
        agencyPhone: prefs.agencyPhone.trim() || null,
      });
      setPrefs({ ...DEFAULTS, ...res.data });
      setMessage(tr('Settings saved.'));
    } catch (err) {
      setMessage('');
      setError(apiError(err, tr('Could not save settings.')));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(tr('Reset all settings to defaults?'))) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.delete('/settings');
      setPrefs({ ...DEFAULTS, ...res.data });
      setMessage(tr('Settings reset to defaults.'));
    } catch (err) {
      setMessage('');
      setError(apiError(err, tr('Could not reset settings.')));
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    {
      title: 'General',
      items: [
        {
          label: 'Language',
          desc: 'Choose your preferred interface language',
          control: (
            <div style={{ display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {(['en', 'ar'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: lang === l ? 'var(--blue)' : 'transparent', color: lang === l ? '#fff' : 'var(--muted-fg)', transition: 'all 0.15s' }}>
                  {l === 'en' ? '🇬🇧 English' : '🇩🇿 العربية'}
                </button>
              ))}
            </div>
          ),
        },
        {
          label: 'Theme',
          desc: 'Switch between light and dark mode',
          control: (
            <button onClick={toggleDark} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: dark ? 'var(--navy)' : 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: dark ? '#fff' : 'var(--fg)', transition: 'all 0.15s' }}>
              {dark ? '☀️ ' + tr('Light Mode') : '🌙 ' + tr('Dark Mode')}
            </button>
          ),
        },
        {
          label: 'Currency',
          desc: 'Primary currency for all financial displays',
          control: <select className="select" defaultValue="DZD"><option value="DZD">{tr('🇩🇿 DZD — Algerian Dinar')}</option></select>,
        },
        {
          label: 'Timezone',
          desc: 'Used for scheduling visits and reminders',
          control: <select className="select" defaultValue="Africa/Algiers"><option value="Africa/Algiers (GMT+1)">{tr('Africa/Algiers (GMT+1)')}</option></select>,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { label: 'Email Notifications', desc: 'Receive updates via email', control: <Toggle on={prefs.emailNotif} onChange={v => set('emailNotif', v)} /> },
        { label: 'New Lead Alerts', desc: 'Notify when a new lead is created', control: <Toggle on={prefs.newLead} onChange={v => set('newLead', v)} /> },
        { label: 'Payment Reminders', desc: 'Remind about pending & overdue payments', control: <Toggle on={prefs.paymentReminders} onChange={v => set('paymentReminders', v)} /> },
        { label: 'Visit Reminders', desc: 'Remind agents 1 hour before a visit', control: <Toggle on={prefs.visitReminders} onChange={v => set('visitReminders', v)} /> },
        { label: 'Contract Updates', desc: 'Notify when a contract status changes', control: <Toggle on={prefs.contractUpdates} onChange={v => set('contractUpdates', v)} /> },
      ],
    },
    {
      title: 'Agency Information',
      items: [
        {
          label: 'Agency Name',
          desc: 'Displayed on reports and documents',
          control: <input className="input" value={prefs.agencyName} disabled={loading} onChange={e => set('agencyName', e.target.value)} style={{ maxWidth: 280 }} />,
        },
        {
          label: 'Agency Address',
          desc: '',
          control: <input className="input" value={prefs.agencyAddress} disabled={loading} placeholder={tr('e.g. 12 Rue Didouche Mourad, Algiers')} onChange={e => set('agencyAddress', e.target.value)} style={{ maxWidth: 360 }} />,
        },
        {
          label: 'Agency Phone',
          desc: '',
          control: <input className="input" value={prefs.agencyPhone} disabled={loading} placeholder="+213 ..." onChange={e => set('agencyPhone', e.target.value)} style={{ maxWidth: 200 }} />,
        },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('settings')} />
      <div className="page-content" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20 }}>{tr('Settings')}</h2>
          <p style={{ color: 'var(--muted-fg)', fontSize: 14, marginTop: 4 }}>{tr('Configure your Norvex workspace')}</p>
        </div>

        {message && (
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{message}</div>
        )}
        {error && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}

        {sections.map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <h3 style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tr(section.title)}</h3>
            <div className="card">
              {section.items.map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 20px', borderBottom: i < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 16, flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{tr(item.label)}</div>
                    {item.desc && <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginTop: 2 }}>{tr(item.desc)}</div>}
                  </div>
                  <div>{item.control}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handleSave} disabled={loading || saving}>{saving ? tr('Saving...') : tr('Save Changes')}</button>
          <button className="btn-secondary" onClick={handleReset} disabled={loading || saving}>{tr('Reset to defaults')}</button>
        </div>

        {isAdmin && <TeamSection />}
      </div>
    </div>
  );
}
