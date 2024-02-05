import UserService from "@classes/UserService";
import { languagesRouter, submissionsRouter, userRouter } from "@routes/index";
import { Elysia, type ErrorHandler } from "elysia";

const PORT = Bun.env.PORT || 3000;

const errorHandler: ErrorHandler = ({
  error,
  set,
  code,
  path,
  request: { method },
}) => {
  switch (code) {
    case "VALIDATION":
      set.status = 400;
      break;
    case "PARSE":
    case "INVALID_COOKIE_SIGNATURE":
      set.status = 401;
      break;
    case "NOT_FOUND":
      set.status = 404;
      break;
    default:
      set.status = 500;
  }

  if (
    typeof error.message === "object" &&
    error.message &&
    "message" in error.message
  ) {
    // @ts-ignore
    return { success: false, message: error.message.message };
  }

  console.error(method, path, set.status);
  error.stack && console.error(error.stack);

  return { success: false, message: error.message };
};

async function setupBridge() {
  const userService = new UserService();
  const users = await userService.getUsers();
  if (users.length === 0) await userService.createUser("test", "test", true);
  else console.log("[Main] Test user already exist...");
}

setupBridge();

const app = new Elysia()
  .use(userRouter)
  .use(submissionsRouter)
  .use(languagesRouter)
  .listen(PORT);

app.onError(errorHandler);

console.log(
  `[Main] Elysia is running at http://${app.server?.hostname}:${app.server?.port}\n\n\n`
);

export type App = typeof app;
