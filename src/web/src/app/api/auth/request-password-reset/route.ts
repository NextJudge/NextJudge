import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBridgeUrl } from "@/lib/utils";
import { getHostnameFromHeaderValue } from "@/lib/request-host";
import { getEmailFrom } from "@/lib/site";
import { Resend } from "resend";

const requestSchema = z.object({
  email: z.string().email(),
});

const webBridgeSecret =
  process.env.WEB_BRIDGE_SECRET ?? process.env.AUTH_PROVIDER_PASSWORD ?? "";

function exposeDebugResetToken(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  const value = process.env.PASSWORD_RESET_DEBUG?.trim().toLowerCase();
  return value === "true" || value === "1";
}

async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("Password reset email is not configured");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: getEmailFrom(),
      to: email,
      subject: "Reset your NextJudge password",
      text: [
        "A password reset was requested for your NextJudge account.",
        "",
        `Reset token: ${token}`,
        "",
        "Open NextJudge, choose Forgot password, and paste this token. It expires in one hour.",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
    });

    if (result.error) {
      console.error("Password reset email delivery failed", result.error.message);
    }
  } catch (error) {
    console.error(
      "Password reset email delivery failed",
      error instanceof Error ? error.message : "unknown provider error",
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!webBridgeSecret) {
      console.error("WEB_BRIDGE_SECRET is not configured for password reset");
      return NextResponse.json(
        { error: "Password reset is temporarily unavailable" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const hostname = getHostnameFromHeaderValue(
      request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    );

    const res = await fetch(`${getBridgeUrl({ hostname })}/v1/basic_request_password_reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: webBridgeSecret,
      },
      body: JSON.stringify(parsed),
    });

    const data = await res.json().catch(() => ({ status: "ok" }));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Password reset request failed" },
        { status: res.status },
      );
    }

    if (typeof data.token === "string" && data.token.length > 0) {
      await sendPasswordResetEmail(parsed.email, data.token);
    }

    if (exposeDebugResetToken() && typeof data.token === "string") {
      return NextResponse.json({ status: "ok", token: data.token });
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
