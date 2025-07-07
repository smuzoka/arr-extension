import React from 'react';
import type { ArrApp } from '../api/types';
import { getAppIcon } from '../utils/icons';

interface AppSwitcherProps {
  apps: ArrApp[];
  selectedApp: ArrApp | null;
  onAppSelect: (app: ArrApp) => void;
}

const AppSwitcher: React.FC<AppSwitcherProps> = ({ apps, selectedApp, onAppSelect }) => {
  if (apps.length === 0) {
    return null;
  }

  return (
    <div className="app-switcher">
      {apps.map(app => (
        <button
          key={app.id}
          className={`app-icon ${selectedApp?.id === app.id ? 'active' : ''}`}
          onClick={() => onAppSelect(app)}
          title={app.name}
        >
          {getAppIcon(app.type)}
        </button>
      ))}
    </div>
  );
};

export default AppSwitcher; 