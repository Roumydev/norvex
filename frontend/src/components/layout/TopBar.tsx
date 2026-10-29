'use client'

import { useState, useEffect, useRef } from 'react';
import { useApp, initialsOf } from '../../context/AppContext';
import { Search, Bell, Sun, Moon, UserCircle } from '../ui/Icons';
import api from '../../lib/api';
import { tr } from '../../i18n';

interface SearchResults {
  properties: { _id: string; title: string; city?: string; district?: string }[];
  clients: { _id: string; name: string; phone?: string; email?: string }[];
  agents: { _id: string; name: string; email?: string; phone?: string }[];
}
interface SearchItem { key: string; group: string; page: 'property-detail' | 'client-detail' | 'agent-detail'; id: string; icon: string; title: string; sub: string }

export default function TopBar({ title }: { title: string }) {
  const { t, lang, setLang, dark, toggleDark, page, setPage, goBack, toggleSidebar, unreadCount, userName, userEmail } = useApp();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  // بحث عام (بعد 250ms من آخر حرف)
  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) { setResults(null); setSearching(false); setSearchError(false); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      api.get('/search', { params: { q: term } })
        .then(res => { if (!cancelled) { setResults(res.data); setSearchError(false); setActive(0); } })
        .catch(() => { if (!cancelled) { setResults(null); setSearchError(true); } })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search]);

  // نسدو القائمة بالضغط برا
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const items: SearchItem[] = results ? [
    ...results.properties.map(p => ({ key: 'p' + p._id, group: 'Properties', page: 'property-detail' as const, id: p._id, icon: '🏠', title: p.title, sub: [p.district, p.city].filter(Boolean).join(', ') })),
    ...results.clients.map(c => ({ key: 'c' + c._id, group: 'Clients', page: 'client-detail' as const, id: c._id, icon: '👤', title: c.name, sub: c.phone || c.email || '' })),
    ...results.agents.map(a => ({ key: 'a' + a._id, group: 'Agents', page: 'agent-detail' as const, id: a._id, icon: '🧑‍💼', title: a.name, sub: a.email || a.phone || '' })),
  ] : [];

  const go = (it: SearchItem) => {
    setPage(it.page, it.id);
    setOpen(false);
    setSearch('');
    setResults(null);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + items.length) % items.length); }
    else if (e.key === 'Enter') { e.preventDefault(); go(items[Math.min(active, items.length - 1)]); }
  };

  const term = search.trim();
  const showPanel = open && term.length > 0;

  return (
    <div className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="hamburger-btn"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Search */}
      <div ref={boxRef} style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)', display: 'flex', alignItems: 'center' }}>
          <Search size={14} color="currentColor" />
        </span>
        <input
          className="input"
          style={{ paddingLeft: 32, background: 'var(--muted)', border: '1px solid transparent', fontSize: 13, height: 34 }}
          placeholder={t('search')}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label={t('search')}
          autoComplete="off"
        />
        {showPanel && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, width: '100%', minWidth: 300, maxHeight: 420, overflowY: 'auto', zIndex: 60,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 12px 32px rgba(0,0,0,0.16)', padding: 6,
          }}>
            {term.length < 2 ? (
              <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--muted-fg)' }}>{tr('Type at least 2 characters to search.')}</div>
            ) : searching && !results ? (
              <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--muted-fg)' }}>{tr('Searching...')}</div>
            ) : searchError ? (
              <div style={{ padding: '10px 12px', fontSize: 12.5, color: '#DC2626' }}>{tr('Search failed. Try again.')}</div>
            ) : items.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--muted-fg)' }}>{tr('No results found')}</div>
            ) : (
              ['Properties', 'Clients', 'Agents'].map(group => {
                const rows = items.filter(i => i.group === group);
                if (!rows.length) return null;
                return (
                  <div key={group}>
                    <div style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 700, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tr(group)}</div>
                    {rows.map(it => {
                      const idx = items.indexOf(it);
                      return (
                        <button
                          key={it.key}
                          onClick={() => go(it)}
                          onMouseEnter={() => setActive(idx)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'start', padding: '8px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
                            background: idx === active ? 'var(--muted)' : 'transparent', color: 'var(--fg)',
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{it.icon}</span>
                          <span style={{ minWidth: 0, flex: 1 }}>
                            <span style={{ display: 'block', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                            {it.sub && <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.sub}</span>}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Page title — center */}
      <div className="topbar-title" style={{ flex: 1, textAlign: 'center', fontWeight: 600, fontSize: 13.5, color: 'var(--fg)', letterSpacing: '-0.1px' }}>
        {title}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Language toggle */}
        <div style={{
          display: 'flex', gap: 2,
          background: 'var(--muted)', borderRadius: 7, padding: 2,
          border: '1px solid var(--border)',
        }}>
          {(['en', 'ar'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '3px 9px', borderRadius: 5, border: 'none', cursor: 'pointer',
                fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
                background: lang === l ? 'var(--blue)' : 'transparent',
                color: lang === l ? '#fff' : 'var(--muted-fg)',
                transition: 'all 0.15s',
              }}
            >{l.toUpperCase()}</button>
          ))}
        </div>

        {/* Dark mode */}
        <button
          onClick={toggleDark}
          className="btn-ghost"
          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7 }}
          title={dark ? 'Light mode' : 'Dark mode'}
        >
          {dark ? <Sun size={16} color="currentColor" /> : <Moon size={16} color="currentColor" />}
        </button>

        {/* Notifications */}
        <button
          className="btn-ghost"
          style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, position: 'relative' }}
          onClick={() => (page === 'notifications' ? goBack() : setPage('notifications'))}
          title="Notifications"
        >
          <Bell size={16} color="currentColor" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -3, insetInlineEnd: -3,
              minWidth: 15, height: 15, padding: '0 4px', boxSizing: 'border-box',
              background: 'var(--red)', color: '#fff', fontSize: 9.5, fontWeight: 700, lineHeight: '15px',
              borderRadius: 99, border: '1.5px solid var(--card)', textAlign: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={() => (page === 'profile' ? goBack() : setPage('profile'))}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--blue)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 11.5, letterSpacing: '-0.3px',
            marginLeft: 4,
          }}
          title="Profile"
        >{initialsOf(userName, userEmail)}</button>
      </div>
    </div>
  );
}