'use client'

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatDZD } from '../lib/format';
import { normalizeCity as normCity } from '../data/wilayas';
import { tr } from '../i18n';
import TopBar from '../components/layout/TopBar';
import api from '../lib/api';

// ───────────────────────── Texts (EN / AR) ─────────────────────────
const L = {
  en: {
    title: 'Business Analytics',
    overview: 'Performance overview',
    r6: 'Last 6 months', r12: 'Last 12 months', ytd: 'This year',
    export: '↓ Export Report',
    loading: 'Loading analytics...',
    totalRevenue: 'Total Revenue', avgDeal: 'Avg Deal Size',
    conversion: 'Conversion Rate', collection: 'Collection Rate',
    vsPrev: 'vs previous period', noPrev: 'No previous data',
    revTrend: 'Revenue Trend', revSub: 'Monthly paid revenue in DZD',
    revenue: 'Revenue',
    types: 'Property Types', typesSub: 'Distribution of your portfolio',
    agentPerf: 'Agent Performance', agentSub: 'Deals closed & active leads',
    deals: 'Deals', leads: 'Leads',
    city: 'Performance by City', citySub: 'Properties & contract value by location',
    props: 'props',
    funnel: 'Lead Conversion Funnel', funnelSub: 'From new lead to closed deal',
    noData: 'No data yet',
    stages: {
      New: 'New', Contacted: 'Contacted', Qualified: 'Qualified',
      'Visit Scheduled': 'Visit Scheduled', Negotiation: 'Negotiation', Won: 'Won',
    } as Record<string, string>,
  },
  ar: {
    title: 'تحليلات الأعمال',
    overview: 'نظرة عامة على الأداء',
    r6: 'آخر 6 أشهر', r12: 'آخر 12 شهرًا', ytd: 'هذه السنة',
    export: '↓ تصدير التقرير',
    loading: 'جارٍ تحميل التحليلات...',
    totalRevenue: 'إجمالي الإيرادات', avgDeal: 'متوسط قيمة الصفقة',
    conversion: 'معدل التحويل', collection: 'معدل التحصيل',
    vsPrev: 'مقارنة بالفترة السابقة', noPrev: 'لا توجد بيانات سابقة',
    revTrend: 'اتجاه الإيرادات', revSub: 'الإيرادات الشهرية المحصّلة بالدينار',
    revenue: 'الإيرادات',
    types: 'أنواع العقارات', typesSub: 'توزيع محفظة العقارات',
    agentPerf: 'أداء الوكلاء', agentSub: 'الصفقات المغلقة والعملاء النشطون',
    deals: 'الصفقات', leads: 'العملاء',
    city: 'الأداء حسب المدينة', citySub: 'العقارات وقيمة العقود حسب الموقع',
    props: 'عقار',
    funnel: 'قمع تحويل العملاء', funnelSub: 'من العميل الجديد إلى الصفقة المغلقة',
    noData: 'لا توجد بيانات بعد',
    stages: {
      New: 'جديد', Contacted: 'تم التواصل', Qualified: 'مؤهل',
      'Visit Scheduled': 'زيارة مجدولة', Negotiation: 'تفاوض', Won: 'مكتسب',
    } as Record<string, string>,
  },
};

// ───────────────────────── Constants & helpers ─────────────────────────
const STAGE_ORDER = ['New', 'Contacted', 'Qualified', 'Visit Scheduled', 'Negotiation', 'Won'];
const STAGE_COLORS: Record<string, string> = {
  New: '#6B7280', Contacted: '#3B82F6', Qualified: '#8B5CF6',
  'Visit Scheduled': '#F59E0B', Negotiation: '#F97316', Won: '#10B981',
};
const TYPE_COLORS = ['#2563EB', '#7C3AED', '#F59E0B', '#10B981', '#6B7280', '#EF4444', '#06B6D4'];

type Range = '6' | '12' | 'ytd';

const TYPE_AR: Record<string, string> = {
  Apartment: 'شقة', Villa: 'فيلا', Office: 'مكتب', Commercial: 'تجاري', Land: 'أرض', House: 'منزل',
};


