"use server";

import { EmailTemplate } from "@/components/email/template";

import { Resend } from "resend";
import { ZodError } from "zod";
import { newsletterFormSchema } from "./validation";

interface ReturnType {
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
