'use client'

import { useApp, initialsOf, Page } from '../../context/AppContext';
import {
  LayoutDashboard, Building, Users, UserCheck, TrendingUp,
  CalendarDays, FileText, CreditCard, BarChart2, Bell,
  SettingsIcon, LogOut, NorvexLogo, X,
} from '../ui/Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  page: Page;
  currentPage: Page;
  onClick: () => void;
}

function NavItem({ icon, label, page, currentPage, onClick }: NavItemProps) {
  const isActive = currentPage === page;
  return (
    <button
      className={`sidebar-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{ gap: 10 }}
    >
      <span style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        flexShrink: 0,
        opacity: isActive ? 1 : 0.65,
        transition: 'opacity 0.15s',
      }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <div className="sidebar-section-label">{label}</div>;
}

export default function Sidebar() {
  const { page, setPage, t, logout, sidebarOpen, closeSidebar, userEmail, userName } = useApp();
  const go = (p: Page) => () => setPage(p);

  return (
    <>
      {/* Mobile overlay — only visible when sidebar is open on small screens */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}

      <nav className={`norvex-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '18px 18px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          overflow: 'hidden',
        }}>
          <div style={{ minWidth: 0, flex: '0 1 auto', overflow: 'hidden', display: 'flex' }}>
            <NorvexLogo width={130} className="text-white" />
          </div>
          <button
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close menu"
          >
            <X size={18} color="currentColor" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          <NavItem
            icon={<LayoutDashboard size={16} color="currentColor" />}
            label={t('dashboard')}
            page="dashboard"
            currentPage={page}
            onClick={go('dashboard')}
          />

          <SectionLabel label={t('management')} />
          <NavItem icon={<Building size={16} color="currentColor" />} label={t('properties')} page="properties" currentPage={page} onClick={go('properties')} />
          <NavItem icon={<Users size={16} color="currentColor" />} label={t('clients')} page="clients" currentPage={page} onClick={go('clients')} />
          <NavItem icon={<UserCheck size={16} color="currentColor" />} label={t('agents')} page="agents" currentPage={page} onClick={go('agents')} />

          <SectionLabel label={t('crm')} />
          <NavItem icon={<TrendingUp size={16} color="currentColor" />} label={t('leads')} page="leads" currentPage={page} onClick={go('leads')} />
          <NavItem icon={<CalendarDays size={16} color="currentColor" />} label={t('visits')} page="visits" currentPage={page} onClick={go('visits')} />

          <SectionLabel label={t('transactions')} />
          <NavItem icon={<FileText size={16} color="currentColor" />} label={t('contracts')} page="contracts" currentPage={page} onClick={go('contracts')} />
          <NavItem icon={<CreditCard size={16} color="currentColor" />} label={t('payments')} page="payments" currentPage={page} onClick={go('payments')} />

          <SectionLabel label={t('insights')} />
          <NavItem icon={<BarChart2 size={16} color="currentColor" />} label={t('analytics')} page="analytics" currentPage={page} onClick={go('analytics')} />
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '8px 10px' }}>
          <NavItem icon={<Bell size={16} color="currentColor" />} label={t('notifications')} page="notifications" currentPage={page} onClick={go('notifications')} />
          <NavItem icon={<SettingsIcon size={16} color="currentColor" />} label={t('settings')} page="settings" currentPage={page} onClick={go('settings')} />

          {/* User row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px 6px',
            marginTop: 4,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
              letterSpacing: '-0.3px',
            }}>{initialsOf(userName, userEmail)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 600, lineHeight: 1.3 }}>{userName || userEmail || 'Admin User'}</div>
              <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail || 'admin@norvex.dz'}</div>
            </div>
            <button
              onClick={logout}
              title={t('signOut')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              <LogOut size={15} color="currentColor" />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}