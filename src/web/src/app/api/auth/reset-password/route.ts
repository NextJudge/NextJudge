import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBridgeUrl } from "@/lib/utils";
import { getHostnameFromHeaderValue } from "@/lib/request-host";

const resetSchema = z.object({
  email: z.string().email(),
  new_password: z.string().min(6),
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetSchema.parse(body);

    const hostname = getHostnameFromHeaderValue(
      request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    );

    const res = await fetch(`${getBridgeUrl({ hostname })}/v1/basic_reset_password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    const data = await res.json().catch(() => ({ status: "ok" }));

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Password reset failed" },
        { status: res.status },
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
