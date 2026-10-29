'use client'

import { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatDZD } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import { tr } from '../i18n';
import api from '../lib/api';
import { Building, Users, CalendarDays, CheckCircle, DollarSign, ArrowUpRight } from '../components/ui/Icons';

function StatCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: color + '14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: color,
        }}>
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--fg)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginTop: 5, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  property: <Building size={15} color="#2563EB" />,
  visit: <CalendarDays size={15} color="#F59E0B" />,
  contract: <CheckCircle size={15} color="#10B981" />,
  payment: <DollarSign size={15} color="#10B981" />,
  lead: <Users size={15} color="#8B5CF6" />,
};

const ChartTooltip = ({ active, payload, label, dealsLabel = 'deals' }: { dealsLabel?: string; active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 12.5, minWidth: 140 }}>
      <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--muted-fg)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {p.dataKey === 'revenue' ? formatDZD(p.value) : `${p.value} ${dealsLabel}`}
        </div>
      ))}
    </div>
  );
};


const L = {
  en: {
    loading: 'Loading dashboard...',
    last6: 'Last 6 months · DZD',
    total: (n: number) => `${n} total`,
    noProps: 'No properties yet',
    dealsPerMonth: 'Contracts started per month',
    pipeline: 'Pipeline stage distribution',
    deals: 'deals',
    noActivity: 'No recent activity',
    viewAll: 'View all',
    noVisits: 'No visits scheduled today',
    today: 'TODAY',
    unknown: 'Unknown',
    aClient: 'a client',
    aProperty: 'property',
    newProperty: 'New property listed',
    newLead: 'New lead',
    visitFor: (n: string) => `Visit scheduled for ${n}`,
    contractSigned: (n: string) => `Contract signed: ${n}`,
    paymentRecorded: (a: string) => `Payment of ${a} recorded`,
    status: { Available: 'Available', Reserved: 'Reserved', Sold: 'Sold', Rented: 'Rented' } as Record<string, string>,
    stages: { New: 'New', Contacted: 'Contacted', Qualified: 'Qualified', 'Visit Scheduled': 'Visit Scheduled', Negotiation: 'Negotiation', Won: 'Won' } as Record<string, string>,
  },
  ar: {
    loading: 'جارٍ تحميل لوحة التحكم...',
    last6: 'آخر 6 أشهر · دج',
    total: (n: number) => `الإجمالي: ${n}`,
    noProps: 'لا توجد عقارات بعد',
    dealsPerMonth: 'العقود المبرمة شهريًا',
    pipeline: 'توزيع مراحل العملاء',
    deals: 'صفقات',
    noActivity: 'لا يوجد نشاط حديث',
    viewAll: 'عرض الكل',
    noVisits: 'لا توجد زيارات مجدولة اليوم',
    today: 'اليوم',
    unknown: 'غير معروف',
    aClient: 'عميل',
    aProperty: 'عقار',
    newProperty: 'عقار جديد',
    newLead: 'عميل محتمل جديد',
    visitFor: (n: string) => `زيارة مجدولة مع ${n}`,
    contractSigned: (n: string) => `عقد موقّع: ${n}`,
    paymentRecorded: (a: string) => `تم تسجيل دفعة بقيمة ${a}`,
    status: { Available: 'متاح', Reserved: 'محجوز', Sold: 'مباع', Rented: 'مؤجر' } as Record<string, string>,
    stages: { New: 'جديد', Contacted: 'تم التواصل', Qualified: 'مؤهل', 'Visit Scheduled': 'زيارة مجدولة', Negotiation: 'تفاوض', Won: 'مكتسب' } as Record<string, string>,
  },
};

const STATUS_COLORS: Record<string, string> = { Available: '#10B981', Reserved: '#F59E0B', Sold: '#2563EB', Rented: '#8B5CF6' };
const STAGE_ORDER = ['New', 'Contacted', 'Qualified', 'Visit Scheduled', 'Negotiation', 'Won'];
const STAGE_COLORS: Record<string, string> = {
  New: '#6B7280', Contacted: '#3B82F6', Qualified: '#8B5CF6',
  'Visit Scheduled': '#F59E0B', Negotiation: '#F97316', Won: '#10B981',
};

function lastNMonths(n: number, locale: string) {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  const now = new Date();
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: fmt.format(d) });
  }
  return arr;
}

