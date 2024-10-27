"use server";

import { EmailTemplate } from "@/components/email/template";

import { LoginFormValues, SignUpFormValues } from "@/types";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { ZodError } from "zod";
import { auth, signIn } from "./auth";
import { newsletterFormSchema } from "./validation";

import { apiGetProblems as apiFetchProblems } from "@/lib/api";

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

    const { email, name } = newsletterFormSchema.parse(formData);

    const nameWithCapital =
      name.toString().charAt(0).toUpperCase() + name.toString().slice(1);
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "NextJudge <hello@nextjudge.org>",
      to: [email.toString()],
      react: EmailTemplate({ firstName: nameWithCapital }),
      subject: "Welcome to the NextJudge community! 🚀",
      text: "",
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

export async function signUpUser(data: SignUpFormValues) {
  const { email, password } = data;

  // const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;
}


export async function logUserIn(data: LoginFormValues): Promise<ReturnType> {
  const { email, password } = data;
  try {
    await signIn("credentials", {
      email,
      password,
      confirmPassword: password,
      redirect: false,
    });
    return {
      status: "success",
      message: "User logged in",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Invalid credentials",
    };
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



export async function createProblem(data: any) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return {
      status: "error",
      message: "Invalid session",
    };
  }

  //   revalidatePath("/platform/admin/problems");

  //   return {
  //     status: "success",
  //     message: "Problem created",
  //   };
  //   return {
  //     status: "error",
  //     message: "Something went wrong",
  //   };
}

interface TestCaseData {
  input: string;
  output: string;
  problem_id: number;
  is_public?: boolean;
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

export async function deleteProblem(id: number) {
  return
}
