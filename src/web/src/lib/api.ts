import { getBridgeUrl } from "./utils";




export async function fetchLanguages() {
    const data = await fetch(`${getBridgeUrl()}/v1/languages`);
    return data.json()
}


export async function fetchProblems() {
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


