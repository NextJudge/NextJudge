import ApiService from "@classes/ApiService";
import { getLanguagesHook, userSwaggerTags } from "@hooks/users";
import { DATABASE_HOST, DATABASE_PORT } from "@util/constants";
import { ProblemData } from "@util/types";
import { Elysia, t } from "elysia";

const postJudgeHook = {
  ...userSwaggerTags,
  body: t.Object({ success: t.String()}),
};


const postJudgeComplete = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { success: string };
}) => {
  try {
    console.log("Judge submitted a judgement")


    const response = await ApiService.post(
      `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/problems/${body.problemId}`,
      {
        status:body.success
      }
    );

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    return "thanks!"
  } catch (error) {
    throw { success: false, message: error };
  }
};


const judgingEndpoints = new Elysia().post(
  "/judging_complete",
  postJudgeComplete,
  postJudgeHook
);

export default judgingEndpoints;
