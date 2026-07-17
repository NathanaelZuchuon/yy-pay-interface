import { toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createIwmPaymentClient();
  const result = await client.POST("/api/payments/orders/{id}/refresh", {
    params: { path: { id } },
  });
  return toBffResponse(result);
}
