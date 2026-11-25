import type { paths } from "@/types/schemas-auth";
import createClient from "openapi-fetch";
import { getIwmEnv } from "./env";
import { iwmFetch } from "./iwm-fetch";
import {
  buildIwmRequestHeaders,
  type IwmHeaderOptions,
} from "./iwm-headers";

export function createIwmAuthClient(
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
