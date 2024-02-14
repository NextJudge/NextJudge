import ApiService from "@classes/ApiService";
import { getLanguagesHook, userSwaggerTags } from "@hooks/users";
import { DATABASE_HOST, DATABASE_PORT } from "@util/constants";
import { ProblemData } from "@util/types";
import { Elysia, t } from "elysia";

const getTestcasesHook = {
  ...userSwaggerTags,
  body: t.Object({ problemId: t.String()}),
};

const getTestcases = async ({
  bearer,
  params,
}: {
  bearer: string;
  params: { problem_id: number };
}) => {
  try {
    console.log("Getting testcases")
    console.log("[UserService] Getting users");
    const response = await ApiService.get(
      `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/problems/${params.problem_id}`
    );

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = (await response.json()) as ProblemData;
    console.log(data)

    return data
  } catch (error) {
    throw { success: false, message: error };
  }
};


const testcaseEndpoints = new Elysia().get(
  "/testcases/:problem_id",
  getTestcases,
  {
    params: t.Object({
      problem_id: t.Numeric()
    })
  }
);

export default testcaseEndpoints;
