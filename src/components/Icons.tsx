import React from "react";

type IconProps = React.SVGProps<SVGSVGElement>;

const base = (children: React.ReactNode, props: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

export const IconDashboard = (props: IconProps) =>
  base(
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>,
    props
  );

export const IconPractice = (props: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </>,
    props
  );

export const IconBank = (props: IconProps) =>
  base(
    <>
      <path d="M4 19.5V6a2 2 0 0 1 2-2h10.5A1.5 1.5 0 0 1 18 5.5V21" />
      <path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H18" />
      <path d="M8 7h6M8 10.5h6" />
    </>,
    props
  );

export const IconBuild = (props: IconProps) =>
  base(
    <>
      <path d="M4 6h9M4 12h5M4 18h9" />
      <circle cx="17" cy="6" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="17" cy="18" r="2.2" />
    </>,
    props
  );

export const IconPerformance = (props: IconProps) =>
  base(
    <>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M2.5 20h19" />
    </>,
    props
  );

export const IconMistakes = (props: IconProps) =>
  base(
    <>
      <path d="M12 9v4" />
      <path d="M12 16.5h.01" />
      <path d="M10.3 3.9 2.8 17a1.8 1.8 0 0 0 1.55 2.7h15.3A1.8 1.8 0 0 0 21.2 17L13.7 3.9a1.8 1.8 0 0 0-3.4 0Z" />
    </>,
    props
  );

export const IconFlag = (props: IconProps) =>
  base(
    <>
      <path d="M5 3v18" />
      <path d="M5 4h11.2c1.1 0 1.6 1.3.8 2l-2.7 2.5 2.7 2.5c.8.7.3 2-.8 2H5" />
    </>,
    props
  );

export const IconCheck = (props: IconProps) => base(<path d="M4 12.5 9.5 18 20 6" />, props);

export const IconX = (props: IconProps) => base(<path d="M6 6l12 12M18 6 6 18" />, props);

export const IconChevronLeft = (props: IconProps) => base(<path d="M15 5 8 12l7 7" />, props);

export const IconChevronRight = (props: IconProps) => base(<path d="M9 5l7 7-7 7" />, props);

export const IconClock = (props: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>,
    props
  );

export const IconMenu = (props: IconProps) => base(<path d="M3 6h18M3 12h18M3 18h18" />, props);

export const IconTarget = (props: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>,
    props
  );

export const IconStreak = (props: IconProps) =>
  base(
    <path d="M12 2.5c1.2 3 .5 4.7-.8 6.3-1.3 1.6-2.7 3-2.7 5.3a5.5 5.5 0 0 0 11 0c0-2.5-1.2-4-2.4-5.5.2 2-.4 3-1.3 3.6.2-2.4-.7-4.5-2.5-6.3-.6-.6-1-2-1.3-3.4Z" />,
    props
  );

export const IconSearch = (props: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>,
    props
  );
