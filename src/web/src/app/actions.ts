"use server";

import { EmailTemplate } from "@/components/email/template";

import { LoginFormValues, SignUpFormValues } from "@/types";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { ZodError } from "zod";
import { auth, prisma, signIn } from "./auth";
import { newsletterFormSchema } from "./validation";

import { fetchProblems as apiFetchProblems } from "@/lib/api";

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
  const hasUser = await prisma.users.findUnique({
    where: { email },
  });

  if (hasUser) {
    return {
      status: "error",
      message: "User already exists",
    };
  }
  const image = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${email}`;
  await prisma.users.create({
    data: {
      email,
      password_hash: password,
      name: email.split("@")[0],
      image,
    },
  });

  return {
    status: "success",
    message: "User created!",
  };
}

export async function fetchProblems(page?: number, limit?: number) {
  // TODO revisit this
  return await apiFetchProblems()


  if (!page || !limit) {
    const problems = await prisma.problems.findMany({
      include: {
        users: true,
      },
    });
    return problems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      prompt: problem.prompt,
      timeout: problem.timeout,
      user_id: problem.user_id,
      upload_date: problem.upload_date,
      author: problem.users?.name ?? "Unknown",
    }));
  }
  const problems = await prisma.problems.findMany({
    take: limit,
    skip: (page - 1) * limit,
    include: {
      users: true,
    },
  });
  return problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    prompt: problem.prompt,
    timeout: problem.timeout,
    user_id: problem.user_id,
    upload_date: problem.upload_date,
    author: problem.users?.name ?? "Unknown",
  }));
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
  id: number;
  name: string;
  password: string;
}
export async function changeProfile(data: ProfileData) {
  try {
    const { id, name, password } = data;
    await prisma.users.update({
      where: { id },
      data: {
        name,
        password_hash: password,
      },
    });
    return {
      status: "success",
      message: "Profile updated",
      newProfile: {
        name,
        password,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export type Difficulty = "VERY_EASY" | "EASY" | "MEDIUM" | "HARD" | "VERY_HARD";

interface CreateProblemData {
  title: string;
  prompt: string;
  timeout: number;
  difficulty: Difficulty;
  upload_date: Date;
  categories?: number[];
}

export async function createProblem(data: CreateProblemData) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return {
      status: "error",
      message: "Invalid session",
    };
  }
  const id = parseInt(session.user.id);
  if (isNaN(id) || !id) {
    return {
      status: "error",
      message: "Invalid user",
    };
  }
  try {
    const { title, prompt, timeout, difficulty, upload_date, categories } =
      data;

    const problem = await prisma.problems.create({
      data: {
        title,
        prompt,
        timeout,
        difficulty,
        upload_date,
        users: {
          connect: {
            id: id,
          },
        },
      },
    });

    if (categories) {
      await prisma.problem_categories.createMany({
        data: categories.map((categoryId) => ({
          category_id: categoryId,
          problem_id: problem.id,
        })),
      });
    }

    revalidatePath("/platform/admin/problems");
    return {
      status: "success",
      message: "Problem created",
    };
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export async function fetchCategories() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return {
        status: "error",
        message: "Invalid session",
      };
    }
    const categories = await prisma.categories.findMany();
    return categories;
  } catch (error) {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export async function deleteProblem(id: number) {
  try {
    await prisma.problems.delete({
      where: { id },
    });
    revalidatePath("/platform/admin/problems");
    return {
      status: "success",
      message: "Problem deleted!",
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}
