/**
 * Inline line-icon set (stroke = currentColor, so icons inherit theme colour).
 * 24x24 viewBox, rounded caps/joins — a clean, contemporary look.
 */
export type IconName =
  | "scorecard"
  | "plus"
  | "rules"
  | "grid"
  | "bell"
  | "sun"
  | "moon"
  | "user"
  | "award"
  | "camera"
  | "archive"
  | "shield"
  | "back"
  | "next"
  | "check"
  | "x"
  | "trash"
  | "message"
  | "pin"
  | "trophy"
  | "bolt"
  | "sparkle"
  | "waves"
  | "fish"
  | "logout"
  | "send"
  | "search";

const PATHS: Record<IconName, JSX.Element> = {
  scorecard: (
    <>
      <path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <rect x="8" y="2.5" width="8" height="4" rx="1.2" />
      <path d="M8 12h5M8 16h8" />
      <path d="M16.5 11.2 17.5 12.2 19.5 10.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  rules: (
    <>
      <path d="M12 6.5v14" />
      <path d="M12 6.5A4 4 0 0 0 8 4H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4.5a3 3 0 0 1 3.5 2" />
      <path d="M12 6.5A4 4 0 0 1 16 4h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4.5a3 3 0 0 0-3.5 2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2.5 6.5 2.5 6.5h-17S6 14 6 9Z" />
      <path d="M10.2 20a2 2 0 0 0 3.6 0" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </>
  ),
  moon: <path d="M12 3a6.5 6.5 0 1 0 9 9 8 8 0 1 1-9-9Z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="M8.3 13.5 7 22l5-2.8L17 22l-1.3-8.5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2 2 0 0 1 5 6.5h1.6l1.2-2h8.4l1.2 2H21a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8.5Z" transform="translate(0 -0.5)" />
      <circle cx="12" cy="13" r="3.6" />
    </>
  ),
  archive: (
    <>
      <rect x="3" y="3.5" width="18" height="4.5" rx="1.4" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
      <path d="M10 12h4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4.5 5.5V11c0 5 3.4 8.2 7.5 10 4.1-1.8 7.5-5 7.5-10V5.5Z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  check: <path d="M20 6.5 9.5 17 4 11.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  trash: (
    <>
      <path d="M4 6.5h16" />
      <path d="M8.5 6.5V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" />
      <path d="M6 6.5 6.8 20a1.5 1.5 0 0 0 1.5 1.4h7.4A1.5 1.5 0 0 0 17.2 20L18 6.5" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />,
  pin: (
    <>
      <path d="M19 10c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  trophy: (
    <>
      <path d="M6.5 4h11v4.5a5.5 5.5 0 0 1-11 0Z" />
      <path d="M6.5 5H4.5a2 2 0 0 0 0 4h2M17.5 5h2a2 2 0 0 1 0 4h-2" />
      <path d="M9.5 14v2.2c0 1-.6 1.6-1.5 2.3M14.5 14v2.2c0 1 .6 1.6 1.5 2.3M7 21h10" />
    </>
  ),
  bolt: <path d="M13 2.5 5 13h6l-1 8.5L18 11h-6l1-8.5Z" />,
  sparkle: (
    <path d="M12 3l1.9 4.9L19 9.8l-5.1 1.9L12 17l-1.9-5.3L5 9.8l5.1-1.9L12 3Z" />
  ),
  waves: (
    <path d="M2 7c.7.6 1.4 1.1 2.6 1.1 2.6 0 2.6-2.1 5.2-2.1s2.5 2.1 5.1 2.1c1.3 0 2-.5 2.7-1.1M2 12.5c.7.6 1.4 1.1 2.6 1.1 2.6 0 2.6-2.1 5.2-2.1s2.5 2.1 5.1 2.1c1.3 0 2-.5 2.7-1.1M2 18c.7.6 1.4 1.1 2.6 1.1 2.6 0 2.6-2.1 5.2-2.1s2.5 2.1 5.1 2.1c1.3 0 2-.5 2.7-1.1" />
  ),
  fish: (
    <>
      <path d="M3 12c2.2-3.4 5-5 8.5-5s6 1.9 6.9 5c-.9 3.1-3.4 5-6.9 5S5.2 15.4 3 12Z" />
      <path d="M18.4 12 22 8.6v6.8L18.4 12Z" />
      <circle cx="8" cy="10.6" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9.5" />
    </>
  ),
  send: <path d="M21 4 3 11l6 2.5L11.5 20l3-7L21 4Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 22, strokeWidth = 1.75, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
