import { Category, Language, Submission } from "./types";
import { getBridgeUrl } from "./utils";




export async function apiGetLanguages(): Promise<Language[]> {
    const data = await fetch(`${getBridgeUrl()}/v1/languages`);
    return data.json()
}

export async function apiGetCategories(): Promise<Category[]> {
    const data = await fetch(`${getBridgeUrl()}/v1/categories`);
    return data.json()
}

export async function apiGetProblemCategories(problem_id: number) {
  const data = await fetch(`${getBridgeUrl()}/v1/categories/${problem_id}`);
  return data.json()
}

export async function apiGetProblems() {
    const data = await fetch(`${getBridgeUrl()}/v1/problems`);
    return data.json()
}


export async function fetchProblemID(id: number) {
    const data = await fetch(`${getBridgeUrl()}/v1/problems/${id}`);
    return data.json()
}


export async function postSolution(code: string, language_id: string, problem_id: number, user_id: string) {
    const response = await fetch(`${getBridgeUrl()}/v1/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: code,
          language_id: language_id,
          problem_id: problem_id,
          user_id: user_id,
        }),
      });

    return response.json()
}

export async function apiGetSubmissionsStatus(id: string): Promise<Submission> {
  const data = await fetch(`${getBridgeUrl()}/v1/submissions/${id}`);
  return data.json()
}

export async function apiGetRecentSubmissions(user_id: string): Promise<Submission[]> {
  const data = await fetch(`${getBridgeUrl()}/v1/user_submissions/${user_id}`)
  console.log(data)
  return data.json()
}

export async function apiGetRecentSubmissionsForProblem(problem_id: number, user_id: string): Promise<Submission[]> {
  const data = await fetch(`${getBridgeUrl()}/v1/user_problem_submissions/${user_id}/${problem_id}`)
  console.log(data)
  return data.json()
}


export async function apiGetTestCasesForProblem(id: number) {
  const data = await fetchProblemID(id)
  return data.test_cases
}

