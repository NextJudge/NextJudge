import submissionEndpoints from "@routes/submissions";
import userEndpoints from "@routes/users";
import { Elysia } from "elysia";

const userRouter = new Elysia().use(userEndpoints);
const submissionsRouter = new Elysia().use(submissionEndpoints);

export { submissionsRouter, userRouter };
