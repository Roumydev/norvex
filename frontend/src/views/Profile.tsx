'use client'

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';

import { tr } from '../i18n';
export default function Profile() {
  const { t, logout, userEmail, userName, isAdmin } = useApp();
  const email = userEmail || 'admin@norvex.dz';

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwOk, setPwOk] = useState('');

  const updatePassword = async () => {
    setPwError('');
    setPwOk('');
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwError(tr('Please fill in all password fields.'));
      return;
    }
    if (pw.next.length < 6) {
      setPwError(tr('New password must be at least 6 characters.'));
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwError(tr('New passwords do not match.'));
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPwOk(tr('Password updated successfully.'));
    } catch (err) {
      setPwError(apiError(err, tr('Could not update password.')));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('profile')} />
      <div className="page-content" style={{ maxWidth: 800 }}>
        {/* Profile header */}
        <div className="card" style={{ padding: '28px 28px', marginBottom: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32, fontWeight: 800 }}>A</div>
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--card)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 12 }}>✏️</button>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{userName || email}</h2>
            <div style={{ color: 'var(--muted-fg)', fontSize: 14, marginBottom: 8 }}>{tr(isAdmin ? 'System Administrator · Norvex Real Estate' : 'Real Estate Agent · Norvex Real Estate')}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted-fg)' }}>
              <span>📧 {email}</span>
              <span>📞 +213 21 XX XX XX</span>
              <span>{tr('📍 Algiers, Algeria')}</span>
            </div>
          </div>
          <button className="btn-primary">{tr('Edit Profile')}</button>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{tr('Personal Information')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Full Name', userName || ''], ['Email', email], ['Phone', '+213 21 XX XX XX'], ['Role', isAdmin ? 'System Administrator' : 'Agent']].map(([l, v]) => (
                <div key={l + ':' + v}>
                  <label className="label">{tr(l)}</label>
                  <input className="input" defaultValue={v} dir={l === 'Email' || l === 'Phone' ? 'ltr' : undefined} />
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{tr('Security')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {pwError && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{pwError}</div>
              )}
              {pwOk && (
                <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13 }}>{pwOk}</div>
              )}
              <div>
                <label className="label">{tr('Current Password')}</label>
                <input className="input" type="password" placeholder="••••••••" autoComplete="current-password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} />
              </div>
              <div>
                <label className="label">{tr('New Password')}</label>
                <input className="input" type="password" placeholder="••••••••" autoComplete="new-password" value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} />
              </div>
              <div>
                <label className="label">{tr('Confirm New Password')}</label>
                <input className="input" type="password" placeholder="••••••••" autoComplete="new-password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} />
              </div>
              <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={updatePassword} disabled={pwSaving}>{pwSaving ? tr('Saving...') : tr('Update Password')}</button>
            </div>
          </div>
        </div>

        {/* Access info */}
        <div className="card" style={{ padding: 22, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{tr('Access & Permissions')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {['Properties', 'Clients', 'Agents', 'Leads', 'Visits', 'Contracts', 'Payments', 'Analytics', 'Settings'].map(perm => (
              <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--muted)', borderRadius: 7 }}>
                <span style={{ color: 'var(--green)', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 13.5 }}>{tr(perm)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary">{tr('Save Changes')}</button>
          <button className="btn-ghost" style={{ color: 'var(--red)' }} onClick={logout}>{tr('Sign Out')}</button>
        </div>
      </div>
    </div>
  );
}