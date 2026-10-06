import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSQL, sqlDialects } from '../src/utils/sql.ts';

test('formats SQL with indentation and uppercase keywords', () => {
  const result = formatSQL('select id,name from users where active = true order by name;');
  assert.equal(result.success, true);
  assert.match(result.formatted, /SELECT\n  id,\n  name/);
  assert.match(result.formatted, /FROM\n  users/);
  assert.match(result.formatted, /ORDER BY\n  name/);
});

test('supports all the offered SQL dialects', () => {
  for (const { value } of sqlDialects) {
    assert.equal(formatSQL('select id from users;', value).success, true, value);
  }
});

test('preserves quoted values, comments, and multiple statements', () => {
  const result = formatSQL("-- Keep this comment\nselect 'MiXeD Case' as label; select 2;");
  assert.equal(result.success, true);
  assert.match(result.formatted, /-- Keep this comment/);
  assert.match(result.formatted, /'MiXeD Case'/);
  assert.equal(result.formatted.match(/SELECT/g).length, 2);
});

test('handles PostgreSQL casts and SQL Server identifiers', () => {
  assert.equal(formatSQL('select data::jsonb from items;', 'postgresql').success, true);
  assert.equal(formatSQL('select [name] from [users];', 'transactsql').success, true);
});

test('returns errors for empty input and unterminated strings', () => {
  assert.equal(formatSQL(' \n ').success, false);
  const result = formatSQL("select 'unterminated");
  assert.equal(result.success, false);
  assert.equal(typeof result.error, 'string');
});
