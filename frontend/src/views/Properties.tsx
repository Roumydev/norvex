'use client'

import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, AdminOnly } from '../context/AppContext';
import { statusColors, formatFullDZD } from '../lib/format';
import TopBar from '../components/layout/TopBar';
import api, { apiError } from '../lib/api';
import { imageUrl, compressImage, MAX_PHOTOS, MAX_PHOTO_BYTES } from '../lib/imageUtils';

import { tr } from '../i18n';
import { WILAYAS, normalizeCity, sortCities } from '../data/wilayas';
interface Agent {
  _id: string;
  name: string;
  role?: string;
}

interface Property {
  _id: string;
  title: string;
  city: string;
  district?: string;
  type: string;
  txType: string;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  agent?: Agent;
  updatedAt?: string;
}

const Badge = ({ status }: { status: string }) => {
  const style = statusColors[status] || 'background:var(--muted);color:var(--fg)';
  const obj = Object.fromEntries(style.split(';').filter(Boolean).map(s => s.split(':').map(x => x.trim())));
  return <span className="badge" style={obj}>{tr(status)}</span>;
};

const ErrorBanner = ({ message, onClose }: { message: string; onClose?: () => void }) => (
  <div
    onClick={onClose}
    style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: 16, cursor: onClose ? 'pointer' : 'default' }}
  >
    {message}
  </div>
);

const deleteProperty = (id: string) => api.delete(`/properties/${id}`);

