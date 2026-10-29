'use client'

import { useState, useRef, useEffect } from 'react';
import { tr } from '../../i18n';

// زر "إيميل" بقائمة خيارات (كيما تديرو المنتجات الحقيقية):
// Gmail في المتصفح، تطبيق الإيميل الافتراضي، أو نسخ العنوان
export default function EmailMenu({ email, label }: { email?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // نسدو القائمة كي نضغطو برا ولا Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      // احتياط للمتصفحات القديمة / غير الآمنة
      const ta = document.createElement('textarea');
      ta.value = email;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1200);
  };

  const itemStyle: React.CSSProperties = {
    display: 'block', width: '100%', textAlign: 'start', padding: '8px 12px', fontSize: 13,
    borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--fg)',
    cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box',
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="btn-secondary" disabled={!email} onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}>
        {label}
      </button>
      {open && email && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', insetInlineEnd: 0, minWidth: 200, zIndex: 30, padding: 4,
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
        }}>
          <a role="menuitem" style={itemStyle} target="_blank" rel="noopener noreferrer"
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`}
            onClick={() => setOpen(false)}>
            ✉️ {tr('Open in Gmail')}
          </a>
          <a role="menuitem" style={itemStyle} href={`mailto:${email}`} onClick={() => setOpen(false)}>
            📮 {tr('Open in mail app')}
          </a>
          <button role="menuitem" style={itemStyle} onClick={copy}>
            {copied ? '✓ ' + tr('Email copied.') : '📋 ' + tr('Copy email')}
          </button>
        </div>
      )}
    </div>
  );
}
