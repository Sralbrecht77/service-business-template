import type { IconName } from "@/lib/business-config";

type IconProps = {
  name: IconName;
  className?: string;
};

const commonProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export function Icon({ name, className = "size-6" }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    truck: (
      <>
        <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" />
        <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </>
    ),
    container: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="M7 5v14M12 5v14M17 5v14" />
      </>
    ),
    sofa: (
      <>
        <path d="M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
        <path d="M4 11a2 2 0 0 0-2 2v4h20v-4a2 2 0 0 0-2-2M5 17v2M19 17v2" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    weight: (
      <>
        <path d="M7 7h10l2 13H5L7 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0M9 13h6" />
      </>
    ),
    stairs: (
      <>
        <path d="M3 20h5v-5h5v-5h4V5h4" />
        <path d="m13 4 3-2 3 2M16 2v5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5c0 4.6 2.8 8.1 7.5 10 4.7-1.9 7.5-5.4 7.5-10V6L12 3Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4.5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4.6V20" />
      </>
    ),
    check: <path d="m4 12 5 5L20 6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: <path d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5 16.5 16.5 0 0 0 19.5 21a1.5 1.5 0 0 0 1.5-1.5V17l-5-2-1.2 2.4a13 13 0 0 1-8.2-8.2L9 8l-2-5Z" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      {...commonProps}
    >
      {paths[name]}
    </svg>
  );
}

export function ArrowIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 20 20" fill="none">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LogoMark({ className = "size-10" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 48 48" fill="none">
      <path d="M24 3 42 14v20L24 45 6 34V14L24 3Z" fill="currentColor" />
      <path d="m13 29 11-16 11 16-4.6-3.1L24 35l-6.4-9.1L13 29Z" fill="white" />
    </svg>
  );
}
