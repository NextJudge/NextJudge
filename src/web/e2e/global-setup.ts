import { assertLocalTestUrl } from "./constants";

const globalSetup = (): void => {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:8080";
  assertLocalTestUrl(baseUrl);
};

export default globalSetup;
