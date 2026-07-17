import type { paths } from "@/types/schemas-auth";
import createClient from "openapi-fetch";
import { getIwmEnv } from "./env";

export function createIwmAuthClient(request: Request) {
  const { baseUrl, clientId, apiKey } = getIwmEnv();
  const authorization = request.headers.get("Authorization");

  return createClient<paths>({
    baseUrl,
    headers: {
      "X-Client-Id": clientId,
      "X-Api-Key": apiKey,
      ...(authorization ? { Authorization: authorization } : {}),
    },
  });
}
