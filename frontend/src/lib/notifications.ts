import { formatDZD } from './format';
import { tr } from '../i18n';
import { normalizeCity } from '../data/wilayas';

export type Notif = {
  id: string; icon: string; type: string; title: string; desc: string; at: number; page: string;
};

export type NotifRaw = { payments: any[]; visits: any[]; contracts: any[]; leads: any[]; properties: any[] };

export const EMPTY_RAW: NotifRaw = { payments: [], visits: [], contracts: [], leads: [], properties: [] };
export const READ_KEY = 'norvex_read_notifications';
export const DAY = 24 * 60 * 60 * 1000;

const ts = (s?: string) => { const d = s ? new Date(s).getTime() : NaN; return isNaN(d) ? 0 : d; };

export async function fetchNotifRaw(api: { get: (url: string) => Promise<{ data: any[] }> }): Promise<NotifRaw> {
  const get = (url: string) => api.get(url).then(r => r.data).catch(() => []);
  const [payments, visits, contracts, leads, properties] = await Promise.all([
    get('/payments'), get('/visits'), get('/contracts'), get('/leads'), get('/properties'),
  ]);
  return { payments, visits, contracts, leads, properties };
}

export function ago(at: number, locale: string) {
  const min = Math.floor((Date.now() - at) / 60000);
  if (min < 1) return tr('just now');
  if (min < 60) return tr('{n} min ago', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return tr('{n} h ago', { n: h });
  const d = Math.floor(h / 24);
  if (d < 30) return tr('{n} d ago', { n: d });
  return new Date(at).toLocaleDateString(locale);
}

// نبنيو الإشعارات من الداتا الحقيقية (الأحدث أولا)
export function buildNotifications(raw: NotifRaw, locale: string): Notif[] {
  const list: Notif[] = [];
  const now = Date.now();

  raw.payments.forEach(p => {
    const client = p.contract?.client?.name || '—';
    const amount = formatDZD(p.amount || 0);
    if (p.status === 'Paid') {
      list.push({
        id: `payment:${p._id}`, icon: '💰', type: 'payment', page: 'payments',
        title: 'Payment received',
        desc: tr('{amount} received from {client}', { amount, client }),
        at: ts(p.paidDate || p.createdAt),
      });
    } else if (p.status === 'Overdue' || (p.status === 'Pending' && ts(p.dueDate) && ts(p.dueDate) < now)) {
      list.push({
        id: `overdue:${p._id}`, icon: '⚠️', type: 'alert', page: 'payments',
        title: 'Overdue payment',
        desc: tr('{amount} from {client} is overdue (due {date})', { amount, client, date: new Date(p.dueDate).toLocaleDateString(locale) }),
        at: ts(p.dueDate) || ts(p.createdAt),
      });
    }
  });

  raw.visits.filter(v => v.status === 'Scheduled').forEach(v => {
    list.push({
      id: `visit:${v._id}`, icon: '📅', type: 'visit', page: 'visits',
      title: 'Visit scheduled',
      desc: tr('{client} — {property} — {date} at {time}', {
        client: v.client?.name || '—', property: v.property?.title || '—',
        date: v.date ? new Date(v.date).toLocaleDateString(locale) : '—', time: v.time || '',
      }),
      at: ts(v.createdAt) || ts(v.date),
    });
  });

  raw.contracts.filter(c => c.status === 'Active' || c.status === 'Completed').forEach(c => {
    list.push({
      id: `contract:${c._id}`, icon: '📄', type: 'contract', page: 'contracts',
      title: 'Contract signed',
      desc: tr('{property} — contract with {client}', { property: c.property?.title || '—', client: c.client?.name || '—' }),
      at: ts(c.createdAt) || ts(c.startDate),
    });
  });

  raw.leads.forEach(l => {
    const source = tr(l.source || '—');
    list.push({
      id: `lead:${l._id}`, icon: '👤', type: 'lead', page: 'leads',
      title: 'New lead assigned',
      desc: l.agent?.name
        ? tr('{name} ({source}) assigned to {agent}', { name: l.name, source, agent: l.agent.name })
        : tr('{name} ({source}) — not assigned yet', { name: l.name, source }),
      at: ts(l.createdAt),
    });
  });

  raw.properties.forEach(p => {
    list.push({
      id: `property:${p._id}`, icon: '🏠', type: 'property', page: 'properties',
      title: 'New property listed',
      desc: tr('{title} — {city}', { title: p.title, city: tr(normalizeCity(p.city) || '—') }),
      at: ts(p.createdAt),
    });
  });

  return list.filter(n => n.at > 0).sort((a, b) => b.at - a.at).slice(0, 40);
}