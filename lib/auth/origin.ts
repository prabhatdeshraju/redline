/* The absolute origin of the request being served.

   A magic link has to carry an absolute URL back to this deployment, and that
   URL cannot be written down: the same build runs on localhost, on a preview
   deployment and in production. It is read off the request instead. */

export type OriginHeaders = {
  get(name: string): string | null;
};

export function originFromHeaders(headers: OriginHeaders): string | null {
  const forwardedHost = headers.get("x-forwarded-host");
  const host = forwardedHost?.trim() || headers.get("host")?.trim();
  if (!host) return null;

  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwardedProto ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");

  return `${proto}://${host}`;
}
