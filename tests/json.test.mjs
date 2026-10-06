import assert from 'node:assert/strict';
import test from 'node:test';
import { restructureJSON, validateJSON } from '../src/utils/json.ts';

test('restructures unquoted keys and single-quoted strings as strict JSON', () => {
  assert.deepEqual(restructureJSON("{ teste: '123' }"), {
    success: true,
    formatted: '{\n  "teste": "123"\n}',
  });
});

test('handles nested objects, arrays, comments, and trailing commas', () => {
  const result = restructureJSON(`{
    // Tool output
    nested: { enabled: true, items: ['one', 2, null,], },
  }`);
  assert.equal(result.success, true);
  assert.deepEqual(JSON.parse(result.formatted), {
    nested: { enabled: true, items: ['one', 2, null] },
  });
});

test('preserves quotes, apostrophes, backslashes, and Unicode in strings', () => {
  const result = restructureJSON(String.raw`{
    message: 'It\'s "quoted"', path: 'C:\\temp', text: 'ação',
  }`);
  assert.equal(result.success, true);
  assert.deepEqual(JSON.parse(result.formatted), {
    message: 'It\'s "quoted"', path: 'C:\\temp', text: 'ação',
  });
});

test('formats existing strict JSON including primitive values', () => {
  for (const input of ['{"ok":true}', '[1,"two"]', 'null', 'false', '0', '"text"']) {
    const result = restructureJSON(input);
    assert.equal(result.success, true);
    assert.deepEqual(JSON.parse(result.formatted), JSON.parse(input));
  }
});

test('rejects invalid data and JavaScript expressions without evaluating them', () => {
  for (const input of [
    '{ broken:', '<root/>', '{ value: undefined }',
    '{ value: (() => 123)() }', '{ value: new Date() }',
  ]) {
    const result = restructureJSON(input);
    assert.equal(result.success, false, input);
    assert.equal(typeof result.error, 'string');
    assert.equal(result.formatted, undefined);
  }
});

test('rejects non-finite numbers rather than silently converting them to null', () => {
  for (const input of ['NaN', 'Infinity', '{ value: -Infinity }', '[1e999]']) {
    assert.equal(restructureJSON(input).success, false, input);
  }
});

test('validation accepts only strict JSON, not JSON5', () => {
  for (const input of ['{"teste":"123"}', '[]', 'null', 'false', '42', '"text"']) {
    assert.deepEqual(validateJSON(input), { valid: true });
  }
  for (const input of ["{ teste: '123' }", "{'teste':'123'}", '{"teste":1,}', '// comment\n{}']) {
    const result = validateJSON(input);
    assert.equal(result.valid, false, input);
    assert.equal(typeof result.error, 'string');
  }
});

test('both tools report empty input', () => {
  for (const input of ['', '  \n\t']) {
    assert.equal(restructureJSON(input).success, false);
    assert.equal(validateJSON(input).valid, false);
  }
});

test('preserves a __proto__ key as data without changing object prototypes', () => {
  const result = restructureJSON('{ __proto__: { polluted: true } }');
  assert.equal(result.success, true);
  assert.equal(JSON.parse(result.formatted).__proto__.polluted, true);
  assert.equal({}.polluted, undefined);
});
