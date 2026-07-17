import { asJsonBody, readJsonBody } from "@/lib/bff-utils";
import { createIwmAuthClient } from "@/lib/iwm-auth-client";
import { clearSessionCookies } from "@/lib/session-cookies";
import type { components } from "@/types/schemas-auth";
import { NextResponse } from "next/server";

type RefreshTokenRequest = components["schemas"]["RefreshTokenRequest"];

export async function POST(request: Request) {
  const body = await readJsonBody<RefreshTokenRequest>(request);
  const client = createIwmAuthClient(request);
  const result = await client.POST("/api/auth/logout", {
    body: asJsonBody(body),
  });

  const response = NextResponse.json(result.data ?? result.error ?? null, {
    status: result.response.status,
  });
  clearSessionCookies(response);
  return response;
}
