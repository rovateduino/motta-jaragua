import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </IconBase>
  );
}

export function CarrotIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7.5 8.5c2.8-2.8 7.6-2.4 9.8-.2L7 20.5c-1.6-1.6-2-8.8.5-12Z" />
      <path d="M11 5c.3-1.5 1.4-2.5 3-3M14 7c1.2-1.1 2.8-1.3 4.2-.8M8 10l5 2M6.5 14l4.8 1.8" />
    </IconBase>
  );
}

export function BeefIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 7c2-3 7-4 10-2l3 2c2 1.3 3 3.2 3 5.2 0 3.9-3.8 7.3-8.2 7.3H8.5C5.5 19.5 3 17 3 14c0-2.4.8-5.1 2-7Z" />
      <path d="M10 8.5c1.6-1 4-.5 4.9 1.1 1 1.7.2 4-1.7 4.7-1.8.7-4-.4-4.4-2.3-.2-1.3.2-2.7 1.2-3.5Z" />
    </IconBase>
  );
}

export function BreadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6v9H4v-9Z" />
      <path d="M9 8.5v3M13 7.5v3M17 8.5v3M4 15h16" />
    </IconBase>
  );
}

export function CheeseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 10 16-6 2 15H3V10Z" />
      <path d="M3 10c1.2-2 3.1-3.5 5.2-4.3M9 12h.01M16 10h.01M12 16h.01" />
      <circle cx="7" cy="15" r="1" />
    </IconBase>
  );
}

export function ShoppingBasketIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 10 2 10h12l2-10H4Z" />
      <path d="m8 10 4-7 4 7M9 13v4M15 13v4M3 10h18" />
    </IconBase>
  );
}

export function CupSodaIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6 8h12l-1.2 13H7.2L6 8Z" />
      <path d="M5 5h14v3H5zM13 5l2-3M9 12v5" />
    </IconBase>
  );
}

export function SprayCanIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 7h8l1 14H8L9 7Z" />
      <path d="M10 7V4h5l2 3M12 4V2h5M17 3h4M11 11h4" />
    </IconBase>
  );
}

export function SoapDispenserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 9h9l1 12H7L8 9Z" />
      <path d="M10 9V6h5l2 3M12 6V4h4l2 1M9 13h7" />
    </IconBase>
  );
}

export function SnowflakeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
      <path d="m8.5 4 3.5 2 3.5-2M8.5 20l3.5-2 3.5 2M3.5 11l3.5-1 1-3M16 17l1-3 3.5-1M3.5 13l3.5 1 1 3M16 7l1 3 3.5 1" />
    </IconBase>
  );
}

export function PawPrintIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="15.5" rx="5" ry="4.5" />
      <ellipse cx="5.5" cy="10" rx="1.8" ry="2.4" transform="rotate(-25 5.5 10)" />
      <ellipse cx="10" cy="6.5" rx="1.8" ry="2.4" transform="rotate(-8 10 6.5)" />
      <ellipse cx="15" cy="6.5" rx="1.8" ry="2.4" transform="rotate(8 15 6.5)" />
      <ellipse cx="18.5" cy="10" rx="1.8" ry="2.4" transform="rotate(25 18.5 10)" />
    </IconBase>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 6 6 6-6 6" />
    </IconBase>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 9h4l3 3v4h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </IconBase>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 9v11h16V9" />
      <path d="M3 9l2-5h14l2 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
      <path d="M9 20v-6h6v6" />
    </IconBase>
  );
}

export function HeadsetIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <rect x="3" y="13" width="4" height="7" rx="2" />
      <rect x="17" y="13" width="4" height="7" rx="2" />
      <path d="M19 20a3 3 0 0 1-3 2h-2" />
    </IconBase>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </IconBase>
  );
}

export function ClipboardListIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4h6v3H9z" />
      <path d="M9 11h6M9 15h6" />
    </IconBase>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </IconBase>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12V4h8l9 9-8 8-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </IconBase>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function MinusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
    </IconBase>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
      <path d="M10 11v5M14 11v5" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m5 12 4 4 10-10" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 6-6 6 6 6" />
    </IconBase>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="8" cy="6" r="2" />
      <circle cx="16" cy="12" r="2" />
      <circle cx="10" cy="18" r="2" />
    </IconBase>
  );
}

export function PackageIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
      <path d="m8 5.2 8 4.5" />
    </IconBase>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-5M12 16V7M16 16v-8M20 16v-3" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.1-1H3v-4h.5A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.1V3h4v.5a1.7 1.7 0 0 0 1 1.1 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.24.42.64.75 1.1.9h.5v4h-.5a1.7 1.7 0 0 0-1.1 1.1Z" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </IconBase>
  );
}

export function WalletIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
      <path d="M6 6V4h12v2" />
    </IconBase>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </IconBase>
  );
}

export function RotateCcwIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </IconBase>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </IconBase>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect width="16" height="11" x="4" y="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </IconBase>
  );
}

export function PowerIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3v9" />
      <path d="M6.4 6.4a8 8 0 1 0 11.2 0" />
    </IconBase>
  );
}
