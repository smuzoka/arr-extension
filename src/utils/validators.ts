export const MIN_API_KEY_LENGTH = 8;

export const normalizeUrl = (value: string): string =>
  value.trim().replace(/\/$/, "");

export const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const isValidApiKey = (value: string): boolean =>
  value.trim().length >= MIN_API_KEY_LENGTH;

export const getOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};
