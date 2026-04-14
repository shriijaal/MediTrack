/* eslint-disable react-refresh/only-export-components */
// ── Icon components ───────────────────────────────────────────────
// All icons are pure SVG components with no dependencies.
// SvgI is a single-path shorthand. Icons is the full icon set.

// Generic single-path SVG helper
export const SvgI = ({ d, s = 20, sw = 1.8 }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

// Full icon set used throughout the app
export const Icons = {
  // ── Nav icons (26px, filled active variant baked in via className) ──
  navHome: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        fill={active ? "currentColor" : "none"} fillOpacity={active ? ".1" : "0"} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  navMeds: ({ active }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* The Round Tablet */}
      <circle
        cx="17.5"
        cy="17.5"
        r="4.5"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Tablet Detail Line */}
      <line
        x1="15.5"
        y1="15.5"
        x2="19.5"
        y2="19.5"
        stroke={active ? "white" : "currentColor"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* The Split Capsule */}
      <g transform="rotate(-45 10 10)">
        {/* Left Half (Filled when active) */}
        <path
          d="M10 6.5H6a3.5 3.5 0 0 0 0 7h4V6.5Z"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right Half (Always outline) */}
        <path
          d="M10 6.5h4a3.5 3.5 0 0 1 0 7h-4V6.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),
  navProfile: ({ active }) => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={active ? "2" : "1.7"} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} fillOpacity={active ? ".15" : "0"} />
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),

  // ── General icons ──
  pill: () => (
    <svg width="22" height="22" viewBox="0 0 640 640" fill="currentColor">
      <path d="M128 176C128 149.5 149.5 128 176 128C202.5 128 224 149.5 224 176L224 288L128 288L128 176zM64 176L64 464C64 525.9 114.1 576 176 576C237.9 576 288 525.9 288 464L288 358.2L404.3 527.7C439.8 579.4 509.6 592 560.3 555.8C611 519.6 623.3 448.3 587.8 396.6L459.3 209.3C423.8 157.6 354 145 303.3 181.2C297.7 185.2 292.6 189.6 288 194.3L288 176C288 114.1 237.9 64 176 64C114.1 64 64 114.1 64 176zM328.6 304.2C312.6 280.9 318.6 248.9 340.5 233.2C361.7 218.1 391 222.9 406.5 245.4L473.5 343L393.6 398.9L328.6 304.1z" />
    </svg>
  ),
  reports: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>,
  rx: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 1-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /></svg>,
  expire: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" /></svg>,
  clock: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  bell: () => <SvgI d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />,
  home: () => <SvgI d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" />,
  user: () => <SvgI d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />,
  plus: () => <SvgI d="M12 5v14M5 12h14" />,
  edit: () => <SvgI d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />,
  trash: () => <SvgI d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />,
  close: () => <SvgI d="M18 6L6 18M6 6l12 12" />,
  check: () => <SvgI d="M20 6L9 17l-5-5" />,
  back: () => <SvgI d="M19 12H5M12 5l-7 7 7 7" />,
  chev: () => <SvgI d="M9 18l6-6-6-6" />,
  upload: () => <SvgI d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  logout: () => <SvgI d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  eye: () => <SvgI d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  eyeOff: () => <SvgI d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />,
  warn: () => <SvgI d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />,
  search: () => <SvgI d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />,

  // ── Medicine Category Icons ──
  typeTablet: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M7 12h10" /></svg>,
  typeCapsule: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="8" rx="4" /><path d="M12 10v8" /></svg>,
  typeSyrup: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h10v4a2 2 0 0 0 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 0 2-2V3z" /><path d="M10 3v4" /><path d="M14 3v4" /><path d="M9 14h6" /></svg>,
  typeInjection: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 4-4" /><path d="M9 15l10-10" /><path d="M11 13l4 4" /><path d="M5 19l4 4" /><path d="m14 6 4 4" /><path d="M21 3l-2 2" /></svg>,
  typeInhaler: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2v14a4 4 0 0 0 4 4h9" /><path d="M12 2a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3" /><path d="M11 20H7" /></svg>,
  typeDrops: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>,
  typeCream: (p) => <svg width={p.s || 20} height={p.s || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 2h10l2 10H5L7 2z" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /><path d="M9 12v2" /><path d="M15 12v2" /></svg>,
};
