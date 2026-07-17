import { toBffResponse } from "@/lib/bff-utils";
import { createIwmPaymentClient } from "@/lib/iwm-payment-client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createIwmPaymentClient();
  const result = await client.GET("/api/payments/orders/{id}", {
    params: { path: { id } },
  });
  return toBffResponse(result);
}
