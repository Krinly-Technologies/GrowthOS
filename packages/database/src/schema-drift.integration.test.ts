import { readFileSync } from 'node:fs';
import pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';

// Verifies that prisma/schema.prisma matches the database produced by the SQL migrations:
// every mapped table exists, and column names and nullability agree in both directions.

interface Column {
  name: string;
  nullable: boolean;
}

const SCALAR_TYPES = new Set(['String', 'Boolean', 'Int', 'DateTime', 'Json', 'Bytes']);

function parsePrismaTables(source: string): Map<string, Column[]> {
  const tables = new Map<string, Column[]>();
  for (const match of source.matchAll(/^model \w+ \{\n([\s\S]*?)^\}/gm)) {
    const body = match[1] ?? '';
    const table = /@@map\("([^"]+)"\)/.exec(body)?.[1];
    if (!table) throw new Error(`Model without @@map: ${match[0].slice(0, 40)}`);
    const columns: Column[] = [];
    for (const line of body.split('\n')) {
      const field = /^\s+(\w+)\s+(\w+)(\??)(.*)$/.exec(line);
      if (!field) continue;
      const [, name = '', type = '', optional, rest = ''] = field;
      if (!SCALAR_TYPES.has(type)) continue;
      columns.push({
        name: /@map\("([^"]+)"\)/.exec(rest)?.[1] ?? name,
        nullable: optional === '?',
      });
    }
    tables.set(table, columns);
  }
  return tables;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_MIGRATION_URL });
afterAll(() => pool.end());

describe('Prisma schema matches migrated database', () => {
  const expected = parsePrismaTables(
    readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8'),
  );

  it('maps every public table', async () => {
    const { rows } = await pool.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    expect(rows.map((r) => r.table_name).sort()).toEqual([...expected.keys()].sort());
  });

  it.each([...expected.entries()])('columns of %s agree', async (table, columns) => {
    const { rows } = await pool.query<{ column_name: string; is_nullable: string }>(
      `select column_name, is_nullable from information_schema.columns
       where table_schema = 'public' and table_name = $1`,
      [table],
    );
    const actual = rows.map((r) => ({ name: r.column_name, nullable: r.is_nullable === 'YES' }));
    const byName = (a: Column, b: Column) => a.name.localeCompare(b.name);
    expect(actual.sort(byName)).toEqual([...columns].sort(byName));
  });
});
