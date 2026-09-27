/* What the reader is told after asking for a magic link.

   Deliberately not the auth library's error text: those messages are written
   for whoever wired the deployment up, and ADR 0004 asks Redline to be flat
   about facts and never to overclaim. A failure is logged where the owner can
   read it and reported to the reader as the one thing that is certainly true —
   no link was sent. */

export type SignInResult =
  | { readonly status: "idle" }
  | { readonly status: "sent"; readonly email: string }
  /** The address could not be used as an address. */
  | { readonly status: "unusable-address" }
  /** This deployment has no account system to sign in to. */
  | { readonly status: "not-configured" }
  /** Asked, and no link went out. */
  | { readonly status: "not-sent" }
  /** A link was opened and did not sign the reader in. */
  | { readonly status: "link-not-accepted" };

/** Whether a magic link could be sent to this at all.
 *
 *  Deliberately permissive: an address is proved by whether the link arrives,
 *  not by a pattern, so this rejects only what cannot be an address. */
export function isAddressShaped(value: string): boolean {
  if (value.length === 0 || value.length > 254) return false;
  if (/\s/.test(value)) return false;

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;

  const domain = value.slice(at + 1);
  if (domain.length < 3) return false;
  if (!domain.includes(".")) return false;

  return !domain.startsWith(".") && !domain.endsWith(".");
}
