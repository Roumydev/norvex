'use client'

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const icon = (paths: React.ReactNode, viewBox = '0 0 24 24') =>
  ({ size = 18, color = 'currentColor', strokeWidth = 1.75, className }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );

export const LayoutDashboard = icon(<>
  <rect x="3" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="14" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" />
</>);

export const Building = icon(<>
  <path d="M3 21h18" />
  <path d="M5 21V7l8-4v18" />
  <path d="M19 21V11l-6-4" />
  <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
</>);

export const Users = icon(<>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
</>);

export const UserCheck = icon(<>
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <polyline points="16 11 18 13 22 9" />
</>);

export const TrendingUp = icon(<>
  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
  <polyline points="16 7 22 7 22 13" />
</>);

export const CalendarDays = icon(<>
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
  <line x1="16" y1="2" x2="16" y2="6" />
  <line x1="8" y1="2" x2="8" y2="6" />
  <line x1="3" y1="10" x2="21" y2="10" />
  <rect x="8" y="14" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
  <rect x="13" y="14" width="2" height="2" rx="0.5" fill="currentColor" stroke="none" />
</>);

export const FileText = icon(<>
  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
  <polyline points="14 2 14 8 20 8" />
  <line x1="16" y1="13" x2="8" y2="13" />
  <line x1="16" y1="17" x2="8" y2="17" />
  <line x1="10" y1="9" x2="8" y2="9" />
</>);

export const CreditCard = icon(<>
  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
  <line x1="1" y1="10" x2="23" y2="10" />
</>);

export const BarChart2 = icon(<>
  <line x1="18" y1="20" x2="18" y2="10" />
  <line x1="12" y1="20" x2="12" y2="4" />
  <line x1="6" y1="20" x2="6" y2="14" />
</>);

export const Bell = icon(<>
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</>);

export const SettingsIcon = icon(<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
</>);

export const UserCircle = icon(<>
  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</>);

export const LogOut = icon(<>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <polyline points="16 17 21 12 16 7" />
  <line x1="21" y1="12" x2="9" y2="12" />
</>);

export const Search = icon(<>
  <circle cx="11" cy="11" r="8" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

export const Moon = icon(<>
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
</>);

export const Sun = icon(<>
  <circle cx="12" cy="12" r="5" />
  <line x1="12" y1="1" x2="12" y2="3" />
  <line x1="12" y1="21" x2="12" y2="23" />
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
  <line x1="1" y1="12" x2="3" y2="12" />
  <line x1="21" y1="12" x2="23" y2="12" />
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
</>);

export const Home = icon(<>
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  <polyline points="9 22 9 12 15 12 15 22" />
</>);

export const ChevronRight = icon(<polyline points="9 18 15 12 9 6" />);
export const ChevronLeft = icon(<polyline points="15 18 9 12 15 6" />);
export const Plus = icon(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>);
export const X = icon(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>);
export const Filter = icon(<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></>);
export const Download = icon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>);
export const ArrowUpRight = icon(<><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></>);
export const DollarSign = icon(<><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>);
export const Handshake = icon(<><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" /></>);
export const MapPin = icon(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>);
export const CheckCircle = icon(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>);
export const AlertCircle = icon(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>);
export const Clock = icon(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);

// NorvexLogo — renders the real SVG mark
export function NorvexLogo({ width = 140, className }: { width?: number; className?: string }) {
  return (
    <svg
      width={width}
      height={Math.round(width * (112.32 / 465.17))}
      viewBox="0 0 465.17 112.32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Norvex"
      style={{ direction: 'ltr', flexShrink: 0 }}
    >
      <g>
        <polygon fill="currentColor" points="113.54 53.45 113.54 76.9 80.32 112.32 38.28 64.16 48.63 52.73 80.63 89.07 113.54 53.45"/>
        <path fill="currentColor" d="M65.53,59.62L33.36,23.28.63,58.53c-.03-7.67-.07-15.34-.1-23.01C8.98,26.21,17.46,16.81,26.09,7.63c2.43-2.59,5.01-5.26,7.59-7.6l41.9,47.59-10.05,12.01Z"/>
        <path fill="currentColor" d="M16.24,52.87c5.53-6.02,11.13-12.01,16.76-17.96l10.34,11.49-24.32,26.86,14.35,15.81,8-8.71,10.72,11.81-18.41,20.15c-.49.08-2.08-1.7-2.5-2.15-9.36-9.95-18.96-19.95-28-30.18-.65-.74-2.85-3.18-3.01-3.9-.28-1.25-.24-4.95.33-6.06,5.25-5.72,10.49-11.45,15.74-17.16Z"/>
        <path fill="currentColor" d="M97.78,18.56c5.2,5.52,10.34,11.02,15.41,16.5.57.99.57,6.32,0,7.31l-32.55,35.07-10.37-11.82,24.31-26.84-13.96-15.52-8.35,8.72-10.34-11.76L80.09,0c5.88,6.1,11.77,12.29,17.69,18.56Z"/>
        <text
          fill="currentColor"
          fontFamily="Montserrat, 'Montserrat', system-ui, sans-serif"
          fontSize="62.76"
          fontWeight="600"
          letterSpacing="0.12em"
          transform="translate(148.03 77.31)"
          textAnchor="start"
          direction="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        >
          NORVEX
        </text>
      </g>
    </svg>
  );
}

// IconMark — just the geometric symbol without text
export function NorvexMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 115 115"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <polygon fill="currentColor" points="113.54 53.45 113.54 76.9 80.32 112.32 38.28 64.16 48.63 52.73 80.63 89.07 113.54 53.45"/>
      <path fill="currentColor" d="M65.53,59.62L33.36,23.28.63,58.53c-.03-7.67-.07-15.34-.1-23.01C8.98,26.21,17.46,16.81,26.09,7.63c2.43-2.59,5.01-5.26,7.59-7.6l41.9,47.59-10.05,12.01Z"/>
      <path fill="currentColor" d="M16.24,52.87c5.53-6.02,11.13-12.01,16.76-17.96l10.34,11.49-24.32,26.86,14.35,15.81,8-8.71,10.72,11.81-18.41,20.15c-.49.08-2.08-1.7-2.5-2.15-9.36-9.95-18.96-19.95-28-30.18-.65-.74-2.85-3.18-3.01-3.9-.28-1.25-.24-4.95.33-6.06,5.25-5.72,10.49-11.45,15.74-17.16Z"/>
      <path fill="currentColor" d="M97.78,18.56c5.2,5.52,10.34,11.02,15.41,16.5.57.99.57,6.32,0,7.31l-32.55,35.07-10.37-11.82,24.31-26.84-13.96-15.52-8.35,8.72-10.34-11.76L80.09,0c5.88,6.1,11.77,12.29,17.69,18.56Z"/>
    </svg>
  );
}