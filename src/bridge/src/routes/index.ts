import submissionEndpoints from "@routes/submissions";
import userEndpoints from "@routes/users";
import { Elysia } from "elysia";
import availableLangsEndpoint from "./languages";

const userRouter = new Elysia().use(userEndpoints);
const submissionsRouter = new Elysia().use(submissionEndpoints);
const languagesRouter = new Elysia().use(availableLangsEndpoint);

export { languagesRouter, submissionsRouter, userRouter };
