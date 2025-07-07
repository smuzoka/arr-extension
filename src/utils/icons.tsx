import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const getAppIcon = (type: string, props: IconProps = {}) => {
  const { className = '', style = {} } = props;

  switch (type) {
    case 'sonarr':
      return (
        <img 
          src="/sonarr.png" 
          alt="Sonarr" 
          className={`app-icon-png ${className}`}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    case 'radarr':
      return (
        <img 
          src="/radarr.png" 
          alt="Radarr" 
          className={`app-icon-png ${className}`}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    case 'lidarr':
      return (
        <img 
          src="/lidarr.png" 
          alt="Lidarr" 
          className={`app-icon-png ${className}`}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    case 'readarr':
      return (
        <img 
          src="/readarr.png" 
          alt="Readarr" 
          className={`app-icon-png ${className}`}
          style={{ width: '20px', height: '20px', ...style }}
        />
      );
    default:
      return (
        <i 
          className={`fas fa-server ${className}`}
          style={style}
          title="Unknown App"
        />
      );
  }
};

// For settings/gear icon
export const SettingsIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-cog ${className}`} style={style} />
);

// For close/back icons
export const CloseIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-times ${className}`} style={style} />
);

export const BackIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-arrow-left ${className}`} style={style} />
);

// For add/plus icon
export const AddIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-plus ${className}`} style={style} />
);

// For check/success icon
export const CheckIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-check ${className}`} style={style} />
);

// For dark mode toggle
export const MoonIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-moon ${className}`} style={style} />
);

export const SunIcon = ({ className = '', style = {} }: IconProps) => (
  <i className={`fas fa-sun ${className}`} style={style} />
); 