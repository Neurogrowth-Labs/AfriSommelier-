/**
 * Supabase client wired to Clerk.
 *
 * Build a Supabase client per-call that injects the Clerk JWT (template
 * "supabase") into the Authorization header so RLS policies receive the
 * Clerk user id as `auth.jwt() ->> 'sub'`.
 *
 * The shape mirrors the official Clerk + Supabase guide:
 *   https://clerk.com/docs/integrations/databases/supabase
 */

import { useAuth } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import { SUPABASE_JWT_TEMPLATE } from './clerk';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Database calls will fail until they are configured.'
  );
}

export type ClerkGetToken = (
  options?: { template?: string }
) => Promise<string | null>;

/**
 * Build a Supabase client whose every request carries a fresh Clerk JWT.
 *
 * The token is fetched via `getToken({ template: 'supabase' })` per-request
 * so it is always current and never stale across long-lived sessions.
 */
export function getSupabaseClient(getToken: ClerkGetToken): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (input, init) => {
        const token = await getToken({ template: SUPABASE_JWT_TEMPLATE });
        const headers = new Headers(init?.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          headers.set('apikey', supabaseAnonKey);
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * React hook that returns a memoized Supabase client bound to the current
 * Clerk session. Use this from any component that needs to read or write
 * data; the underlying client is rebuilt only when Clerk's getToken
 * reference changes (i.e., across sign-ins).
 */
export function useSupabase(): SupabaseClient {
  const { getToken } = useAuth();
  return useMemo(() => getSupabaseClient(getToken as ClerkGetToken), [getToken]);
}

/* ------------------------------------------------------------------ */
/* Field-name helpers                                                 */
/* ------------------------------------------------------------------ */
/*
 * Postgres columns are snake_case but the existing TypeScript components
 * read fields like `wine.statusColor` or `event.createdAt`. These shallow
 * helpers translate between the two layers; nested values (jsonb columns
 * such as taste_dna.profile) are preserved as-is.
 */

const toSnakeKey = (key: string) =>
  key.replace(/[A-Z]/g, (l) => '_' + l.toLowerCase());

const toCamelKey = (key: string) =>
  key.replace(/_([a-z0-9])/g, (_m, c) => c.toUpperCase());

export function toSnake<T extends Record<string, unknown>>(
  obj: T
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[toSnakeKey(k)] = v;
  }
  return out;
}

export function toCamel<T = Record<string, unknown>>(row: unknown): T {
  if (row === null || row === undefined) return row as T;
  if (Array.isArray(row)) return row.map((r) => toCamel(r)) as unknown as T;
  if (typeof row !== 'object') return row as T;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
    out[toCamelKey(k)] = v;
  }
  return out as T;
}

export function toCamelList<T = Record<string, unknown>>(rows: unknown[] | null): T[] {
  if (!rows) return [];
  return rows.map((r) => toCamel<T>(r));
}
