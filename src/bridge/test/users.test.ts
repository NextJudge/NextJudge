import UserService from "@classes/UserService";
import { edenTreaty } from "@elysiajs/eden";
import { App } from "@main/index";
import { beforeAll, describe, expect, it } from "bun:test";

const apiPort = process.env.PORT;

const api = edenTreaty<App>(`http://localhost:${apiPort}`);
const userService = new UserService();
const globals = {
  token: "",
  users: await userService.getUsers(),
};

beforeAll(async () => {
  const { data } = await api.login.post({
    username: "test",
    password: "test",
  });

  if (data === null) {
    throw new Error("Invalid data");
  }

  globals.token = data.token || "";
});

describe("LOGIN TESTS", () => {
  it("POST /login should resolve with a valid token", async () => {
    const { data } = await api.login.post({
      username: "test",
      password: "test",
    });

    expect(data).toEqual(
      expect.objectContaining({
        token: expect.any(String),
      })
    );
  });

  it("POST /login with invalid credentials should resolve with an error", async () => {
    const { data } = await api.login.post({
      username: "test",
      password: "wrongpassword",
    });

    expect(data).toEqual(
      expect.objectContaining({
        message: "Invalid username or password",
      })
    );
  });

  it("POST /login with no body should throw an error", async () => {
    const { data } = await api.login.post({} as any);

    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("Invalid body"),
      })
    );
  });
});

describe("USER TESTS", () => {
  it("GET /users should resolve with a valid array of users", async () => {
    const { data } = await api.users.get({
      $headers: { Authorization: `Bearer ${globals.token}` },
    });

    expect(data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          username: expect.any(String),
          password_hash: expect.stringContaining("$argon2id$"),
          join_date: expect.stringMatching(
            /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
          ),
        }),
      ])
    );
  });

  it("GET /users with no token should throw an error", async () => {
    const { data } = await api.users.get({});
    expect(data).toEqual(
      expect.objectContaining({
        message: "Unauthorized",
      })
    );
  });

  it("POST /users should resolve with a valid user", async () => {
    const { data } = await api.users.post({
      username: "test2",
      password: "test2",
      isAdmin: false,
      $headers: { Authorization: `Bearer ${globals.token}` },
    });

    if (data?.user) {
      expect(data).toEqual(
        expect.objectContaining({
          user: expect.objectContaining({
            id: expect.any(Number),
            username: "test2",
            password_hash: expect.stringContaining("$argon2id$"),
            join_date: expect.stringMatching(
              /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
            ),
          }),
        })
      );
    } else {
      if (
        globals.users.find((user) => user.username === "test2") !== undefined
      ) {
        expect(data).toEqual(
          expect.objectContaining({
            message: "User already exists!",
          })
        );
      }
    }
  });

  it("POST /users with no token should throw an error", async () => {
    const { data } = await api.users.post({
      username: "test2",
      password: "test2",
      isAdmin: false,
    });

    expect(data).toEqual(
      expect.objectContaining({
        message: "Unauthorized",
      })
    );
  });

  it("POST /users with no body should throw an error", async () => {
    const { data } = await api.users.post({
      $headers: { Authorization: `Bearer ${globals.token}` },
    } as any);

    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("Invalid body"),
      })
    );
  });

  it("POST /users with empty fields should throw an error", async () => {
    const { data } = await api.users.post({
      username: "",
      password: "",
      isAdmin: true,
      $headers: { Authorization: `Bearer ${globals.token}` },
    });

    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining(`must not be empty`),
      })
    );
  });

  it("POST /users with existing user should throw an error", async () => {
    const { data } = await api.users.post({
      username: "test",
      password: "test",
      isAdmin: true,
      $headers: { Authorization: `Bearer ${globals.token}` },
    });

    expect(data).toEqual(
      expect.objectContaining({
        message: "User already exists!",
      })
    );
  });

  it("POST /users with invalid token should throw an error", async () => {
    const { data } = await api.users.post({
      username: "test2",
      password: "test2",
      isAdmin: true,
      $headers: { Authorization: `lolBearer ${globals.token}1` },
    });

    expect(data).toEqual(
      expect.objectContaining({
        message: "invalid signature",
      })
    );
  });
});
