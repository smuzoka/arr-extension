import { getOrigin } from "./validators";

const getOriginPattern = (url: string): string | null => {
  const origin = getOrigin(url);
  return origin ? `${origin}/*` : null;
};

export const hasAppPermission = async (
  app: Pick<{ url: string }, "url">,
): Promise<boolean> => {
  const pattern = getOriginPattern(app.url);
  if (!pattern) {
    return false;
  }

  return chrome.permissions.contains({ origins: [pattern] });
};

export const requestAppPermission = async (
  app: Pick<{ url: string }, "url">,
): Promise<boolean> => {
  const pattern = getOriginPattern(app.url);
  if (!pattern) {
    return false;
  }

  return chrome.permissions.request({ origins: [pattern] });
};
