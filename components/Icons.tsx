export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "chat":
      return (
        <svg {...p}>
          <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.4 9 9 0 0 1-3.8-.8L3 21l1.8-5.1a8.2 8.2 0 0 1-.8-3.6A8.4 8.4 0 0 1 12.5 4 8.4 8.4 0 0 1 21 11.5z" />
        </svg>
      );
    case "users":
      return (
        <svg {...p}>
          <path d="M17 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
          <circle cx="9.5" cy="7" r="3.5" />
          <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16.5 3.6a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...p}>
          <path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z" />
          <path d="M14 7.5a6 6 0 0 1 0 9M17 5a10 10 0 0 1 0 14" />
        </svg>
      );
    case "bot":
      return (
        <svg {...p}>
          <rect x="4" y="7" width="16" height="12" rx="4" />
          <path d="M12 3v4M8.5 12.5h.01M15.5 12.5h.01M9 16h6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "search":
      return (
        <svg {...p}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...p}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "send":
      return (
        <svg {...p} strokeWidth={0} fill="currentColor">
          <path d="M20.3 3.7a1 1 0 0 1 .3 1.3l-8.2 15.2c-.4.8-1.6.7-1.9-.1l-2.2-6-6-2.2c-.9-.3-1-1.5-.2-1.9L17.4 1.8l2.9 1.9z" transform="translate(1 1) scale(0.95)" />
        </svg>
      );
    case "paperclip":
      return (
        <svg {...p}>
          <path d="M21 11.5 12.5 20a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-2.8-2.8l7.8-7.8" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />
        </svg>
      );
    case "smile":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
        </svg>
      );
    case "check":
      return (
        <svg {...p} strokeWidth={2.6}>
          <path d="m4 12.5 5 5L20 6.5" />
        </svg>
      );
    case "checks":
      return (
        <svg {...p} strokeWidth={2.4}>
          <path d="m1 12.5 4.5 4.5L14 8.5M9 16.5l.5.5L22 4.5" />
        </svg>
      );
    case "reply":
      return (
        <svg {...p}>
          <path d="M9 17H7a5 5 0 0 1 0-10h10m-4-4 4 4-4 4" transform="rotate(180 12 12)" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p}>
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
        </svg>
      );
    case "edit":
      return (
        <svg {...p}>
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      );
    case "forward":
      return (
        <svg {...p}>
          <path d="M15 17l5-5-5-5M20 12H9a5 5 0 0 0-5 5v2" />
        </svg>
      );
    case "pin":
      return (
        <svg {...p}>
          <path d="M12 17v5M9 3h6l-1 5 3 3v3H7v-3l3-3z" />
        </svg>
      );
    case "close":
      return (
        <svg {...p}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
    case "back":
      return (
        <svg {...p}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...p}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "play":
      return (
        <svg {...p} strokeWidth={0} fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...p} strokeWidth={0} fill="currentColor">
          <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
        </svg>
      );
    case "camera":
      return (
        <svg {...p}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "info":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 16v-5M12 8h.01" />
        </svg>
      );
    case "logout":
      return (
        <svg {...p}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      );
    case "moon":
      return (
        <svg {...p}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
        </svg>
      );
    case "bell":
      return (
        <svg {...p}>
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case "bell-off":
      return (
        <svg {...p}>
          <path d="M13.7 21a2 2 0 0 1-3.4 0M18 8a6 6 0 0 0-9.3-5M6 8c0 7-3 8-3 8h14M2 2l20 20" />
        </svg>
      );
    case "doc":
      return (
        <svg {...p}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case "key":
      return (
        <svg {...p}>
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m11 12 9-9 3 3-2 2 2 2-3 3-2-2-2 2z" />
        </svg>
      );
    case "copy":
      return (
        <svg {...p}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </svg>
      );
    case "globe":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
        </svg>
      );
    case "book":
      return (
        <svg {...p}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case "zap":
      return (
        <svg {...p}>
          <path d="M13 2 3 14h8l-1 8 10-12h-8z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...p}>
          <path d="M19 21 12 16.5 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "poll":
      return (
        <svg {...p}>
          <path d="M6 20V10M12 20V4M18 20v-7" />
        </svg>
      );
    case "chart":
      return (
        <svg {...p}>
          <path d="M3 3v18h18" />
          <path d="M7 15l4-5 3 3 5-7" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...p}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
