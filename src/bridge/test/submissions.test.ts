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

describe("SUBMISSION TESTS", () => {
  it("POST /submissions with valid solution should resolve with correct", async () => {
    const { data } = await api.submission.post(
      {
        userId: globals.users[0].id.toString(),
        code: 'console.log("Hello, World!")',
        lang: "Node",
        problemId: "1",
      },
      {
        headers: {
          Authorization: `Bearer ${globals.token}`,
        },
      }
    );

    expect(data).toEqual(
      expect.objectContaining({
        submission: expect.objectContaining({
          code: expect.any(String),
          lang: expect.any(String),
          problemId: expect.any(String),
          userId: expect.any(String),
          submissionId: expect.any(String),
        }),
        output: expect.arrayContaining([
          expect.objectContaining({
            status: "AC",
            actualOutput: "Hello, World!",
            expectedOutput: "Hello, World!",
          }),
        ]),
        isCorrect: true,
      })
    );
  });

  it("POST /submissions with invalid solution should resolve with wrong", async () => {
    const { data } = await api.submission.post(
      {
        userId: globals.users[0].id.toString(),
        code: 'console.log("You\'re not hello, world!")',
        lang: "Node",
        problemId: "1",
      },
      {
        headers: {
          Authorization: `Bearer ${globals.token}`,
        },
      }
    );

    expect(data).toEqual(
      expect.objectContaining({
        submission: expect.objectContaining({
          code: expect.any(String),
          lang: expect.any(String),
          problemId: expect.any(String),
          userId: expect.any(String),
          submissionId: expect.any(String),
        }),
        output: expect.arrayContaining([
          expect.objectContaining({
            status: "WA",
            actualOutput: "You're not hello, world!",
            expectedOutput: "Hello, World!",
          }),
        ]),
        isCorrect: false,
      })
    );
  });

  it("POST /submissions with no token should throw unauthorized", async () => {
    const { data } = await api.submission.post(
      {
        userId: globals.users[0].id.toString(),
        code: 'console.log("You\'re not hello, world!")',
        lang: "Node",
        problemId: "1",
      },
      {
        headers: {
          Authorization: ``,
        },
      }
    );

    expect(data).toEqual(
      expect.objectContaining({
        message: "Unauthorized",
      })
    );
  });

  it("POST /submissions with invalid token should throw malformed error", async () => {
    const { data } = await api.submission.post(
      {
        userId: globals.users[0].id.toString(),
        code: 'console.log("You\'re not hello, world!")',
        lang: "Node",
        problemId: "1",
      },
      {
        headers: {
          Authorization: `Bearer invalidtoken`,
        },
      }
    );

    expect(data).toEqual(
      expect.objectContaining({
        message: "jwt malformed",
      })
    );
  });

  it("POST /submissions with no body should throw an error", async () => {
    const { data } = await api.submission.post({
      $headers: { Authorization: `Bearer ${globals.token}` },
    } as any);
    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("Invalid body"),
      })
    );
  });

  it("POST /submissions with empty fields should throw an error", async () => {
    const { data } = await api.submission.post({
      userId: "",
      code: "",
      lang: "",
      problemId: "",
      $headers: { Authorization: `Bearer ${globals.token}` },
    });
    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining(`Unauthorized`),
      })
    );
  });

  it("POST /submissions with syntax error should throw runtime error", async () => {
    const { data } = await api.submission.post(
      {
        userId: globals.users[0].id.toString(),
        code: 'wconsole.log("Hello, World")',
        lang: "Node",
        problemId: "1",
      },
      {
        headers: {
          Authorization: `Bearer ${globals.token}`,
        },
      }
    );

    expect(data).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("ReferenceError"),
      })
    );
  });
});
