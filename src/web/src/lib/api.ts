import { SignUpFormValues } from "@/types";
import { Category, Language, Problem, Submission, User } from "./types";
import { getBridgeUrl } from "./utils";




export async function apiGetLanguages(): Promise<Language[]> {
    const data = await fetch(`${getBridgeUrl()}/v1/languages`);
    return data.json()
}

export async function apiGetCategories(): Promise<Category[]> {
    const data = await fetch(
        `${getBridgeUrl()}/v1/categories`
    );
    return data.json()
}

export async function apiGetUser(token: string, user_id: string): Promise<User> {
    const data = await fetch(
        `${getBridgeUrl()}/v1/users/${user_id}`, {
        headers: {
            "Authorization": token
        }
    }
    );
    return data.json()
}

export async function apiGetProblemCategories(token: string, problem_id: number) {
    const data = await fetch(
        `${getBridgeUrl()}/v1/categories/${problem_id}`, {
        headers: {
            "Authorization": token
        }
    }
    );
    return data.json()
}

export async function apiGetProblems(token: string): Promise<Problem[]> {
    try {

        const data = await fetch(
            `${getBridgeUrl()}/v1/problems`, {
                headers: {
                    "Authorization": token
                }
            }
        );
        return data.json()
    } catch (e) {
        throw new Error("Failed to fetch problems")
    }
}


export async function fetchProblemID(token: string, id: number): Promise<Problem> {
    try {

        const data = await fetch(
            `${getBridgeUrl()}/v1/problems/${id}`, {
                headers: {
                    "Authorization": token
                }
            }
        );
        return data.json()
    } catch (e) {
        throw new Error("Failed to fetch problem")
    }
}


export async function postSolution(token: string, code: string, language_id: string, problem_id: number, user_id: string) {
    const response = await fetch(`${getBridgeUrl()}/v1/submissions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
        body: JSON.stringify({
            source_code: code,
            language_id: language_id,
            problem_id: problem_id,
            // user_id: user_id,
        }),
    });

    return response.json()
}

export async function apiGetSubmissionsStatus(token: string, id: string): Promise<Submission> {
    const data = await fetch(
        `${getBridgeUrl()}/v1/submissions/${id}`, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token
        },
    }
    );
    return data.json()
}

export async function apiGetRecentSubmissions(token: string, user_id: string): Promise<Submission[]> {
    const data = await fetch(
        `${getBridgeUrl()}/v1/user_submissions/${user_id}`, {
        headers: {
            "Authorization": token
        }
    }
    )
    console.log(data)
    return data.json()
}

export async function apiGetRecentSubmissionsForProblem(token: string, problem_id: number, user_id: string): Promise<Submission[]> {
    const data = await fetch(
        `${getBridgeUrl()}/v1/user_problem_submissions/${user_id}/${problem_id}`, {
        headers: {
            "Authorization": token
        }
    }
    )

    return data.json()
}

// Called server side
export async function apiBasicSignUpUser(data: SignUpFormValues) {
    try {
        console.log("Sending request now to create account")
        // const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;
        const { email, password } = data;

        const response = await fetch(
            `${getBridgeUrl()}/v1/basic_register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        const jsonData = await response.json()

        if (response.ok) {
            return {
                status: "success",
                message: "User created!",
            };
        }

        if(jsonData?.message.includes("User with that name already exists")) {
            return {
                status: "error",
                message: "User already exists",
            };
        }

        return {
            status: "error",
            message: "Error creating user",
        };
    } catch (e) {
        return {
            status: "error",
            message: "Error creating user - try again later",
        };
    }
}


// TODO:
// Create problem
// interface CreateProblemData {
//     title: string;
//     prompt: string;
//     timeout: number;
//     difficulty: Difficulty;
//     upload_date: Date;
//     categories?: string[];
//     input?: string;
//     output?: string;
//     is_public?: boolean;
// }

  
export async function apiCreateProblem(data: any) {
    // post the problem
    // And any associated tags
    // And testcases
    // revalidatePath("/platform/admin/problems");
    // 
}


// TODO:
// deleteProblem