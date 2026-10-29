'use client'

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import api from '../lib/api';
import { setTrLang } from '../i18n';
import { fetchNotifRaw, buildNotifications, EMPTY_RAW, READ_KEY, DAY, NotifRaw } from '../lib/notifications';

// نقرأو الإيميل من الـJWT (payload فيه email)
function emailFromToken(token: string | null): string {
  try {
    if (!token) return '';
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)).email || '';
  } catch { return ''; }
}

// الدور (admin / agent) من الـJWT. للعرض فقط: الحماية الحقيقية في الـbackend
function roleFromToken(token: string | null): string {
  try {
    if (!token) return '';
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)).role || '';
  } catch { return ''; }
}

export type Page =
  | 'dashboard' | 'properties' | 'property-detail' | 'add-property'
  | 'clients' | 'client-detail'
  | 'agents' | 'agent-detail'
  | 'leads' | 'visits' | 'contracts' | 'contract-detail'
  | 'payments' | 'analytics' | 'notifications' | 'settings' | 'profile';

interface AppState {
  isAuthed: boolean;
  page: Page;
  lang: 'en' | 'ar';
  dark: boolean;
  selectedId: string | null;
  authError: string | null;
  sidebarOpen: boolean;
  userEmail: string;
  userRole: string;
  userName: string;
  isAdmin: boolean;
  agentId: string | null;
  agentName: string;
  meLoaded: boolean;
  setPage: (p: Page, id?: string) => void;
  unreadCount: number;
  notifRaw: NotifRaw;
  notifLoading: boolean;
  readIds: Set<string>;
  markNotifRead: (id: string) => void;
  markAllNotifsRead: () => void;
  goBack: () => void;
  setLang: (l: 'en' | 'ar') => void;
  toggleDark: () => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard', properties: 'Properties', clients: 'Clients',
    agents: 'Agents', leads: 'Leads', visits: 'Visits', contracts: 'Contracts',
    payments: 'Payments', analytics: 'Analytics', notifications: 'Notifications',
    settings: 'Settings', profile: 'Profile',
    management: 'Management', crm: 'CRM', transactions: 'Transactions', insights: 'Insights',
    addProperty: 'Add Property', addClient: 'Add Client', addAgent: 'Add Agent',
    scheduleVisit: 'Schedule Visit', addLead: 'Add Lead', addContract: 'Add Contract',
    addPayment: 'Add Payment', search: 'Search...', filter: 'Filter', export: 'Export',
    status: 'Status', actions: 'Actions', name: 'Name', phone: 'Phone', email: 'Email',
    city: 'City', price: 'Price', type: 'Type', agent: 'Agent', date: 'Date',
    available: 'Available', reserved: 'Reserved', sold: 'Sold', rented: 'Rented',
    active: 'Active', inactive: 'Inactive', pending: 'Pending', draft: 'Draft',
    completed: 'Completed', cancelled: 'Cancelled', paid: 'Paid', overdue: 'Overdue',
    new: 'New', contacted: 'Contacted', qualified: 'Qualified', negotiation: 'Negotiation',
    won: 'Won', lost: 'Lost', visitScheduled: 'Visit Scheduled',
    scheduled: 'Scheduled', noShow: 'No-show',
    apartment: 'Apartment', villa: 'Villa', office: 'Office', commercial: 'Commercial', land: 'Land',
    sale: 'Sale', rent: 'Rent',
    totalProperties: 'Total Properties', activeLeads: 'Active Leads',
    scheduledVisits: 'Scheduled Visits', closedDeals: 'Closed Deals', totalRevenue: 'Total Revenue',
    recentActivity: 'Recent Activity', todayVisits: "Today's Visits",
    revenueOverview: 'Revenue Overview', leadsFunnel: 'Leads Funnel',
    propertyStatus: 'Property Status', monthlyDeals: 'Monthly Deals',
    welcomeBack: 'Welcome back', signIn: 'Sign in', forgotPassword: 'Forgot password?',
    rememberMe: 'Remember me', resetPassword: 'Reset Password',
    lightMode: 'Light Mode', darkMode: 'Dark Mode',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', view: 'View',
    overview: 'Overview', activity: 'Activity',
    contractValue: 'Contract Value', totalPaid: 'Total Paid', remaining: 'Remaining',
    paymentProgress: 'Payment Progress',
    source: 'Source', budget: 'Budget', assignedAgent: 'Assigned Agent',
    website: 'Website', instagram: 'Instagram', facebook: 'Facebook',
    referral: 'Referral', walkIn: 'Walk-in',
    bankTransfer: 'Bank Transfer', cash: 'Cash', cheque: 'Cheque', ccp: 'CCP / Bank',
    totalReceived: 'Total Received', pendingPayments: 'Pending Payments', overduePayments: 'Overdue Payments',
    propertiesManaged: 'Properties Managed', performanceChart: 'Performance Chart',
    revenue: 'Revenue', deals: 'Deals', conversion: 'Conversion',
    language: 'Language', theme: 'Theme',
    signOut: 'Sign Out',
  },
  ar: {
    dashboard: 'لوحة التحكم', properties: 'العقارات', clients: 'العملاء',
    agents: 'الوكلاء', leads: 'العملاء المحتملون', visits: 'الزيارات',
    contracts: 'العقود', payments: 'المدفوعات', analytics: 'التحليلات',
    notifications: 'الإشعارات', settings: 'الإعدادات', profile: 'الملف الشخصي',
    management: 'الإدارة', crm: 'إدارة العملاء', transactions: 'المعاملات', insights: 'التقارير',
    addProperty: 'إضافة عقار', addClient: 'إضافة عميل', addAgent: 'إضافة وكيل',
    scheduleVisit: 'جدولة زيارة', addLead: 'إضافة عميل محتمل',
    addContract: 'إضافة عقد', addPayment: 'إضافة دفعة',
    search: 'بحث...', filter: 'تصفية', export: 'تصدير',
    status: 'الحالة', actions: 'الإجراءات', name: 'الاسم', phone: 'الهاتف', email: 'البريد الإلكتروني',
    city: 'المدينة', price: 'السعر', type: 'النوع', agent: 'الوكيل', date: 'التاريخ',
    available: 'متاح', reserved: 'محجوز', sold: 'مباع', rented: 'مؤجر',
    active: 'نشط', inactive: 'غير نشط', pending: 'قيد الانتظار',
    draft: 'مسودة', completed: 'مكتمل', cancelled: 'ملغي', paid: 'مدفوع', overdue: 'متأخر',
    new: 'جديد', contacted: 'تم التواصل', qualified: 'مؤهل',
    negotiation: 'تفاوض', won: 'مكسوب', lost: 'خسارة', visitScheduled: 'زيارة مجدولة',
    scheduled: 'مجدول', noShow: 'لم يحضر',
    apartment: 'شقة', villa: 'فيلا', office: 'مكتب', commercial: 'تجاري', land: 'أرض',
    sale: 'بيع', rent: 'إيجار',
    totalProperties: 'إجمالي العقارات', activeLeads: 'العملاء النشطون',
    scheduledVisits: 'الزيارات المجدولة', closedDeals: 'الصفقات المغلقة', totalRevenue: 'الإيرادات الكلية',
    recentActivity: 'النشاط الأخير', todayVisits: 'زيارات اليوم',
    revenueOverview: 'نظرة عامة على الإيرادات', leadsFunnel: 'قمع العملاء',
    propertyStatus: 'حالة العقارات', monthlyDeals: 'الصفقات الشهرية',
    welcomeBack: 'مرحباً بعودتك', signIn: 'تسجيل الدخول',
    forgotPassword: 'نسيت كلمة المرور؟', rememberMe: 'تذكرني', resetPassword: 'إعادة تعيين كلمة المرور',
    lightMode: 'الوضع الفاتح', darkMode: 'الوضع الداكن',
    save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', view: 'عرض',
    overview: 'نظرة عامة', activity: 'النشاط',
    contractValue: 'قيمة العقد', totalPaid: 'المبلغ المدفوع', remaining: 'المتبقي',
    paymentProgress: 'تقدم الدفع',
    source: 'المصدر', budget: 'الميزانية', assignedAgent: 'الوكيل المكلف',
    website: 'الموقع الإلكتروني', instagram: 'إنستغرام', facebook: 'فيسبوك',
    referral: 'إحالة', walkIn: 'زيارة مباشرة',
    bankTransfer: 'تحويل بنكي', cash: 'نقداً', cheque: 'شيك', ccp: 'CCP / بنك',
    totalReceived: 'المبلغ المستلم', pendingPayments: 'مدفوعات معلقة', overduePayments: 'مدفوعات متأخرة',
    propertiesManaged: 'العقارات المدارة', performanceChart: 'مخطط الأداء',
    revenue: 'الإيرادات', deals: 'الصفقات', conversion: 'التحويل',
    language: 'اللغة', theme: 'المظهر',
    signOut: 'تسجيل الخروج',
  },
};

