import type { paths } from "@/types/schemas-payment";
import createClient from "openapi-fetch";
import { getIwmEnv } from "./env";
import { iwmFetch } from "./iwm-fetch";
import {
  buildIwmRequestHeaders,
  type IwmHeaderOptions,
} from "./iwm-headers";

export function createIwmPaymentClient(
  request: Request,
  headerOptions?: IwmHeaderOptions,
) {
  const { baseUrl } = getIwmEnv();

  return createClient<paths>({
    baseUrl,
    fetch: iwmFetch,
    headers: buildIwmRequestHeaders(request, headerOptions),
  });
}
