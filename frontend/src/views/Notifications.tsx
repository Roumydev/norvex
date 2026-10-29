'use client'

import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import TopBar from '../components/layout/TopBar';
import { buildNotifications, ago, Notif } from '../lib/notifications';
import { tr } from '../i18n';

const TYPE_COLORS: Record<string, string> = {
  payment: '#10B981', visit: '#2563EB', contract: '#7C3AED',
  lead: '#F59E0B', alert: '#EF4444', property: '#F97316',
};

export default function Notifications() {
  const { t, lang, setPage, notifRaw, notifLoading: loading, readIds, markNotifRead, markAllNotifsRead } = useApp();
  const locale = lang === 'ar' ? 'ar-DZ' : 'en-US';
  const [filter, setFilter] = useState('all');

  const all: Notif[] = useMemo(() => buildNotifications(notifRaw, locale), [notifRaw, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const markRead = markNotifRead;
  const markAllRead = markAllNotifsRead;

  const isRead = (n: Notif) => readIds.has(n.id);
  const filtered = filter === 'unread' ? all.filter(n => !isRead(n)) : all;
  const unreadCount = all.filter(n => !isRead(n)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('notifications')} />
      <div className="page-content" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h2 style={{ fontWeight: 700, fontSize: 18 }}>{tr('Notifications')}</h2>
            {unreadCount > 0 && (
              <span style={{ background: 'var(--red)', color: '#fff', borderRadius: 99, padding: '2px 8px', fontSize: 11.5, fontWeight: 700 }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--muted)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {[['all', 'All'], ['unread', 'Unread']].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, background: filter === v ? 'var(--card)' : 'transparent', color: filter === v ? 'var(--fg)' : 'var(--muted-fg)', transition: 'all 0.15s' }}>{tr(l)}</button>
              ))}
            </div>
            {unreadCount > 0 && <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={markAllRead}>{tr('Mark all read')}</button>}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted-fg)' }}>…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted-fg)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
              <div>{tr('No notifications')}</div>
            </div>
          ) : (
            filtered.map((n, i) => {
              const read = isRead(n);
              return (
                <div key={n.id} onClick={() => { markRead(n.id); setPage(n.page as any); }} style={{
                  display: 'flex', gap: 14, padding: '16px 20px', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  background: !read ? 'var(--blue-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (read) e.currentTarget.style.background = 'var(--muted)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = !read ? 'var(--blue-light)' : 'transparent'; }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: TYPE_COLORS[n.type] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontWeight: read ? 400 : 600, fontSize: 14 }}>{tr(n.title)}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', whiteSpace: 'nowrap' }}>{ago(n.at, locale)}</div>
                    </div>
                    <div style={{ color: 'var(--muted-fg)', fontSize: 13, marginTop: 2, lineHeight: 1.5 }}>{n.desc}</div>
                  </div>
                  {!read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 6 }} />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}