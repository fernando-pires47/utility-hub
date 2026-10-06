import assert from 'node:assert/strict';
import test from 'node:test';
import { editorDiffLines, textDiffLines } from '../src/utils/textDiff.ts';

test('marks changed lines on both sides without changing editor text', () => {
  const left = 'first\nold\nlast\n';
  const right = 'first\nnew\nlast\n';
  const result = editorDiffLines(left, right);
  assert.deepEqual(result.left.map((line) => line.type), ['same', 'del', 'same', 'same']);
  assert.deepEqual(result.right.map((line) => line.type), ['same', 'add', 'same', 'same']);
  assert.equal(result.left.map((line) => line.text).join('\n'), left);
  assert.equal(result.right.map((line) => line.text).join('\n'), right);
});

test('handles inserted and removed lines without marking unchanged lines', () => {
  const result = editorDiffLines('a\nb\nc', 'a\ninserted\nb');
  assert.deepEqual(result.left.map((line) => line.type), ['same', 'same', 'del']);
  assert.deepEqual(result.right.map((line) => line.type), ['same', 'add', 'same']);
});

test('preserves blank lines, Unicode, tabs and duplicate lines', () => {
  for (const [left, right] of [
    ['', ''], ['ação\n\t\n\n', 'AÇÃO\n\t\n'], ['a\na\nb', 'a\nb\nb'],
  ]) {
    const result = editorDiffLines(left, right);
    assert.equal(result.left.map((line) => line.text).join('\n'), left);
    assert.equal(result.right.map((line) => line.text).join('\n'), right);
  }
});

test('identical large inputs are not incorrectly marked as changed', () => {
  const input = Array.from({ length: 1100 }, (_, i) => `Line ${i}`).join('\n');
  assert.equal(textDiffLines(input, input).every((line) => line.type === 'same'), true);
});

test('large different inputs use the bounded-memory fallback', () => {
  const result = editorDiffLines('a\n'.repeat(1100), 'b\n'.repeat(1100));
  assert.equal(result.left.length, 1101);
  assert.equal(result.right.length, 1101);
});
