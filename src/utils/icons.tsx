import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

interface SvgIconProps extends IconProps {
  children: ReactNode;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const iconClass = (className = '') => ['icon', className].filter(Boolean).join(' ');

const SvgIcon = ({
  className = '',
  style,
  children,
  viewBox = '0 0 24 24',
  fill = 'none',
  stroke = 'currentColor',
  strokeWidth = 2,
}: SvgIconProps) => (
  <svg
    aria-hidden="true"
    className={iconClass(className)}
    fill={fill}
    focusable="false"
    stroke={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={strokeWidth}
    style={style}
    viewBox={viewBox}
  >
    {children}
  </svg>
);

export const getAppIcon = (type: string, props: IconProps = {}) => {
  const { className = '', style = {} } = props;

  switch (type) {
    case 'sonarr':
      return (
        <img
          src="/sonarr.png"
          alt="Sonarr"
          className={`app-icon-png ${className}`.trim()}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    case 'radarr':
      return (
        <img
          src="/radarr.png"
          alt="Radarr"
          className={`app-icon-png ${className}`.trim()}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    default:
      return (
        <SvgIcon className={className} style={style} viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="6" rx="2" />
          <rect x="4" y="13" width="16" height="6" rx="2" />
          <path d="M8 8h.01M8 16h.01M12 8h4M12 16h4" />
        </SvgIcon>
      );
  }
};

export const SettingsIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon
    className={className}
    style={style}
    viewBox="0 0 512 512"
    fill="currentColor"
    stroke="none"
  >
    <path d="M487.4 315.7l-42.2-24.3c2.7-18 2.7-36.5 0-54.5l42.2-24.3c15.1-8.7 21.7-27 15.7-43.3l-45.1-123.2c-6-16.4-22.8-26.3-39.9-23.5l-48 7.9c-14.1-12.2-29.6-22.5-46.3-30.5L314.9 10c-3-17.1-17.9-29.6-35.3-29.6H232.4c-17.4 0-32.3 12.5-35.3 29.6l-8.9 49.9c-16.7 8-32.2 18.2-46.3 30.5l-48-7.9c-17.1-2.8-33.8 7.1-39.9 23.5L8.9 229.2c-6 16.4 .6 34.6 15.7 43.3l42.2 24.3c-2.7 18-2.7 36.5 0 54.5l-42.2 24.3c-15.1 8.7-21.7 27-15.7 43.3l45.1 123.2c6 16.4 22.8 26.3 39.9 23.5l48-7.9c14.1 12.2 29.6 22.5 46.3 30.5l8.9 49.9c3 17.1 17.9 29.6 35.3 29.6h47.2c17.4 0 32.3-12.5 35.3-29.6l8.9-49.9c16.7-8 32.2-18.2 46.3-30.5l48 7.9c17.1 2.8 33.8-7.1 39.9-23.5l45.1-123.2c6-16.3-.6-34.6-15.7-43.3zM256 352c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z" />
  </SvgIcon>
);

export const CloseIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M6 6l12 12M18 6L6 18" />
  </SvgIcon>
);

export const AddIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);

export const CheckIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </SvgIcon>
);

export const MoonIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
  </SvgIcon>
);

export const SunIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </SvgIcon>
);

export const FilterIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M4 6h16l-6 7v5l-4-2v-3L4 6z" />
  </SvgIcon>
);

export const ChevronUpIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M6 14l6-6 6 6" />
  </SvgIcon>
);

export const ChevronDownIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M6 10l6 6 6-6" />
  </SvgIcon>
);

export const SyncIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M20 7v5h-5" />
    <path d="M4 17v-5h5" />
    <path d="M6.8 9A7 7 0 0 1 18 7" />
    <path d="M17.2 15A7 7 0 0 1 6 17" />
  </SvgIcon>
);

export const SpinnerIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </SvgIcon>
);

export const StarIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style} fill="currentColor" stroke="none" viewBox="0 0 24 24">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5z" />
  </SvgIcon>
);

export const GlobeIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </SvgIcon>
);

export const TvIcon = ({ className = '', style = {} }: IconProps) => (
  <SvgIcon className={className} style={style}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M9 21h6M12 18v3" />
  </SvgIcon>
);
