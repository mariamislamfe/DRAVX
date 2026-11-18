/** Line icons for the dashboard (24px grid, 1.75 stroke, currentColor). */
const P = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  orders: (
    <>
      <path d="M2.5 3.5h2.4l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.9a1.5 1.5 0 0 0 1.5-1.1L21 7.5H6" />
      <circle cx="9" cy="19.5" r="1.4" />
      <circle cx="17" cy="19.5" r="1.4" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c1.9.7 3.2 2.5 3.5 5.2" />
    </>
  ),
  discounts: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  products: <path d="M8.5 3.5 3 6.5l2 4.5 2-1v10.5h10V10l2 1 2-4.5-5.5-3a3.5 3.5 0 0 1-7 0Z" />,
  categories: (
    <>
      <path d="M4 3.5v14a2 2 0 0 0 2 2h4" />
      <path d="M4 8.5h6" />
      <rect x="12.5" y="4" width="8" height="6" rx="1.5" />
      <rect x="12.5" y="14" width="8" height="6" rx="1.5" />
    </>
  ),
  inventory: (
    <>
      <path d="m12 2.8 4.5 2.6v5.2L12 13.2l-4.5-2.6V5.4L12 2.8Z" />
      <path d="m7.5 10.6 4.5 2.6v5.2l-4.5 2.6L3 18.4v-5.2l4.5-2.6ZM16.5 10.6l4.5 2.6v5.2l-4.5 2.6-4.5-2.6" />
      <path d="M7.5 5.4 12 8l4.5-2.6M12 8v5.2M3 13.2l4.5 2.6 4.5-2.6M12 13.2l4.5 2.6 4.5-2.6M7.5 15.8V21M16.5 15.8V21" />
    </>
  ),
  customizer: (
    <>
      <path d="M14.5 4.5 19.5 9.5 10 19H5v-5l9.5-9.5Z" />
      <path d="m12.5 6.5 5 5" />
    </>
  ),
  payments: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  shipping: (
    <>
      <path d="M2.5 5.5h11v11h-11z" />
      <path d="M13.5 9h4l3.5 3.5v4h-7.5" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  integrations: (
    <>
      <path d="M7 2.5v4M12 2.5v4M5 6.5h9v4a4.5 4.5 0 0 1-9 0v-4Z" />
      <path d="M9.5 15v2.5a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V12" />
      <path d="M14.5 8.5h4v3.5h-4z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  menu: <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4" />,
};

export type IconName = keyof typeof P;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
