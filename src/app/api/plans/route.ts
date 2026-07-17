import { toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";

export async function GET() {
  const client = createIwmPaymentClient();
  const result = await client.GET("/api/plans");
  return toBffResponse(result);
}
