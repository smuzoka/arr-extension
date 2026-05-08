import { useCallback, useEffect, useMemo, useState } from "react";
import { storage } from "../utils/storage";
import type { ArrAppWithKey } from "../api/types";
import { hasAppPermission } from "../utils/appPermissions";

export const useSelectedApp = () => {
  const [apps, setApps] = useState<ArrAppWithKey[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [initialSearchTerm, setInitialSearchTerm] = useState<string | null>(
    null,
  );
  const [permissionByAppId, setPermissionByAppId] = useState<
    Record<string, boolean>
  >({});

  const refreshPermissionState = useCallback(
    async (savedApps: ArrAppWithKey[]) => {
      const entries = await Promise.all(
        savedApps.map(
          async (app) => [app.id, await hasAppPermission(app)] as const,
        ),
      );
      const nextPermissions = Object.fromEntries(entries);
      setPermissionByAppId(nextPermissions);
      return nextPermissions;
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const initializePopup = async () => {
      await storage.migrateApiKeys();

      const savedApps = await storage.getArrApps();
      if (!isMounted) return;
      setApps(savedApps);
      const permissions = await refreshPermissionState(savedApps);
      const persistedId = await storage.getSelectedAppId();
      const fallbackApp = savedApps.find((app) => permissions[app.id]) ?? null;
      const initialId =
        persistedId && permissions[persistedId]
          ? persistedId
          : (fallbackApp?.id ?? null);

      setSelectedAppId(initialId);
      await storage.setSelectedAppId(initialId);

      const text = await storage.getSelectedText();
      if (!isMounted) return;
      if (text) {
        setInitialSearchTerm(text);
        await storage.clearSelectedText();
      }
    };

    initializePopup();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === selectedAppId) || null,
    [apps, selectedAppId],
  );

  const selectApp = useCallback(
    async (app: ArrAppWithKey) => {
      if (!permissionByAppId[app.id]) return;
      setSelectedAppId(app.id);
      await storage.setSelectedAppId(app.id);
    },
    [permissionByAppId],
  );

  const saveApps = useCallback(
    async (nextApps: ArrAppWithKey[]) => {
      setApps(nextApps);
      await refreshPermissionState(nextApps);
      await storage.saveArrApps(nextApps);
    },
    [refreshPermissionState],
  );

  return {
    apps,
    selectedApp,
    permissionByAppId,
    initialSearchTerm,
    selectApp,
    saveApps,
    setApps,
  };
};
