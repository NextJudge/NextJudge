import { headers } from "next/headers";

export const getHostnameFromHeaderValue = (
  raw: string | null | undefined,
): string | undefined => {
  if (!raw) return undefined;
  return raw.split(",")[0]?.trim().split(":")[0];
};

export const getRequestHostname = (): string | undefined => {
  const h = headers();
  const raw = h.get("x-forwarded-host") ?? h.get("host");
  return getHostnameFromHeaderValue(raw);
};
