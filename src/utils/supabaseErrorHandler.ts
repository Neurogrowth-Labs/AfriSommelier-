/**
 * Supabase error handler.
 *
 * Replaces the old firestoreErrorHandler. Maps PostgrestError codes to
 * user-friendly messages and logs structured information for debugging.
 *
 * Common PostgREST / Postgres codes:
 *   42501  – permission denied (RLS violation)
 *   23505  – unique constraint violation
 *   23503  – foreign key violation
 *   23502  – not-null violation
 *   PGRST116 – no rows returned for .single()
 */

import type { PostgrestError } from '@supabase/supabase-js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  code?: string;
  details?: string;
  hint?: string;
  operationType: OperationType;
  path: string | null;
  userId?: string;
}

const CODE_MESSAGES: Record<string, string> = {
  '42501': 'You do not have permission to perform this action.',
  '23505': 'This entry already exists.',
  '23503': 'Related record is missing.',
  '23502': 'A required field is missing.',
  PGRST116: 'No matching record was found.',
};

export function friendlyMessage(
  error: unknown,
  operationType: OperationType
): string {
  if (!error) return 'Unknown error.';
  const e = error as Partial<PostgrestError> & { message?: string };
  if (e.code && CODE_MESSAGES[e.code]) return CODE_MESSAGES[e.code];
  if (e.message) return e.message;
  return `Failed to ${operationType} record.`;
}

export function handleSupabaseError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  userId?: string
): never {
  const e = error as Partial<PostgrestError> & { message?: string };
  const errInfo: SupabaseErrorInfo = {
    error: e.message ?? String(error),
    code: e.code,
    details: e.details,
    hint: e.hint,
    operationType,
    path,
    userId,
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
