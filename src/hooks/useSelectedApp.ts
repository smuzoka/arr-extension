import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import type { ArrAppWithKey } from '../api/types';
import { getOrigin } from '../utils/validators';

type PermissionState = {
  hasPermission: boolean;
  error: string | null;
};

export const useSelectedApp = () => {
  const [apps, setApps] = useState<ArrAppWithKey[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>({
    hasPermission: true,
    error: null
  });

  useEffect(() => {
    const load = async () => {
      const savedApps = await storage.getArrApps();
      setApps(savedApps);

      const persistedId = await storage.getSelectedAppId();
      const initialId = persistedId && savedApps.some(app => app.id === persistedId)
        ? persistedId
        : savedApps[0]?.id ?? null;

      setSelectedAppId(initialId);
      await storage.setSelectedAppId(initialId);
    };

    load();
  }, []);

  const selectedApp = useMemo(
    () => apps.find(app => app.id === selectedAppId) || null,
    [apps, selectedAppId]
  );

  const ensurePermission = useCallback(async (app: ArrAppWithKey | null) => {
    if (!app) return true;
    const origin = getOrigin(app.url);
    if (!origin) return false;

    const hasPermission = await chrome.permissions.contains({
      origins: [`${origin}/*`]
    });

    if (!hasPermission) {
      setPermissionState({
        hasPermission: false,
        error: 'Host permission not granted for this server.'
      });
      return false;
    }

    setPermissionState({ hasPermission: true, error: null });
    return true;
  }, []);

  const selectApp = useCallback(async (app: ArrAppWithKey) => {
    const allowed = await ensurePermission(app);
    if (!allowed) return;
    setSelectedAppId(app.id);
    await storage.setSelectedAppId(app.id);
  }, [ensurePermission]);

  const saveApps = useCallback(async (nextApps: ArrAppWithKey[]) => {
    setApps(nextApps);
    await storage.saveArrApps(nextApps);
  }, []);

  return {
    apps,
    selectedApp,
    permissionState,
    selectApp,
    saveApps,
    setApps
  };
};
