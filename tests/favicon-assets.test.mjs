import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const EXPECTED_SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 512];

function pngDimensions(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('tree favicon PNG set contains every requested square size', async () => {
  for (const size of EXPECTED_SIZES) {
    const file = await readFile(new URL(`../public/icons/tree-${size}x${size}.png`, import.meta.url));
    assert.deepEqual(pngDimensions(file), { width: size, height: size });
  }
});

test('favicon ico bundles 16, 32, and 48 pixel variants', async () => {
  const ico = await readFile(new URL('../app/favicon.ico', import.meta.url));
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 3);
});

test('web manifest references installable tree icons', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../public/site.webmanifest', import.meta.url), 'utf8')
  );
  assert.deepEqual(
    manifest.icons.map(icon => icon.sizes),
    ['192x192', '512x512']
  );
});
