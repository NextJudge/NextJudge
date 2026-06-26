/** Seeded dev user (admin) — see src/data-layer/src/seed.go (password: test123). */
export const E2E_ADMIN_USER = {
  email: "Alice.Smith0@example.com",
  password: "test123",
  name: "Alice Smith",
} as const;

/** Seeded non-admin user — index 5 in seed.go (Frank.Garcia5@example.com). */
export const E2E_USER = {
  email: "Frank.Garcia5@example.com",
  password: "test123",
  name: "Frank Garcia",
} as const;

export const E2E_ADMIN_AUTH_STATE = "e2e/.auth/admin.json";
export const E2E_USER_AUTH_STATE = "e2e/.auth/user.json";

/** Python stdin/stdout solution for seeded reverse-string test cases. */
export const REVERSE_STRING_SOLUTION = "print(input()[::-1])";

export const LOCAL_HOSTS = ["127.0.0.1", "localhost"] as const;

export const assertLocalTestUrl = (url: string): void => {
  const parsed = new URL(url);
  if (!LOCAL_HOSTS.includes(parsed.hostname as (typeof LOCAL_HOSTS)[number])) {
    throw new Error(
      `Refusing to run E2E against non-local host: ${parsed.hostname}`,
    );
  }
  if (parsed.hostname.includes("nextjudge.net")) {
    throw new Error("Refusing to run E2E against production");
  }
};
