/**
 * `fetch` utilisé par les clients openapi-fetch vers le Kernel IWM.
 *
 * openapi-fetch appelle `fetch(new Request(...))`, et Next.js transmet alors le
 * corps sous forme de flux (ReadableStream). Or le `fetch` de Node (undici)
 * échoue avec « TypeError: fetch failed — expected non-null body source »
 * lorsqu'une requête POST à corps-flux reçoit une réponse 401 (identifiants
 * invalides, jeton expiré…) : le BFF renvoyait alors une 500 vide au lieu du
 * message d'erreur du Kernel.
 *
 * On relit donc le corps en texte et on rappelle `fetch(url, init)` : le corps
 * est rejouable, et les 401 sont transmises normalement au front.
 */
export async function iwmFetch(request: Request): Promise<Response> {
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: body === "" ? undefined : body,
    signal: request.signal,
    cache: "no-store",
  });
}
