import type { components } from "@/types/schemas-auth";
import { createIwmAuthClient } from "@/lib/iwm-auth-client";
import { readJsonBody, asJsonBody, toBffResponse } from "@/lib/bff-utils";

type ConfirmMfaLoginRequest = components["schemas"]["ConfirmMfaLoginRequest"];

export async function POST(request: Request) {
  const body = await readJsonBody<ConfirmMfaLoginRequest>(request);
  const client = createIwmAuthClient(request);
  const result = await client.POST("/api/auth/login/mfa/confirm", {
    body: asJsonBody(body),
  });
  return toBffResponse(result);
}
