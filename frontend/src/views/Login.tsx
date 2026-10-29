'use client'

import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NorvexLogo } from '../components/ui/Icons';
import { tr } from '../i18n';

export default function Login() {
  const { login, authError, t, lang, setLang } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => login(email, password);
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') submit(); };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'var(--navy)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Grid pattern */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Blue glow */}
        <div style={{ position: 'absolute', top: '30%', left: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 60 }}>
            <NorvexLogo width={148} className="text-white" />
          </div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Manage your real estate<br />
            <span style={{ color: 'var(--blue)' }}>business</span> smarter.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, maxWidth: 400 }}>
            The complete CRM & ERP platform for modern Algerian real estate agencies. Properties, clients, leads, contracts — all in one place.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {[['🏠', 'Properties'], ['👥', 'Clients & Leads'], ['📄', 'Contracts & Payments']].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{icon}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>{tr(label)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', background: 'var(--card)' }}>
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 4, background: 'var(--muted)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
          {(['en', 'ar'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '4px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, background: lang === l ? 'var(--blue)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--muted-fg)', transition: 'all 0.15s',
            }}>{l.toUpperCase()}</button>
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.3px' }}>{t('welcomeBack')}</h2>
          <p style={{ color: 'var(--muted-fg)', fontSize: 14 }}>{tr('Sign in to your Norvex workspace')}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">{t('email')}</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onEnter} placeholder="you@agency.dz" autoComplete="username" />
          </div>
          <div>
            <label className="label">{tr('Password')}</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={onEnter} placeholder="••••••••" autoComplete="current-password" />
            <p style={{ color: 'var(--muted-fg)', fontSize: 12, margin: '6px 0 0' }}>{tr('Forgot your password? Contact your administrator.')}</p>
          </div>

          {authError && (
            <p style={{ color: '#DC2626', fontSize: 13, margin: '-4px 0 0' }}>{authError}</p>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, marginTop: 4 }} onClick={submit}>{t('signIn')}</button>
        </div>

        <p style={{ marginTop: 40, color: 'var(--muted-fg)', fontSize: 12, textAlign: 'center' }}>
          © 2026 Norvex. All rights reserved.
        </p>
      </div>
    </div>
  );
}
