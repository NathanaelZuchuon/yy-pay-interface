import { toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ walletId: string }> },
) {
  const { walletId } = await params;
  const client = createIwmPaymentClient();
  const result = await client.GET("/api/payments/wallets/{walletId}/transactions", {
    params: { path: { walletId } },
  });
  return toBffResponse(result);
}
