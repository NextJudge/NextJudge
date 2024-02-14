import ApiService from "@classes/ApiService";
import { getLanguagesHook, userSwaggerTags } from "@hooks/users";
import { DATABASE_HOST, DATABASE_PORT } from "@util/constants";
import { Elysia, t } from "elysia";


const postJudgeComplete = async ({
  bearer,
  body,
}: {
  bearer: string;
  body: { submission_id: number, success: string };
}) => {
  try {
    console.log("Judge submitted a judgement")
    console.log(body)

    console.log("Sending it to the database")
    const response = await ApiService.patch(
      `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/submissions/${body.submission_id}`,
      {
        status:body.success,
        failed_test_case_id:1
      }
    );

    if (!response.ok){
      console.log(await response.json())
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("Done!")

    return "thanks!"
  } catch (error) {
    throw { success: false, message: error };
  }
};

const postJudgeHook = {
  ...userSwaggerTags,
  body: t.Object({ 
    success: t.String(),
    submission_id: t.Integer(), 
  }),
};

const judgingEndpoints = new Elysia()
  .post("/judging_complete",postJudgeComplete, postJudgeHook);

export default judgingEndpoints;