const AppContext = createContext<AppState>({} as AppState);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [meLoaded, setMeLoaded] = useState(false);
  const [page, setPageState] = useState<Page>('dashboard');
  const [lang, setLangState] = useState<'en' | 'ar'>('en');
  setTrLang(lang); // يحدّث لغة tr() قبل رسم الصفحات
  const [dark, setDark] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── الإشعارات (مشتركة بين الجرس وصفحة Notifications)
  const [notifRaw, setNotifRaw] = useState<NotifRaw>(EMPTY_RAW);
  const [notifLoading, setNotifLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string> | null>(null);

  const refreshNotifications = async () => {
    try {
      const raw = await fetchNotifRaw(api);
      setNotifRaw(raw);
      setReadIds(prev => {
        if (prev) return prev;
        try {
          const saved = localStorage.getItem(READ_KEY);
          if (saved) return new Set<string>(JSON.parse(saved));
        } catch { /* ignore */ }
        // أول مرة: لي أقدم من 24 ساعة يعتبر مقروء
        const initial = new Set(buildNotifications(raw, 'en-US').filter(n => Date.now() - n.at > DAY).map(n => n.id));
        try { localStorage.setItem(READ_KEY, JSON.stringify([...initial])); } catch { /* ignore */ }
        return initial;
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const persistRead = (set: Set<string>) => {
    try { localStorage.setItem(READ_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
  };
  const markNotifRead = (id: string) => {
    setReadIds(prev => {
      const next = new Set(prev ?? []);
      if (next.has(id)) return prev ?? next;
      next.add(id);
      persistRead(next);
      return next;
    });
  };
  const markAllNotifsRead = () => {
    setReadIds(prev => {
      const next = new Set(prev ?? []);
      buildNotifications(notifRaw, 'en-US').forEach(n => next.add(n.id));
      persistRead(next);
      return next;
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) { setIsAuthed(true); setUserEmail(emailFromToken(token)); setUserRole(roleFromToken(token)); }
  }, []);

  // الدور وملف الوكيل المربوط من الـbackend (المصدر الحقيقي، التوكن للعرض الأولي فقط)
  useEffect(() => {
    if (!isAuthed) { setAgentId(null); setAgentName(''); setUserName(''); setMeLoaded(false); return; }
    api.get('/auth/me')
      .then(res => {
        setAgentId(res.data.agentId ?? null);
        setAgentName(res.data.agentName ?? '');
        setUserName(res.data.name ?? '');
        if (res.data.role) setUserRole(res.data.role);
      })
      .catch(() => {})
      .finally(() => setMeLoaded(true));
  }, [isAuthed]);

  // نحدّثو الإشعارات عند الدخول، عند تغيير الصفحة، وكل دقيقة
  useEffect(() => { if (isAuthed) refreshNotifications(); }, [isAuthed, page]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isAuthed) return;
    const id = setInterval(refreshNotifications, 60000);
    return () => clearInterval(id);
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = readIds
    ? buildNotifications(notifRaw, 'en-US').filter(n => !readIds.has(n.id)).length
    : 0;

  // آخر صفحة "عادية" (مش Profile ولا Notifications) باش نرجعولها
  const lastMainRef = useRef<{ page: Page; id: string | null }>({ page: 'dashboard', id: null });

  const setPage = (p: Page, id?: string) => {
    if (p !== 'profile' && p !== 'notifications') {
      lastMainRef.current = { page: p, id: id ?? null };
    }
    setPageState(p);
    setSelectedId(id ?? null);
    setSidebarOpen(false);
    // كل صفحة جديدة تبدأ من فوق
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const goBack = () => {
    const { page: p, id } = lastMainRef.current;
    setPage(p, id ?? undefined);
  };

  const setLang = (l: 'en' | 'ar') => {
    setLangState(l);
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  };

  const toggleDark = () => {
    setDark(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const toggleSidebar = () => setSidebarOpen(o => !o);
  const closeSidebar = () => setSidebarOpen(false);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.access_token);
      setUserEmail(res.data.user?.email || emailFromToken(res.data.access_token));
      setUserRole(res.data.user?.role || roleFromToken(res.data.access_token));
      setIsAuthed(true);
    } catch (err) {
      setAuthError('Invalid email or password');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUserEmail('');
    setUserRole('');
    setIsAuthed(false);
    setPageState('dashboard');
    lastMainRef.current = { page: 'dashboard', id: null };
    setNotifRaw(EMPTY_RAW);
    setReadIds(null);
  };

  const t = (key: string) => translations[lang][key] ?? translations['en'][key] ?? key;

  return (
    <AppContext.Provider value={{ isAuthed, page, lang, dark, selectedId, authError, sidebarOpen, userEmail, userRole, userName, isAdmin: userRole === 'admin', agentId, agentName, meLoaded, setPage, unreadCount, notifRaw, notifLoading, readIds: readIds ?? new Set<string>(), markNotifRead, markAllNotifsRead, goBack, setLang, toggleDark, toggleSidebar, closeSidebar, login, logout, t }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

// يعرض الأبناء فقط للـadmin (للواجهة فقط، الحماية الحقيقية في الـbackend)
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useApp();
  return isAdmin ? <>{children}</> : null;
}

// أحرف الأفاتار من الاسم (أو الإيميل إذا ما كاينش اسم)
export function initialsOf(name?: string, email?: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return ((email || '?')[0] || '?').toUpperCase();
}
