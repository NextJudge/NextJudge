"use server";

import { EmailTemplate } from "@/components/email/template";
import { apiCreateProblem, apiDeleteProblem, apiUpdateProblem } from "@/lib/api";
import { ProblemRequest } from "@/lib/types";
import { LoginFormValues, SignUpFormValues } from "@/types";
import { pretty, render, toPlainText } from "@react-email/components";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { ZodError } from "zod";
import { auth, signIn } from "./auth";
import { newsletterFormSchema } from "./validation";

export interface ReturnType {
  status: "error" | "success";
  message: string;
}

interface FormData {
  name: string;
  email: string;
}

export async function sendEmail(formData: FormData): Promise<ReturnType> {
  try {
    if (!formData) return { status: "error", message: "Invalid form data" };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, name } = newsletterFormSchema.parse(formData);

    const nameWithCapital = name.toString().charAt(0).toUpperCase() + name.toString().slice(1);
    const html = await pretty(await render(EmailTemplate({ firstName: nameWithCapital })))

    await resend.emails.send({
      from: process.env.NODE_ENV === "production" ? "NextJudge <hello@nextjudge.net>" : "NextJudge <dev@nextjudge.net>",
      to: process.env.NODE_ENV === "production" ? [email.toString()] : ["delivered+welcome@resend.dev"],
      react: EmailTemplate({ firstName: nameWithCapital }),
      subject: "Welcome to the NextJudge community! 🚀",
      text: toPlainText(html),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: "Invalid form data",
      };
    }
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
  return {
    status: "success",
    message: "Email sent successfully",
  };
}

export async function signUpUser(data: SignUpFormValues): Promise<ReturnType> {
  try {
    const response = await fetch(`/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      const errorMessage = result.error || 'Registration failed'
      throw new Error(errorMessage)
    }

    return {
      status: 'success',
      message: result.message,
    }
  } catch (error) {
    console.error('Signup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Network error - try again later'
    throw new Error(errorMessage)
  }
}


export async function logUserIn(data: LoginFormValues): Promise<ReturnType> {
  try {
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    return {
      status: 'success',
      message: 'Login successful',
    }
  } catch (error) {
    throw new Error('Login failed - please try again')
  }
}
interface ProfileData {
  id: string;
  name: string;
  password: string;
}

export async function changeProfile(data: ProfileData) {
  return

  // try {
  //   const { id, name } = data;
  //   await prisma.users.update({
  //     where: { id },
  //     data: {
  //       name,
  //     },
  //   });
  //   return {
  //     status: "success",
  //     message: "Profile updated",
  //     newProfile: {
  //       name,
  //       password,
  //     },
  //   };
  // } catch (error) {
  //   return {
  //     status: "error",
  //     message: "Something went wrong",
  //   };
  // }
}


interface FormProblemData {
  title: string;
  identifier: string;
  prompt: string;
  source?: string;
  difficulty: "VERY EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY HARD";
  accept_timeout: number;
  execution_timeout: number;
  memory_limit: number;
  test_cases: Array<{
    input: string;
    expected_output: string;
    hidden?: boolean;
  }>;
  public: boolean;
}

export async function createProblem(data: FormProblemData, categoryIds: string[] = []) {
  const session = await auth();
  if (!session || !session.user) {
    return {
      status: "error",
      message: "Invalid session",
    };
  }

  try {
    const problemData: ProblemRequest = {
      title: data.title,
      identifier: data.identifier || data.title.split(" ").join("-").toLowerCase(),
      prompt: data.prompt,
      source: data.source || "",
      difficulty: data.difficulty,
      timeout: data.accept_timeout || 10.0, // Default timeout
      accept_timeout: data.accept_timeout,
      execution_timeout: data.execution_timeout,
      memory_limit: data.memory_limit,
      user_id: session.nextjudge_id,
      test_cases: data.test_cases.map((tc) => ({
        input: tc.input,
        expected_output: tc.expected_output,
        hidden: tc.hidden || false
      })),
      category_ids: categoryIds,
      public: data.public
    };

    const result = await apiCreateProblem(session.nextjudge_token, problemData);

    revalidatePath("/platform/admin/problems");

    return {
      status: "success",
      message: "Problem created successfully",
      data: result
    };
  } catch (error) {
    console.error("Error creating problem:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create problem",
    };
  }
}

export async function updateProblem(problemId: number, data: FormProblemData, categoryIds: string[] = []) {
  const session = await auth();
  if (!session || !session.user) {
    return {
      status: "error",
      message: "Invalid session",
    };
  }

  try {
    const problemData: ProblemRequest = {
      title: data.title,
      identifier: data.identifier || data.title.split(" ").join("-").toLowerCase(),
      prompt: data.prompt,
      source: data.source || "",
      difficulty: data.difficulty,
      timeout: data.accept_timeout || 10.0, // Default timeout
      accept_timeout: data.accept_timeout,
      execution_timeout: data.execution_timeout,
      memory_limit: data.memory_limit,
      user_id: session.nextjudge_id,
      test_cases: data.test_cases.map((tc) => ({
        input: tc.input,
        expected_output: tc.expected_output,
        hidden: tc.hidden || false
      })),
      category_ids: categoryIds,
      public: data.public
    };

    const result = await apiUpdateProblem(session.nextjudge_token, problemId, problemData);

    revalidatePath("/platform/admin/problems");

    return {
      status: "success",
      message: "Problem updated successfully",
      data: result
    };
  } catch (error) {
    console.error("Error updating problem:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update problem",
    };
  }
}

interface TestCaseData {
  input: string;
  output: string;
  problem_id: number;
  hidden?: boolean;
}

export async function createTestCase(data: TestCaseData) {
  try {
    // await prisma.test_cases.create({
    //   data: {
    //     // is_public: data.is_public ?? true,
    //     input: data.input,
    //     expected_output: data.output,
    //     problem_id: data.problem_id,
    //   },
    // });
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
  return {
    status: "success",
    message: "Test case created",
  };
}

export async function deleteProblem(id: number): Promise<ReturnType> {
  const session = await auth();
  if (!session || !session.user) {
    return {
      status: "error",
      message: "Invalid session",
    };
  }

  try {
    await apiDeleteProblem(session.nextjudge_token, id);

    revalidatePath("/platform/admin/problems");

    return {
      status: "success",
      message: "Problem deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting problem:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to delete problem",
    };
  }
}
