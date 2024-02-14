import submissionEndpoints from "@routes/submissions";
import userEndpoints from "@routes/users";
import { Elysia } from "elysia";
import availableLangsEndpoint from "./languages";
import testcaseEndpoints from "./testcases";
import judgingEndpoints from "./judging";

const userRouter = new Elysia().use(userEndpoints);
const submissionsRouter = new Elysia().use(submissionEndpoints);
const languagesRouter = new Elysia().use(availableLangsEndpoint);
const testcaseRouter = new Elysia().use(testcaseEndpoints);
const judgingRouter = new Elysia().use(judgingEndpoints);


export { languagesRouter, submissionsRouter, userRouter, testcaseRouter, judgingRouter };
