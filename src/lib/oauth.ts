/**
 * Shared Google OAuth helper.
 *
 * Centralises the Clerk OAuth call and error → friendly message
 * mapping so the landing-page CTA and the LoginScreen both speak with
 * one voice. The 422 "oauth_google does not match one of the allowed
 * values" surfaces when Google has not been enabled under
 *   Clerk dashboard → Configure → Social Connections.
 * We detect that specifically and tell the user (and operator) what to
 * do instead of dumping the raw API error.
 */

/**
 * Minimal structural type for the Clerk `signIn` resource we use.
 * `@clerk/types` isn't a direct dependency, so we describe just what we
 * touch.
 */
interface SignInResourceLike {
  authenticateWithRedirect: (opts: {
    strategy: string;
    redirectUrl: string;
    redirectUrlComplete: string;
  }) => Promise<unknown>;
}

export interface OAuthError {
  message: string;
  /** True when the failure points at dashboard misconfiguration. */
  isConfiguration: boolean;
}

const GOOGLE_NOT_ENABLED =
  'Google sign-in is temporarily unavailable. Please try again in a moment, or contact the AfriSommelier team if the problem persists.';

const GENERIC_FAILURE = 'We could not start the Google sign-in. Please try again.';

export function describeOAuthError(error: unknown): OAuthError {
  const err = error as {
    errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
    message?: string;
    status?: number;
  } | undefined;

  const first = err?.errors?.[0];
  const code = first?.code ?? '';
  const longMessage = first?.longMessage ?? first?.message ?? err?.message ?? '';
  const status = err?.status;

  // Clerk returns this code (or message fragment) when the strategy is
  // not in the application's enabled list.
  const looksLikeStrategyDisabled =
    status === 422 ||
    code === 'form_param_value_invalid' ||
    /strategy/i.test(longMessage) && /allowed values/i.test(longMessage) ||
    /oauth_google does not match/i.test(longMessage);

  if (looksLikeStrategyDisabled) {
    return { message: GOOGLE_NOT_ENABLED, isConfiguration: true };
  }

  if (longMessage) {
    return { message: longMessage, isConfiguration: false };
  }
  return { message: GENERIC_FAILURE, isConfiguration: false };
}

/**
 * Kick off Google OAuth via Clerk. Returns a promise that resolves on
 * the redirect (so callers should not chain UI updates after it).
 */
export async function startGoogleSignIn(signIn: SignInResourceLike): Promise<void> {
  await signIn.authenticateWithRedirect({
    strategy: 'oauth_google',
    redirectUrl: `${window.location.origin}/sso-callback`,
    redirectUrlComplete: `${window.location.origin}/`,
  });
}
