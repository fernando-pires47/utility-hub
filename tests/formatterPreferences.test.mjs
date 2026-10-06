import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { loadFormatterPreferences, saveFormatterPreferences } from '../src/utils/formatterPreferences.ts';

const key = 'text-formatter:layout';
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let values;

beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (name) => values.get(name) ?? null,
      setItem: (name, value) => values.set(name, value),
    },
  });
});

after(() => {
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
});

test('defaults to hidden differences and a visible right panel', () => {
  assert.deepEqual(loadFormatterPreferences(), { diffVisible: false, rightCollapsed: false });
});

test('persists and restores every combination of panel visibility', () => {
  for (const diffVisible of [false, true]) {
    for (const rightCollapsed of [false, true]) {
      const preferences = { diffVisible, rightCollapsed };
      saveFormatterPreferences(preferences);
      assert.deepEqual(JSON.parse(values.get(key)), preferences);
      assert.deepEqual(loadFormatterPreferences(), preferences);
    }
  }
});

test('ignores malformed stored data', () => {
  for (const raw of ['invalid', 'null', 'true', '42', '"string"', '[]']) {
    values.set(key, raw);
    assert.deepEqual(loadFormatterPreferences(), { diffVisible: false, rightCollapsed: false });
  }
});

test('validates each stored preference independently', () => {
  values.set(key, JSON.stringify({ diffVisible: true, rightCollapsed: 'true' }));
  assert.deepEqual(loadFormatterPreferences(), { diffVisible: true, rightCollapsed: false });
  values.set(key, JSON.stringify({ diffVisible: 1, rightCollapsed: true }));
  assert.deepEqual(loadFormatterPreferences(), { diffVisible: false, rightCollapsed: true });
});

test('works when reading or writing localStorage throws', () => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get: () => { throw new Error('Storage unavailable'); },
  });
  assert.deepEqual(loadFormatterPreferences(), { diffVisible: false, rightCollapsed: false });
  assert.doesNotThrow(() => saveFormatterPreferences({ diffVisible: true, rightCollapsed: true }));
});

test('ignores storage write failures without changing other stored data', () => {
  localStorage.setItem('text-formatter:v2', 'existing tabs');
  localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.doesNotThrow(() => saveFormatterPreferences({ diffVisible: true, rightCollapsed: true }));
  assert.equal(values.get('text-formatter:v2'), 'existing tabs');
});
