import { readJsonBody, toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";
import type { components } from "@/types/schemas-payment";

type CreateWalletRequest = components["schemas"]["CreateWalletRequest"];

export async function POST(request: Request) {
  const body = await readJsonBody<CreateWalletRequest>(request);
  const client = createIwmPaymentClient();
  const result = await client.POST("/api/payments/wallets", { body });
  return toBffResponse(result);
}
