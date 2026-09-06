import assert from "node:assert/strict";
import test from "node:test";
import { getAppUrl, getBridgeUrl } from "../src/lib/utils";

test("server-rendered preview calls stay on the preview backend", (t) => {
  const originalEnv = process.env;
  t.after(() => { process.env = originalEnv; });
  process.env = {
    ...originalEnv,
    NODE_ENV: "production",
    COOLIFY_FQDN: "110-web.preview.nextjudge.net",
    AUTH_URL: "https://nextjudge.net",
    NEXT_PUBLIC_API_URL: "https://api.nextjudge.net",
  };
  assert.equal(getBridgeUrl(), "https://110-api.preview.nextjudge.net");
  assert.equal(getAppUrl(), "https://110-web.preview.nextjudge.net");
  assert.equal(getBridgeUrl({ hostname: "111-web.preview.nextjudge.net" }),
    "https://111-api.preview.nextjudge.net");

  process.env.COOLIFY_FQDN = "nextjudge.net";
  assert.equal(getBridgeUrl(), "https://api.nextjudge.net");
  delete process.env.COOLIFY_FQDN;
  assert.equal(getBridgeUrl(), "https://api.nextjudge.net");
});
