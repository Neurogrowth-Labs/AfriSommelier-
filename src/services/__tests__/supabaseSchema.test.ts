import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const schema = readFileSync('supabase_cupido_schema.sql', 'utf8');

test('schema enables RLS for admin-managed tables', () => {
  assert.match(schema, /alter table public\.support_tickets enable row level security;/);
  assert.match(schema, /alter table public\.promotions enable row level security;/);
});

test('schema grants support and promotion mutations only through admin policies', () => {
  assert.match(schema, /create policy support_tickets_admin_manage on public\.support_tickets/);
  assert.match(schema, /create policy promotions_admin_manage on public\.promotions/);
  assert.match(schema, /public\.is_admin\(\)/);
});


test('schema includes KYC workflow storage and assurance helpers', () => {
  assert.match(schema, /create table if not exists public\.kyc_verifications/);
  assert.match(schema, /create or replace function public\.has_approved_kyc/);
  assert.match(schema, /create policy kyc_admin_review on public\.kyc_verifications/);
  assert.match(schema, /create policy kyc_owner_submit on public\.kyc_verifications/);
});
