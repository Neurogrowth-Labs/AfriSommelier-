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
