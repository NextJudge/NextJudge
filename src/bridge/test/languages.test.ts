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

describe("LANGUAGES TEST", () => {
  it("/GET /languages should return a list of supported languages", async () => {
    const response = await api.languages.get({
      $headers: {
        Authorization: `Bearer ${globals.token}`,
      },
    });
    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          language: expect.any(String),
          extension: expect.any(String),
        }),
      ])
    );
  });
});
