import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeBase64Image } from '../src/utils/image.ts';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';

test('decodes raw Base64 into the original image bytes', async () => {
  const result = decodeBase64Image(png);
  assert.equal(result.blob.type, 'image/png');
  assert.equal(result.extension, 'png');
  assert.deepEqual(Buffer.from(await result.blob.arrayBuffer()), Buffer.from(png, 'base64'));
  assert.equal(result.base64, png);
  assert.equal(result.dataUrl, `data:image/png;base64,${png}`);
});

test('accepts data URLs, whitespace and unpadded Base64', () => {
  for (const input of [`data:image/png;base64,${png}`, ` \n${png.slice(0, 20)}\n${png.slice(20)} `, png.replace(/=+$/, '')]) {
    assert.equal(decodeBase64Image(input).base64, png);
  }
});

test('uses the image bytes rather than an incorrect declared MIME type', () => {
  assert.equal(decodeBase64Image(`data:image/jpeg;base64,${png}`).blob.type, 'image/png');
});

test('supports SVG with accented text', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>ação</text></svg>';
  const result = decodeBase64Image(Buffer.from(svg).toString('base64'));
  assert.equal(result.extension, 'svg');
  assert.equal(await result.blob.text(), svg);
});

test('rejects empty, malformed, non-image and unsupported data URLs', () => {
  for (const input of ['', ' \n ', '%%%invalid', 'a', 'a===', 'a=b=', 'aGVsbG8=', `data:text/html;base64,${png}`, 'data:image/png,hello']) {
    assert.throws(() => decodeBase64Image(input), Error, input);
  }
});

test('recognizes common binary image signatures', () => {
  for (const [bytes, mime] of [
    [[255, 216, 255, 224], 'image/jpeg'],
    [Buffer.from('GIF89a'), 'image/gif'],
    [Buffer.from('RIFF0000WEBP'), 'image/webp'],
    [Buffer.from('BM'), 'image/bmp'],
    [[0, 0, 1, 0], 'image/x-icon'],
    [Buffer.from('\0\0\0\x20ftypavif'), 'image/avif'],
  ]) {
    assert.equal(decodeBase64Image(Buffer.from(bytes).toString('base64')).blob.type, mime);
  }
});
