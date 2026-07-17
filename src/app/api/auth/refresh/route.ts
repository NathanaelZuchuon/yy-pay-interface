import type { components } from "@/types/schemas-auth";
import { createIwmAuthClient } from "@/lib/iwm-auth-client";
import { readJsonBody, asJsonBody, toBffResponse } from "@/lib/bff-utils";

type RefreshTokenRequest = components["schemas"]["RefreshTokenRequest"];

export async function POST(request: Request) {
  const body = await readJsonBody<RefreshTokenRequest>(request);
  const client = createIwmAuthClient(request);
  const result = await client.POST("/api/auth/refresh", { body: asJsonBody(body) });
  return toBffResponse(result);
}