const idOf = (x: any) => (x && typeof x === 'object' ? x._id : x);
const toDate = (s?: string) => (s ? new Date(s) : null);
const inWin = (s: string | undefined, start: Date, end: Date) => {
  const d = toDate(s);
  return !!d && !isNaN(d.getTime()) && d >= start && d <= end;
};
const compact = (v: number) => {
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${+(v / 1_000).toFixed(0)}K`;
  return `${v}`;
};

// تاريخ الدفع: paidDate وإلا createdAt (الدفعات الجديدة ما فيهاش paidDate)
const payDate = (p: any) => p.paidDate || p.createdAt;
const contractDate = (c: any) => c.startDate || c.createdAt;

export default function Analytics() {
  const { t, lang } = useApp();
  const T = L[lang];

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('6');
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoading(true);
    setLoadError('');
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
      get('/properties'), get('/leads'), get('/contracts'), get('/payments'), get('/agents'),
    ]).then(([p, l, c, pay, a]) => {
      setProperties(p.data);
      setLeads(l.data);
      setContracts(c.data);
      setPayments(pay.data);
      setAgents(a.data);
      if (errors.length) setLoadError(errors.join(' | '));
    }).finally(() => setLoading(false));
  }, []);

  const A = useMemo(() => {
    const now = new Date();
    const n = range === '6' ? 6 : range === '12' ? 12 : now.getMonth() + 1;
    const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
    const end = now;
    const prevStart = new Date(start.getFullYear(), start.getMonth() - n, 1);
    const prevEnd = new Date(start.getTime() - 1);

    const locale = lang === 'ar' ? 'ar-DZ' : 'en-US';
    const monthFmt = new Intl.DateTimeFormat(locale, { month: 'short' });

    const isClosed = (c: any) => c.status === 'Active' || c.status === 'Completed';

    // ── KPI computation for a window
    const kpis = (s: Date, e: Date) => {
      const paid = payments.filter(p => p.status === 'Paid' && inWin(payDate(p), s, e));
      const revenue = paid.reduce((a, p) => a + (p.amount || 0), 0);

      const cs = contracts.filter(c => isClosed(c) && inWin(contractDate(c), s, e));
      const avgDeal = cs.length ? cs.reduce((a, c) => a + (c.value || 0), 0) / cs.length : 0;

      const ls = leads.filter(l => inWin(l.createdAt, s, e));
      const conv = ls.length ? (ls.filter(l => l.stage === 'Won').length / ls.length) * 100 : 0;

      const allPay = payments.filter(p => inWin(p.status === 'Paid' ? payDate(p) : (p.dueDate || p.createdAt), s, e));
      const allAmount = allPay.reduce((a, p) => a + (p.amount || 0), 0);
      const collection = allAmount ? (revenue / allAmount) * 100 : 0;

      return { revenue, avgDeal, conv, collection, hasLeads: ls.length > 0, hasPay: allPay.length > 0, hasDeals: cs.length > 0 };
    };

    const cur = kpis(start, end);
    const prev = kpis(prevStart, prevEnd);

    const pct = (c: number, p: number) => (p > 0 ? ((c - p) / p) * 100 : null);
    const diff = (c: number, p: number, has: boolean) => (has ? c - p : null);

    const kpiCards = [
      { label: T.totalRevenue, value: formatDZD(cur.revenue), color: 'var(--blue)', delta: pct(cur.revenue, prev.revenue), unit: '%' },
      { label: T.avgDeal, value: formatDZD(Math.round(cur.avgDeal)), color: 'var(--green)', delta: pct(cur.avgDeal, prev.avgDeal), unit: '%' },
      { label: T.conversion, value: `${cur.conv.toFixed(0)}%`, color: 'var(--purple)', delta: diff(cur.conv, prev.conv, prev.hasLeads), unit: ' pt' },
      { label: T.collection, value: `${cur.collection.toFixed(0)}%`, color: 'var(--orange)', delta: diff(cur.collection, prev.collection, prev.hasPay), unit: ' pt' },
    ];

    // ── Monthly revenue trend
    const months = Array.from({ length: n }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      return { y: d.getFullYear(), m: d.getMonth(), label: monthFmt.format(d) };
    });
    const revenueData = months.map(({ y, m, label }) => ({
      month: label,
      revenue: payments
        .filter(p => p.status === 'Paid')
        .filter(p => { const d = toDate(payDate(p)); return !!d && d.getFullYear() === y && d.getMonth() === m; })
        .reduce((a, p) => a + (p.amount || 0), 0),
    }));

    // ── Property types (whole portfolio)
    const typeCount: Record<string, number> = {};
    properties.forEach(p => { const k = p.type || '—'; typeCount[k] = (typeCount[k] || 0) + 1; });
    const typeData = Object.keys(typeCount)
      .sort((a, b) => typeCount[b] - typeCount[a])
      .map((name, i) => ({
        name, value: typeCount[name],
        pct: properties.length ? Math.round((typeCount[name] / properties.length) * 100) : 0,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
      }));

    // ── Agent performance (computed from real contracts & leads)
    const dealsBy: Record<string, number> = {};
    contracts.filter(c => isClosed(c) && inWin(contractDate(c), start, end)).forEach(c => {
      const id = idOf(c.agent); if (id) dealsBy[id] = (dealsBy[id] || 0) + 1;
    });
    const leadsBy: Record<string, number> = {};
    leads.filter(l => !['Won', 'Lost'].includes(l.stage)).forEach(l => {
      const id = idOf(l.agent); if (id) leadsBy[id] = (leadsBy[id] || 0) + 1;
    });
    const agentPerf = agents
      .map(a => ({ name: (a.name || '').split(' ')[0], deals: dealsBy[a._id] || 0, leads: leadsBy[a._id] || 0 }))
      .sort((x, y) => (y.deals + y.leads) - (x.deals + x.leads))
      .slice(0, 6);

    // ── Cities (properties count + value of signed contracts)
    const cityMap: Record<string, { properties: number; revenue: number }> = {};
    properties.forEach(p => {
      const c = normCity(p.city) || '—';
      cityMap[c] = cityMap[c] || { properties: 0, revenue: 0 };
      cityMap[c].properties += 1;
    });
    contracts.filter(isClosed).forEach(c => {
      const city = normCity(c.property?.city) || '—';
      if (city !== '—' && cityMap[city]) cityMap[city].revenue += c.value || 0;
    });
    const cityData = Object.entries(cityMap)
      .map(([city, v]) => ({ city, ...v }))
      .sort((a, b) => b.properties - a.properties)
      .slice(0, 6);

    // ── Funnel (leads created in selected period)
    const periodLeads = leads.filter(l => inWin(l.createdAt, start, end));
    const funnelData = STAGE_ORDER.map(stage => ({
      stage: T.stages[stage],
      count: periodLeads.filter(l => l.stage === stage).length,
      color: STAGE_COLORS[stage],
    }));

    return { kpiCards, revenueData, typeData, agentPerf, cityData, funnelData, cur };
  }, [range, lang, properties, leads, contracts, payments, agents]);

  // ── Export CSV (with BOM so Arabic opens correctly in Excel)
  const exportReport = () => {
    const rows: (string | number)[][] = [
      [T.title], [],
      ['KPI', 'Value'],
      ...A.kpiCards.map(k => [k.label, k.value]),
      [],
      ['Month', T.revenue + ' (DZD)'],
      ...A.revenueData.map(r => [r.month, r.revenue]),
      [],
      [T.agentPerf, T.deals, T.leads],
      ...A.agentPerf.map(a => [a.name, a.deals, a.leads]),
      [],
      [T.city, T.props, 'DZD'],
      ...A.cityData.map(c => [c.city, c.properties, c.revenue]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const subtitleDate = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : 'en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const maxCity = Math.max(1, ...A.cityData.map(c => c.properties));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar title={t('analytics')} />
        <div className="page-content">
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--muted-fg)' }}>{T.loading}</div>
        </div>
      </div>
    );
  }

  const Empty = () => (
    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted-fg)', fontSize: 13 }}>{T.noData}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('analytics')} />
      <div className="page-content">
        {loadError && (
          <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16 }}>
            {tr('Could not load data from the server.')} {loadError}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>{T.title}</h2>
            <p style={{ color: 'var(--muted-fg)', fontSize: 14 }}>{T.overview} · {subtitleDate}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={range} onChange={e => setRange(e.target.value as Range)}>
              <option value="6">{T.r6}</option>
              <option value="12">{T.r12}</option>
              <option value="ytd">{T.ytd}</option>
            </select>
            <button className="btn-secondary" onClick={exportReport}>{T.export}</button>
          </div>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {A.kpiCards.map(k => {
            const up = (k.delta ?? 0) >= 0;
            return (
              <div key={k.label} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginBottom: 8, fontWeight: 500 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: '-0.5px', marginBottom: 4 }}><span dir="ltr" style={{ unicodeBidi: 'isolate' }}>{k.value}</span></div>
                {k.delta === null ? (
                  <div style={{ fontSize: 12, color: 'var(--muted-fg)', fontWeight: 500 }}>{T.noPrev}</div>
                ) : (
                  <div style={{ fontSize: 12, color: up ? 'var(--green)' : '#EF4444', fontWeight: 500 }}>
                    {up ? '↑' : '↓'} {up ? '+' : '-'}{Math.abs(k.delta).toFixed(0)}{k.unit} {T.vsPrev}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue trend + property types */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{T.revTrend}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 20 }}>{T.revSub}</div>
            <div dir="ltr"><ResponsiveContainer width="100%" height={220}>
              <AreaChart data={A.revenueData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--muted-fg)', fontSize: 12 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={compact} allowDecimals={false} width={44} />
                <Tooltip formatter={(v: any) => [formatDZD(Number(v)), T.revenue]} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fill="url(#areaGrad)" dot={{ fill: '#2563EB', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer></div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{T.types}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 16 }}>{T.typesSub}</div>
            {A.typeData.length === 0 ? <Empty /> : (
              <>
                <div dir="ltr"><ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={A.typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3}>
                      {A.typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {A.typeData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--muted-fg)' }}>{lang === 'ar' ? (TYPE_AR[d.name] ?? d.name) : d.name}</span>
                      <span dir="ltr" style={{ fontWeight: 600, unicodeBidi: 'isolate' }}>{d.value} · {d.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Agent performance + City breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{T.agentPerf}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 20 }}>{T.agentSub}</div>
            {A.agentPerf.length === 0 ? <Empty /> : (
              <div dir="ltr"><ResponsiveContainer width="100%" height={Math.max(200, A.agentPerf.length * 56)}>
                <BarChart data={A.agentPerf} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--fg)', fontSize: 12 }} axisLine={false} tickLine={false} width={65} interval={0} />
                  <Tooltip />
                  <Bar dataKey="deals" fill="#2563EB" radius={[0, 4, 4, 0]} name={T.deals} />
                  <Bar dataKey="leads" fill="#93C5FD" radius={[0, 4, 4, 0]} name={T.leads} />
                </BarChart>
              </ResponsiveContainer></div>
            )}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{T.city}</div>
            <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 14 }}>{T.citySub}</div>
            {A.cityData.length === 0 ? <Empty /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {A.cityData.map(c => (
                  <div key={c.city}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>📍 {tr(c.city)}</span>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted-fg)' }}>
                        <span>{c.properties} {T.props}</span>
                        <span dir="ltr" style={{ fontWeight: 600, color: 'var(--blue)', unicodeBidi: 'isolate' }}>{formatDZD(c.revenue)}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--muted)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.properties / maxCity) * 100}%`, background: 'var(--blue)', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leads funnel */}
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{T.funnel}</div>
          <div style={{ color: 'var(--muted-fg)', fontSize: 12.5, marginBottom: 20 }}>{T.funnelSub}</div>
          <div dir="ltr"><ResponsiveContainer width="100%" height={230}>
            <BarChart data={A.funnelData} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--muted-fg)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis dataKey="stage" type="category" tick={{ fill: 'var(--fg)', fontSize: 12 }} axisLine={false} tickLine={false} width={110} interval={0} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {A.funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer></div>
        </div>
      </div>
    </div>
  );
}