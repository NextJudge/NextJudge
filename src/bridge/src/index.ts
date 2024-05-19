import ApiService from "@classes/ApiService";
import UserService from "@classes/UserService";
import { customInputRouter, languagesRouter, submissionsRouter, testcaseRouter, userRouter } from "@routes/index";
import { DATABASE_HOST, DATABASE_PORT } from "@util/constants";
import { Elysia, type ErrorHandler } from "elysia";
import { cors } from '@elysiajs/cors'
import { rabbitmq } from "./rabbitmq/rabbitmq";

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
  // // Create basic user as a test
  const userService = new UserService();
  const users = await userService.getUsers();
  if (users.length === 0) {
    await userService.createUser("test", "test", true);
  } else {
    console.log("[Main] Test user already exist...");
  }

  console.log("Setting up dummy problem")
  const response = await ApiService.post(
    `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/problems`,
    {
      title: "Boolean or not boolean",
      prompt: "If the input is 'TRUE', print 'FALSE'. Otherwise, print 'TRUE'",
      timeout: 1,
      user_id: 1,
      test_cases: [
          {
            input:"FALSE",
            expected_output: "TRUE"
          },
          {
            input:"TRUE",
            expected_output: "FALSE"
          }
      ]
    }
  );

  if(!response.ok){
    console.log("Dummy problem already exists")
  } else {
    console.log("Done created dummy problem");
    console.log(await response.json())
  }
}

// Establish RabbitMQ connection to submission queue and setup RPC listener
await rabbitmq.setup()
console.log("Connected to RabbitMQ")

await setupBridge();

const app = new Elysia()
  .use(cors())
  .use(userRouter)
  .use(submissionsRouter)
  .use(languagesRouter)
  .use(testcaseRouter)
  .use(customInputRouter)
  .listen(PORT);

app.onError(errorHandler);



console.log(
  `[Main] Elysia is running at http://${app.server?.hostname}:${app.server?.port}\n\n\n`
);



export type App = typeof app;
