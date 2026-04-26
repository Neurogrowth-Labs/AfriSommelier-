/**
 * Clerk client configuration.
 *
 * The actual <ClerkProvider> is mounted in src/main.tsx — this file just
 * exposes the publishable key and a tiny guard so we can fail fast in dev
 * if the env var is missing.
 */

export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.warn(
    '[clerk] VITE_CLERK_PUBLISHABLE_KEY is not set. Sign-in will not work until it is configured.'
  );
}

export const SUPABASE_JWT_TEMPLATE = 'supabase';
