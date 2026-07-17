import { toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ownerId: string }> },
) {
  const { ownerId } = await params;
  const client = createIwmPaymentClient();
  const result = await client.GET("/api/payments/wallets/owner/{ownerId}", {
    params: { path: { ownerId } },
  });
  return toBffResponse(result);
}
