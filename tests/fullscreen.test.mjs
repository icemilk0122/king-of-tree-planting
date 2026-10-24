import test from 'node:test';
import assert from 'node:assert/strict';
import { isEditableTarget, toggleFullscreen } from '../lib/fullscreen.js';

test('fullscreen shortcut ignores editable controls', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
  assert.equal(isEditableTarget({ tagName: 'textarea' }), true);
  assert.equal(isEditableTarget({ tagName: 'DIV', isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false);
});

test('fullscreen toggle enters and exits browser fullscreen', async () => {
  let entered = 0;
  let exited = 0;
  const documentRef = {
    fullscreenElement: null,
    documentElement: {
      async requestFullscreen() {
        entered += 1;
      },
    },
    async exitFullscreen() {
      exited += 1;
    },
  };

  assert.equal(await toggleFullscreen(documentRef), true);
  assert.equal(entered, 1);

  documentRef.fullscreenElement = documentRef.documentElement;
  assert.equal(await toggleFullscreen(documentRef), false);
  assert.equal(exited, 1);
});
