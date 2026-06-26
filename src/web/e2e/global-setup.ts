import { assertLocalTestUrl } from "./constants";

const getHostname = (url: string): string => new URL(url).hostname;

const globalSetup = (): void => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
  assertLocalTestUrl(baseUrl);

  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (authUrl) {
    const baseHost = getHostname(baseUrl);
    const authHost = getHostname(authUrl);
    if (baseHost !== authHost) {
      throw new Error(
        `E2E host mismatch: PLAYWRIGHT_BASE_URL uses ${baseHost} but auth URL uses ${authHost}. ` +
          "Set AUTH_URL and NEXTAUTH_URL to the same host as PLAYWRIGHT_BASE_URL.",
      );
    }
  }
};

export default globalSetup;
