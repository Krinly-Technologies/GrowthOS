import type { SVGProps } from 'react';

// A small, original stroke icon set (24px grid, 1.5px stroke, round joins). No icon library and
// no brand marks: channels and sources are drawn generically.

const PATHS = {
  today: (
    <>
      <path d="M12 3.5v2M5.8 6.3l1.4 1.4M3.5 12.5h2M18.5 12.5h2M16.8 7.7l1.4-1.4" />
      <path d="M7.5 15.5a4.5 4.5 0 0 1 9 0" />
      <path d="M3.5 15.5h17M7 19.5h10" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5h4.2l1.4 2.5h4.8l1.4-2.5H20" />
      <path d="M6.3 5h11.4l2.3 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5z" />
    </>
  ),
  leads: (
    <>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.5 19.5c.7-3.2 2.9-5 5.5-5s4.8 1.8 5.5 5" />
      <path d="M15.5 5.6a3.1 3.1 0 0 1 0 5.8M17.4 14.8c1.6.7 2.6 2.2 3.1 4.7" />
    </>
  ),
  bookings: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
      <path d="M9 14.8l2 2 4-4" />
    </>
  ),
  payments: (
    <>
      <path d="M7.5 4.5h9M7.5 8.5h9" />
      <path d="M10 4.5c2.9 0 4.4 1.5 4.4 4s-2 4.4-5.4 4.4H7.5l7 7" />
    </>
  ),
  growth: (
    <>
      <path d="M4 19.5h16" />
      <path d="M5 15.5l4.5-4.5 3.5 3.5L19 8.5" />
      <path d="M15 8.5h4v4" />
    </>
  ),
  assistant: (
    <>
      <path d="M5 18.5V7.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H8.5z" />
      <path d="M9 10.75h.01M12 10.75h.01M15 10.75h.01" strokeWidth="2.25" />
    </>
  ),
  automation: (
    <>
      <circle cx="6" cy="6.5" r="2" />
      <circle cx="6" cy="17.5" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M8 6.5h2.5a3 3 0 0 1 3 3v0a2.5 2.5 0 0 0 2.5 2.5M8 17.5h2.5a3 3 0 0 0 3-3v0A2.5 2.5 0 0 1 16 12" />
    </>
  ),
  knowledge: (
    <>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H19v13.5H6.5A1.5 1.5 0 0 0 5 19z" />
      <path d="M5 19a1.5 1.5 0 0 0 1.5 1.5H19M9 8h6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" />
      <circle cx="15" cy="7.5" r="2" />
      <circle cx="9" cy="16.5" r="2" />
    </>
  ),
  integrations: (
    <>
      <path d="M9 7V3.5M15 7V3.5" />
      <path d="M6.5 7h11v3a5.5 5.5 0 0 1-11 0z" />
      <path d="M12 15.5v5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.25" />
      <path d="M15.75 15.75l4 4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  'chevron-down': <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />,
  'chevron-right': <path d="M9.5 6.5l5.5 5.5-5.5 5.5" />,
  'chevron-left': <path d="M14.5 6.5L9 12l5.5 5.5" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  check: <path d="M5.5 12.5l4.25 4.25L18.5 8" />,
  more: <path d="M6 12h.01M12 12h.01M18 12h.01" strokeWidth="2.5" />,
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.25" />
    </>
  ),
  board: (
    <>
      <rect x="3.5" y="4.5" width="5" height="15" rx="1.25" />
      <rect x="9.5" y="4.5" width="5" height="10" rx="1.25" />
      <rect x="15.5" y="4.5" width="5" height="12.5" rx="1.25" />
    </>
  ),
  phone: (
    <path d="M7 4h2.6l1.4 3.8-1.9 1.4a10.5 10.5 0 0 0 5.7 5.7l1.4-1.9L20 14.4V17a2 2 0 0 1-2.1 2A14.5 14.5 0 0 1 5 6.1 2 2 0 0 1 7 4z" />
  ),
  note: (
    <>
      <path d="M5 19h3.75L19 8.75 15.25 5 5 15.25z" />
      <path d="M13.5 6.75l3.75 3.75" />
    </>
  ),
  message: (
    <path d="M4 7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v6.5a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.75V16A1.5 1.5 0 0 1 4 14.5z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.75V12l2.75 1.75" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </>
  ),
  panel: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M9.5 4.5v15" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 16v-4.5a5.5 5.5 0 0 1 11 0V16l1.5 2h-14z" />
      <path d="M10.25 20.25a2 2 0 0 0 3.5 0" />
    </>
  ),
  exit: (
    <>
      <path d="M10 5H6.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H10" />
      <path d="M14 8l4 4-4 4M18 12H9.5" />
    </>
  ),
  keyboard: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="2" />
      <path d="M7 10.5h.01M10.5 10.5h.01M14 10.5h.01M17 10.5h.01M8 14h8" />
    </>
  ),
  undo: (
    <>
      <path d="M9 7.5l-4 4 4 4" />
      <path d="M5 11.5h9.5a4.5 4.5 0 0 1 0 9H12" />
    </>
  ),
  seal: (
    <>
      <path d="M12 3.25l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.55.9 2.55-2.2 1.6-.8 2.6-2.7-.1L12 20.75l-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.55-.9-2.55 2.2-1.6.8-2.6 2.7.1z" />
      <path d="M8.9 12.1l2.1 2.1 4.1-4.3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.5l8.5 15h-17z" />
      <path d="M12 10.5v3.75M12 16.75h.01" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4h3l7.5 4.5v-13L7 10z" />
      <path d="M17.5 9.5a3.5 3.5 0 0 1 0 5" />
    </>
  ),
  camera: (
    <>
      <rect x="3.5" y="7" width="17" height="12.5" rx="2" />
      <path d="M8.5 7l1.5-2.5h4L15.5 7" />
      <circle cx="12" cy="13.25" r="3.1" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.4 2.3 3.5 5 3.5 8s-1.1 5.7-3.5 8c-2.4-2.3-3.5-5-3.5-8s1.1-5.7 3.5-8z" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5L5.5 5h13L20 9.5" />
      <path d="M4 9.5h16v.75a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0 2.7 2.7 0 0 1-5.3 0z" />
      <path d="M5.5 12.5V19h13v-6.5M10 19v-4h4v4" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 7.5h16v3a1.75 1.75 0 0 0 0 3.5v3H4v-3a1.75 1.75 0 0 0 0-3.5z" />
      <path d="M14.5 7.5v9.5" strokeDasharray="1.5 2" />
    </>
  ),
  referral: (
    <>
      <circle cx="9" cy="12" r="4.5" />
      <circle cx="15" cy="12" r="4.5" />
    </>
  ),
  sparkline: <path d="M3.5 16l4-4 3 3 5-6 5 4" />,
  arrowUp: <path d="M12 18.5v-13M6.5 11L12 5.5 17.5 11" />,
  arrowDown: <path d="M12 5.5v13M6.5 13L12 18.5 17.5 13" />,
  layers: (
    <>
      <path d="M12 4l8.5 4.5L12 13 3.5 8.5z" />
      <path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c.9-3.6 3.6-5.75 7-5.75S18.1 16.4 19 20" />
    </>
  ),
  grip: (
    <path d="M9 6.5h.01M15 6.5h.01M9 12h.01M15 12h.01M9 17.5h.01M15 17.5h.01" strokeWidth="2.25" />
  ),
  lab: (
    <>
      <path d="M9.5 3.5h5M10.5 3.5v5.25L5 18.5A1.5 1.5 0 0 0 6.3 20.75h11.4A1.5 1.5 0 0 0 19 18.5l-5.5-9.75V3.5" />
      <path d="M7.5 14.5h9" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  label,
  ...props
}: Omit<SVGProps<SVGSVGElement>, 'name'> & { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
