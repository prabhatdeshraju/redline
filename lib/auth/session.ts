/* Who the shell thinks it is talking to.

   Four states, all of them designed. "Not configured" and "unreachable" are the
   honest halves of what is usually collapsed into a crash: a deployment with no
   account system, and an account system that did not answer. Neither stops a
   reader from having a document inspected, because that never needed an
   account — so neither is allowed to stop the shell from rendering.

   The state is derived from an injected `ReaderLookup`. That is the seam: the
   application hands in a lookup backed by Supabase, a test hands in one backed
   by a cookie jar, and the states below are reached the same way in both. */

export type Reader = {
  readonly id: string;
  /** Present for every reader who signed in by magic link, which is every
   *  reader Redline has. Nullable because Supabase's user record permits it. */
  readonly email: string | null;
};

export type AccountsState =
  /** This deployment has no `NEXT_PUBLIC_SUPABASE_*` configuration. */
  | { readonly accounts: "not-configured" }
  /** There is an account system and it did not answer. */
  | { readonly accounts: "unreachable" }
  | { readonly accounts: "signed-out" }
  | { readonly accounts: "signed-in"; readonly reader: Reader };

/** Resolves the reader the current request's cookies belong to, or null when
 *  they belong to nobody. Throws only when the account system could not be
 *  asked at all. */
export type ReaderLookup = () => Promise<Reader | null>;

export function readerFromUser(
  user: { id: string; email?: string | null } | null | undefined,
): Reader | null {
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/** Pass null for `lookup` when there is no account system to ask. */
export async function readAccountsState(
  lookup: ReaderLookup | null,
): Promise<AccountsState> {
  if (!lookup) return { accounts: "not-configured" };

  let reader: Reader | null;
  try {
    reader = await lookup();
  } catch {
    return { accounts: "unreachable" };
  }

  return reader ? { accounts: "signed-in", reader } : { accounts: "signed-out" };
}

export function readerLabel(state: AccountsState): string {
  if (state.accounts !== "signed-in") return "";
  return state.reader.email ?? "Signed in";
}
