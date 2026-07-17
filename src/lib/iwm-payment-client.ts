import type { paths } from "@/types/schemas-payment";
import createClient from "openapi-fetch";
import { getIwmEnv } from "./env";

export function createIwmPaymentClient() {
  const { baseUrl, clientId, apiKey } = getIwmEnv();
  return createClient<paths>({
    baseUrl,
    headers: {
      "X-Client-Id": clientId,
      "X-Api-Key": apiKey,
    },
  });
}