export default function Dashboard() {
  const { t, lang, setPage, isAdmin, agentId, meLoaded } = useApp();
  const D = L[lang];
  const locale = lang === 'ar' ? 'ar-DZ' : 'en-US';
  const [loading, setLoading] = useState(true);
  const [allProperties, setProperties] = useState<any[]>([]);
  // الوكيل يشوف فقط عقاراتو (العقارات مشتركة في القائمة، لكن الـDashboard تاعو يخص خدمتو)
  const properties = useMemo(
    () => (isAdmin ? allProperties : allProperties.filter((p: any) => (p.agent?._id ?? p.agent) === agentId)),
    [allProperties, isAdmin, agentId],
  );
  const [leads, setLeads] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const errors: string[] = [];
    const get = (url: string) =>
      api.get(url).catch((err) => {
        const status = err?.response?.status;
        if (status === 401) {
          // token منتهي أو غالط -> نرجعو للـlogin
          localStorage.removeItem('token');
          window.location.reload();
        }
        errors.push(`${url}: ${status ? 'HTTP ' + status : (err?.message || 'network error')}`);
        return { data: [] };
      });
    Promise.all([
      get('/properties'), get('/leads'), get('/visits'), get('/contracts'), get('/payments'),
    ]).then(([p, l, v, c, pay]) => {
      setProperties(p.data);
      setLeads(l.data);
      setVisits(v.data);
      setContracts(c.data);
      setPayments(pay.data);
      if (errors.length) setLoadError(errors.join(' | '));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar title={t('dashboard')} />
        <div className="page-content">
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted-fg)' }}>{D.loading}</div>
        </div>
      </div>
    );
  }

  // KPIs
  const totalProperties = properties.length;
  const activeLeads = leads.filter(l => !['Won', 'Lost'].includes(l.stage)).length;
  const scheduledVisits = visits.filter(v => v.status === 'Scheduled').length;
  const closedDeals = contracts.filter(c => c.status === 'Completed' || c.status === 'Active').length;
  const totalRevenue = payments.filter(p => p.status === 'Paid').reduce((a, p) => a + p.amount, 0);

  // Property status donut
  const statusCounts: Record<string, number> = {};
  properties.forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1; });
  const propertyStatusData = Object.keys(statusCounts).map(name => ({
    name, value: statusCounts[name], color: STATUS_COLORS[name] || '#9CA3AF',
  }));

  // Leads funnel
  const stageCounts: Record<string, number> = {};
  leads.forEach(l => { stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1; });
  const funnelData = STAGE_ORDER.map(stage => ({ stage: D.stages[stage], count: stageCounts[stage] || 0, color: STAGE_COLORS[stage] }));
  const maxFunnel = Math.max(1, ...funnelData.map(d => d.count));

  // Revenue over last 6 months (from paid payments, by paidDate)
  const months = lastNMonths(6, locale);
  const revenueData = months.map(m => {
    const [y, mo] = m.key.split('-').map(Number);
    const revenue = payments
      .filter(p => p.status === 'Paid' && (p.paidDate || p.createdAt))
      .filter(p => { const d = new Date(p.paidDate || p.createdAt); return d.getFullYear() === y && d.getMonth() === mo; })
      .reduce((a, p) => a + p.amount, 0);
    const deals = contracts
      .filter(c => c.startDate)
      .filter(c => { const d = new Date(c.startDate); return d.getFullYear() === y && d.getMonth() === mo; })
      .length;
    return { month: m.label, revenue, deals };
  });

  // Recent activity (combine latest items across entities)
  type ActEntry = { type: string; text: string; time: string; ts: number };
  const activity: ActEntry[] = [];
  properties.forEach(p => p.createdAt && activity.push({ type: 'property', text: `${D.newProperty}: ${p.title}`, time: new Date(p.createdAt).toLocaleDateString(locale), ts: new Date(p.createdAt).getTime() }));
  leads.forEach(l => l.createdAt && activity.push({ type: 'lead', text: `${D.newLead}: ${l.name}`, time: new Date(l.createdAt).toLocaleDateString(locale), ts: new Date(l.createdAt).getTime() }));
  visits.forEach(v => v.createdAt && activity.push({ type: 'visit', text: D.visitFor(v.client?.name || D.aClient), time: new Date(v.createdAt).toLocaleDateString(locale), ts: new Date(v.createdAt).getTime() }));
  contracts.forEach(c => c.createdAt && activity.push({ type: 'contract', text: D.contractSigned(c.property?.title || D.aProperty), time: new Date(c.createdAt).toLocaleDateString(locale), ts: new Date(c.createdAt).getTime() }));
  payments.forEach(p => p.createdAt && activity.push({ type: 'payment', text: D.paymentRecorded(formatDZD(p.amount)), time: new Date(p.createdAt).toLocaleDateString(locale), ts: new Date(p.createdAt).getTime() }));
  const recentActivity = activity.sort((a, b) => b.ts - a.ts).slice(0, 6);

  // Today's visits
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.date === todayStr).slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('dashboard')} />
      <div className="page-content">
        {!isAdmin && meLoaded && !agentId && (
          <div style={{ background: '#FEF3C7', color: '#92400E', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {tr('Your account is not linked to an agent profile yet. Ask your administrator to link it so you can see your data.')}
          </div>
        )}
        {!isAdmin && agentId && (
          <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 12 }}>{tr('Showing only your own activity.')}</div>
        )}
        {loadError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            ⚠ Failed to load data from the backend — {loadError}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard label={t('totalProperties')} value={totalProperties.toString()} color="#2563EB" icon={<Building size={19} color="currentColor" />} />
          <StatCard label={t('activeLeads')} value={activeLeads.toString()} color="#10B981" icon={<Users size={19} color="currentColor" />} />
          <StatCard label={t('scheduledVisits')} value={scheduledVisits.toString()} color="#F59E0B" icon={<CalendarDays size={19} color="currentColor" />} />
          <StatCard label={t('closedDeals')} value={closedDeals.toString()} color="#8B5CF6" icon={<CheckCircle size={19} color="currentColor" />} />
          <StatCard label={t('totalRevenue')} value={formatDZD(totalRevenue)} color="#F97316" icon={<DollarSign size={19} color="currentColor" />} />
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{t('revenueOverview')}</div>
                <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginTop: 2 }}>{D.last6}</div>
              </div>
            </div>
            <div dir="ltr"><ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted-fg)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000000 ? `${+(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${+(v / 1000).toFixed(0)}K` : `${v}`} allowDecimals={false} width={44} />
                <Tooltip content={<ChartTooltip dealsLabel={D.deals} />} cursor={{ stroke: 'var(--border)', strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: '#2563EB', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer></div>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{t('propertyStatus')}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 14 }}>{D.total(totalProperties)}</div>
            {propertyStatusData.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted-fg)', padding: '30px 0', fontSize: 13 }}>{D.noProps}</div>
            ) : (
              <>
                <div dir="ltr"><ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={propertyStatusData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                      {propertyStatusData.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, D.status[name] ?? name]} />
                  </PieChart>
                </ResponsiveContainer></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
                  {propertyStatusData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--muted-fg)' }}>{D.status[d.name] ?? d.name}</span>
                      <span style={{ fontWeight: 700 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{t('monthlyDeals')}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 18 }}>{D.dealsPerMonth}</div>
            <div dir="ltr"><ResponsiveContainer width="100%" height={155}>
              <BarChart data={revenueData} barSize={24} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted-fg)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip dealsLabel={D.deals} />} cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                <Bar dataKey="deals" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer></div>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{t('leadsFunnel')}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 18 }}>{D.pipeline}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {funnelData.map(d => (
                <div key={d.stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 90, fontSize: 12.5, color: 'var(--muted-fg)', flexShrink: 0 }}>{d.stage}</div>
                  <div style={{ flex: 1, height: 7, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(d.count / maxFunnel) * 100}%`, background: d.color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ width: 22, fontSize: 12.5, fontWeight: 700, textAlign: 'end', color: 'var(--fg)' }}>{d.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t('recentActivity')}</div>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted-fg)', padding: '30px 0', fontSize: 13 }}>{D.noActivity}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recentActivity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {ACTIVITY_ICONS[a.type] ?? <Building size={15} color="var(--muted-fg)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{a.text}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 3 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{t('todayVisits')}</div>
              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setPage('visits')}>{D.viewAll}</button>
            </div>
            {todayVisits.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted-fg)', padding: '32px 0', fontSize: 13.5 }}>
                {D.noVisits}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayVisits.map(v => (
                  <div key={v._id} style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: 'var(--muted)', borderRadius: 8, alignItems: 'center',
                  }}>
                    <div style={{
                      textAlign: 'center', minWidth: 48,
                      background: 'var(--blue)', borderRadius: 7, padding: '6px 4px',
                      flexShrink: 0,
                    }}>
                      <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.65)', fontWeight: 700, letterSpacing: '0.08em' }}>{D.today}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginTop: 1 }}>{v.time || '—'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.client?.name || D.unknown}</div>
                      <div style={{ color: 'var(--muted-fg)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.property?.title || D.unknown}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-fg)', flexShrink: 0 }}>{v.agent?.name?.split(' ')[0] || ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}