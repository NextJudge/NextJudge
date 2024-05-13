"use server";

import { EmailTemplate } from "@/components/email/template";
import { Resend } from "resend";

export async function sendEmail(formData: FormData) {
  const email = formData.get("email");
  const name = formData.get("name");
  if (!email || !name) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: [email.toString()],
    react: EmailTemplate({ firstName: name.toString() }),
    subject: `${name.toString()}, NextJudge is preparing for launch! 🚀`,
    text: "",
  });
}