function PropertyDetail({ prop, onBack, onEdit, onDeleted }: { prop: Property; onBack: () => void; onEdit: () => void; onDeleted: () => void }) {
  const [tab, setTab] = useState('overview');
  const [imgIdx, setImgIdx] = useState(0);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const tabs = ['overview', 'visits', 'leads', 'contracts', 'activity'];
  const agentName = prop.agent?.name || 'Unassigned';

  const handleDelete = async () => {
    if (!window.confirm(tr('Delete this property? This cannot be undone.'))) return;
    setDeleting(true);
    setError('');
    try {
      await deleteProperty(prop._id);
      onDeleted();
    } catch (err) {
      setError(apiError(err, tr('Could not delete property.')));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr('Property Details')} />
      <div className="page-content">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 20 }}>{tr('← Back to Properties')}</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            {/* معرض الصور */}
            {prop.images && prop.images.length > 0 ? (
              <div style={{ marginBottom: 20 }}>
                <a href={imageUrl(prop.images[Math.min(imgIdx, prop.images.length - 1)])} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(prop.images[Math.min(imgIdx, prop.images.length - 1)])} alt={prop.title} style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 10, background: 'var(--muted)', display: 'block' }} />
                </a>
                {prop.images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                    {prop.images.map((id, i) => (
                      <button key={id} onClick={() => setImgIdx(i)} aria-label={`${tr('Photos')} ${i + 1}`} style={{ padding: 0, border: i === imgIdx ? '2px solid var(--blue)' : '2px solid transparent', borderRadius: 8, background: 'none', cursor: 'pointer', flexShrink: 0 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl(id)} alt="" loading="lazy" style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', height: 200, borderRadius: 10, background: 'var(--muted)', marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-fg)', gap: 6 }}>
                <div style={{ fontSize: 34 }}>🏠</div>
                <div style={{ fontSize: 13 }}>{tr('No photos yet')}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {tr(t.charAt(0).toUpperCase() + t.slice(1))}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{prop.title}</h2>
                <p style={{ color: 'var(--muted-fg)', marginBottom: 20 }}>📍 {prop.district ? `${prop.district}, ` : ''}{tr(normalizeCity(prop.city))}</p>
                <p style={{ lineHeight: 1.7, color: 'var(--muted-fg)', marginBottom: 24 }}>{prop.description || 'No description provided.'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  {[
                    prop.area ? ['Area', `${prop.area} m²`] : null,
                    prop.bedrooms ? ['Bedrooms', prop.bedrooms] : null,
                    prop.bathrooms ? ['Bathrooms', prop.bathrooms] : null,
                    ['Type', prop.type],
                  ].filter(Boolean).map((item) => {
                    const [l, v] = item as [string, string | number];
                    return (
                      <div key={l} className="card" style={{ padding: '14px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--muted-fg)', fontSize: 12, marginBottom: 4 }}>{l}</div>
                        <div style={{ fontWeight: 600 }}>{v}</div>
                      </div>
                    );
                  })}
                </div>
                {prop.amenities && prop.amenities.length > 0 && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 10 }}>{tr('Amenities')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {prop.amenities.map(a => (
                        <span key={a} style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '4px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 500 }}>✓ {a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {tab !== 'overview' && (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted-fg)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div>No {tab} data yet</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ padding: 20 }}>
              {error && <ErrorBanner message={error} onClose={() => setError('')} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Badge status={prop.status} />
                <span style={{ fontSize: 12, background: 'var(--muted)', color: 'var(--muted-fg)', padding: '3px 10px', borderRadius: 99, fontWeight: 500 }}>{tr(prop.txType)}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--fg)', marginBottom: 4 }}>{formatFullDZD(prop.price)}</div>
              {prop.txType === 'Rent' && <div style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{tr('per month')}</div>}
              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
              {[
                ['Property ID', prop._id.slice(-8)],
                ['City', tr(normalizeCity(prop.city))],
                ['District', prop.district || '—'],
                ['Transaction', prop.txType],
                ['Updated', prop.updatedAt ? new Date(prop.updatedAt).toLocaleDateString() : '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13.5 }}>
                  <span style={{ color: 'var(--muted-fg)' }}>{l}</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}>{tr('Edit')}</button>
                <AdminOnly><button className="btn-secondary" style={{ color: 'var(--red)' }} onClick={handleDelete} disabled={deleting}>{deleting ? '...' : tr('Delete')}</button></AdminOnly>
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>{tr('Assigned Agent')}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>{agentName[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{agentName}</div>
                  <div style={{ color: 'var(--muted-fg)', fontSize: 12.5 }}>{prop.agent?.role || ''}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// فورم واحد للإضافة والتعديل: إذا جات initial => تعديل (PATCH)، وإلا إضافة (POST)
function PropertyForm({ initial, onBack, onSaved }: { initial?: Property; onBack: () => void; onSaved: () => void }) {
  const { t } = useApp();
  const isEdit = !!initial;
  const [agents, setAgents] = useState<Agent[]>([]);
  const { isAdmin, agentId } = useApp(); // الوكيل: الحقل مقفول على ملفو
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map(f => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(u => URL.revokeObjectURL(u)), [previews]);
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    type: initial?.type ?? 'Apartment',
    txType: initial?.txType ?? 'Sale',
    price: initial ? String(initial.price) : '',
    city: initial ? normalizeCity(initial.city) : '',
    district: initial?.district ?? '',
    area: initial?.area != null ? String(initial.area) : '',
    bedrooms: initial?.bedrooms != null ? String(initial.bedrooms) : '',
    bathrooms: initial?.bathrooms != null ? String(initial.bathrooms) : '',
    description: initial?.description ?? '',
    agent: initial?.agent?._id ?? (isAdmin ? '' : agentId ?? ''),
    status: initial?.status ?? 'Available',
  });

  useEffect(() => {
    api.get('/agents').then(res => setAgents(res.data)).catch(() => {});
  }, []);

  const targetId = savedId ?? initial?._id ?? null;
  const total = images.length + files.length;

  const pickFiles = (list: FileList | null) => {
    if (!list) return;
    setError('');
    const incoming = Array.from(list);
    const bad = incoming.find(f => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    if (bad) { setError(tr('Only JPEG, PNG or WebP images are allowed.')); }
    const valid = incoming.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    const room = MAX_PHOTOS - images.length - files.length;
    if (valid.length > room) setError(tr('You can add up to {m} photos.', { m: MAX_PHOTOS }));
    setFiles(prev => [...prev, ...valid.slice(0, Math.max(0, room))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeExisting = async (imageId: string) => {
    if (!targetId || !window.confirm(tr('Remove this photo?'))) return;
    setError('');
    try {
      const res = await api.delete(`/properties/${targetId}/images/${imageId}`);
      setImages(res.data.images ?? []);
    } catch (err) {
      setError(tr(apiError(err, tr('Could not remove the photo.'))));
    }
  };

  const makeCover = async (imageId: string) => {
    if (!targetId) return;
    setError('');
    try {
      const res = await api.patch(`/properties/${targetId}/images/${imageId}/cover`);
      setImages(res.data.images ?? []);
    } catch (err) {
      setError(tr(apiError(err, tr('Could not set the cover photo.'))));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.city || !form.price) {
      setError(tr('Title, city and price are required.'));
      return;
    }
    setSaving(true);
    setError('');
    // null = مسح الحقل عند التعديل، undefined = ما نبعتوش عند الإضافة
    const EMPTY = targetId ? null : undefined;
    const payload = {
      title: form.title,
      type: form.type,
      txType: form.txType,
      price: Number(form.price),
      city: form.city,
      district: form.district || EMPTY,
      area: form.area ? Number(form.area) : EMPTY,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : EMPTY,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : EMPTY,
      description: form.description || EMPTY,
      agent: form.agent || EMPTY,
      status: form.status,
    };
    try {
      let id = targetId;
      if (id) {
        await api.patch(`/properties/${id}`, payload);
      } else {
        const res = await api.post('/properties', payload);
        id = res.data._id as string;
        setSavedId(id); // إذا فشل رفع الصور، الضغطة الجاية تعدّل نفس العقار ما تخلقش واحد جديد
      }

      if (files.length > 0) {
        try {
          const compressed = await Promise.all(files.map(f => compressImage(f)));
          const tooBig = compressed.find(f => f.size > MAX_PHOTO_BYTES);
          if (tooBig) throw new Error(tr('Photo "{n}" is too large (max 2 MB).', { n: tooBig.name }));
          const fd = new FormData();
          compressed.forEach(f => fd.append('files', f));
          const res = await api.post(`/properties/${id}/images`, fd);
          setImages(res.data.images ?? []);
          setFiles([]);
        } catch (err) {
          const reason = err instanceof Error && !('response' in err) ? err.message : tr(apiError(err, ''));
          setError(`${tr('Property saved, but the photos could not be uploaded.')} ${reason}`.trim());
          return; // نبقاو في الفورم باش يعاود يجرب
        }
      }
      onSaved();
    } catch (err) {
      setError(apiError(err, tr('Could not save property. Please check the fields and try again.')));
    } finally {
      setSaving(false);
    }
  };

  const cityIsKnown = WILAYAS.some(w => w.name === form.city);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={tr(isEdit ? 'Edit Property' : 'Add Property')} />
      <div className="page-content" style={{ maxWidth: 800 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: 0, marginBottom: 24 }}>{tr('← Back to Properties')}</button>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{isEdit ? tr('Edit Property') : t('addProperty')}</h2>

          {error && <ErrorBanner message={error} />}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">{tr('Title')}</label>
              <input className="input" placeholder={tr('e.g. Luxury Apartment — Hydra')} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Property Type')}</label>
              <select className="select input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {['Apartment','Villa','Office','Commercial','Land'].map(t => <option key={t} value={t}>{tr(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{tr('Transaction Type')}</label>
              <select className="select input" value={form.txType} onChange={e => setForm({...form, txType: e.target.value})}>
                <option value="Sale">{tr('Sale')}</option><option value="Rent">{tr('Rent')}</option>
              </select>
            </div>
            <div>
              <label className="label">Price (DZD)</label>
              <input className="input" type="number" placeholder={tr('e.g. 12500000')} value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('City')}</label>
              <select className="select input" value={form.city} onChange={e => setForm({...form, city: e.target.value})}>
                <option value="">{tr('Select city...')}</option>
                {!cityIsKnown && form.city && <option value={form.city}>{form.city}</option>}
                {WILAYAS.map(w => <option key={w.code} value={w.name}>{String(w.code).padStart(2, '0')} - {tr(w.name)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">{tr('District')}</label>
              <input className="input" placeholder={tr('e.g. Hydra')} value={form.district} onChange={e => setForm({...form, district: e.target.value})} />
            </div>
            <div>
              <label className="label">Area (m²)</label>
              <input className="input" type="number" placeholder="145" value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Bedrooms')}</label>
              <input className="input" type="number" placeholder="3" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Bathrooms')}</label>
              <input className="input" type="number" placeholder="2" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} />
            </div>
            <div>
              <label className="label">{tr('Status')}</label>
              <select className="select input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                {['Available','Reserved','Sold','Rented'].map(s => <option key={s} value={s}>{tr(s)}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">{tr('Description')}</label>
              <textarea className="input" rows={3} placeholder={tr('Describe the property...')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">{tr('Assigned Agent')}</label>
              <select className="select input" value={form.agent} disabled={!isAdmin} onChange={e => setForm({...form, agent: e.target.value})}>
                <option value="">{tr('Select agent...')}</option>
                {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>

            {/* الصور */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="label">{tr('Photos')} ({total}/{MAX_PHOTOS})</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {images.map((id, i) => (
                  <div key={id} style={{ position: 'relative', width: 110, height: 82 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl(id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid var(--blue)' : '1px solid var(--border)' }} />
                    {i === 0 && <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 10, background: 'var(--blue)', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>{tr('Cover')}</span>}
                    {i !== 0 && <button type="button" title={tr('Set as cover')} onClick={() => makeCover(id)} style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>★</button>}
                    <button type="button" title={tr('Remove photo')} onClick={() => removeExisting(id)} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, lineHeight: '18px', fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 0 }}>✕</button>
                  </div>
                ))}
                {previews.map((src, i) => (
                  <div key={src} style={{ position: 'relative', width: 110, height: 82 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px dashed var(--blue)' }} />
                    <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '1px 6px', borderRadius: 99 }}>{tr('New')}</span>
                    <button type="button" title={tr('Remove photo')} onClick={() => setFiles(prev => prev.filter((_, k) => k !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, lineHeight: '18px', fontSize: 11, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: 0 }}>✕</button>
                  </div>
                ))}
                {total < MAX_PHOTOS && (
                  <button type="button" onClick={() => fileRef.current?.click()} style={{ width: 110, height: 82, borderRadius: 8, border: '2px dashed var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontSize: 12.5 }}>
                    + {tr('Add photos')}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple style={{ display: 'none' }} onChange={e => pickFiles(e.target.files)} />
              <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 8 }}>{tr('Up to {m} photos (JPEG, PNG or WebP). Photos are resized automatically.', { m: MAX_PHOTOS })}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? tr('Saving...') : tr(isEdit ? 'Save Changes' : 'Save Property')}</button>
            <button className="btn-secondary" onClick={onBack}>{tr('Cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Properties() {
  const { t, page: appPage, selectedId, setPage: setAppPage } = useApp();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [view, setView] = useState<'list' | 'detail' | 'add' | 'edit'>('list');
  const [selected, setSelected] = useState<Property | null>(null);
  const [actionError, setActionError] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, filterCity, filterType, filterStatus]);

  const loadProperties = () => {
    setLoading(true);
    api.get('/properties')
      .then(res => setProperties(res.data))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleDelete = async (p: Property) => {
    if (!window.confirm(tr('Delete this property? This cannot be undone.'))) return;
    setActionError('');
    try {
      await deleteProperty(p._id);
      loadProperties();
    } catch (err) {
      setActionError(apiError(err, tr('Could not delete property.')));
    }
  };

  const backToList = () => {
    setView('list');
    setSelected(null);
    if (appPage === 'property-detail') setAppPage('properties');
  };

  // فتح التفاصيل من البحث العام في الـTopBar
  useEffect(() => {
    if (appPage === 'property-detail' && selectedId) {
      const found = properties.find(x => x._id === selectedId);
      if (found) { setSelected(found); setView('detail'); }
    }
  }, [appPage, selectedId, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  // الضغط على "Properties" في الـsidebar يرجعنا للقائمة
  const prevAppPage = useRef(appPage);
  useEffect(() => {
    if (appPage === 'properties' && prevAppPage.current !== 'properties') { setView('list'); setSelected(null); }
    prevAppPage.current = appPage;
  }, [appPage]);

  if (view === 'detail' && selected) {
    return <PropertyDetail prop={selected} onBack={backToList} onEdit={() => setView('edit')} onDeleted={() => { backToList(); loadProperties(); }} />;
  }
  if (view === 'edit' && selected) {
    return <PropertyForm initial={selected} onBack={backToList} onSaved={() => { backToList(); loadProperties(); }} />;
  }
  if (view === 'add') return <PropertyForm onBack={backToList} onSaved={() => { backToList(); loadProperties(); }} />;

  const filtered = properties.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !normalizeCity(p.city).toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCity && normalizeCity(p.city) !== filterCity) return false;
    if (filterType && p.type !== filterType) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });
  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar title={t('properties')} />
      <div className="page-content">
        {actionError && <ErrorBanner message={actionError} onClose={() => setActionError('')} />}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-fg)' }}>🔍</span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder={tr('Search properties...')} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
            <option value="">{tr('All Cities')}</option>
            {sortCities(Array.from(new Set(properties.map(p => normalizeCity(p.city)).filter(Boolean)))).map(c => <option key={c} value={c}>{tr(c)}</option>)}
          </select>
          <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">{tr('All Types')}</option>
            {['Apartment','Villa','Office','Commercial','Land'].map(t => <option key={t} value={t}>{tr(t)}</option>)}
          </select>
          <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{tr('All Statuses')}</option>
            {['Available','Reserved','Sold','Rented'].map(s => <option key={s} value={s}>{tr(s)}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setView('add')}>+ {t('addProperty')}</button>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-fg)' }}>{tr('Loading properties...')}</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>{tr('Property')}</th>
                    <th>{tr('Location')}</th>
                    <th>{tr('Type')}</th>
                    <th>{tr('Price')}</th>
                    <th>{tr('Agent')}</th>
                    <th>{tr('Status')}</th>
                    <th>{tr('Updated')}</th>
                    <th>{tr('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {p.images && p.images[0] ? (
                            <img src={imageUrl(p.images[0])} alt={p.title} loading="lazy" style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, background: 'var(--muted)', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 44, height: 36, borderRadius: 6, background: 'var(--muted)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏠</div>
                          )}
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{p._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted-fg)' }}>📍 {p.district ? `${p.district}, ` : ''}{tr(normalizeCity(p.city))}</td>
                      <td><span style={{ fontSize: 12.5, background: 'var(--muted)', padding: '2px 8px', borderRadius: 99, color: 'var(--muted-fg)' }}>{tr(p.type)}</span></td>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatFullDZD(p.price)}{p.txType === 'Rent' ? '/mo' : ''}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{(p.agent?.name || '?')[0]}</div>
                          <span style={{ fontSize: 13 }}>{p.agent?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td><Badge status={p.status} /></td>
                      <td style={{ color: 'var(--muted-fg)', fontSize: 13 }}>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(p); setView('detail'); }}>{tr('View')}</button>
                          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelected(p); setView('edit'); }}>{tr('Edit')}</button>
                          <AdminOnly><button className="btn-ghost" style={{ fontSize: 12, color: 'var(--red)' }} onClick={() => handleDelete(p)}>{tr('Delete')}</button></AdminOnly>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted-fg)', fontSize: 13 }}>
            <span>{tr('Showing {a} of {b} properties', { a: pageRows.length, b: filtered.length })}</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>{tr('← Prev')}</button>
              <span style={{ fontSize: 12.5, padding: '0 8px' }}>{tr('Page {p} of {n}', { p: currentPage, n: totalPages })}</span>
              <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>{tr('Next →')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}