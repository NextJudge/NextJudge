import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBridgeUrl } from "@/lib/utils";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    const res = await fetch(`${getBridgeUrl()}/v1/basic_request_password_reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const data = await res.json().catch(() => ({ status: "ok" }));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Password reset request failed" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
