const assert = require('node:assert/strict');
const test = require('node:test');

const { SHORTCUTS, getShortcutAction, isEditableTarget } = require('../src/keyboard-shortcuts');

function keyEvent(key, options = {}) {
  return {
    key,
    code: options.code || '',
    ctrlKey: options.ctrlKey ?? true,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    repeat: options.repeat ?? false,
  };
}

test('all requested control shortcuts map to their actions', () => {
  const cases = [
    [keyEvent('k'), 'search'],
    [keyEvent('n'), 'new-task'],
    [keyEvent('H', { shiftKey: true }), 'habits'],
    [keyEvent('G', { shiftKey: true }), 'goals'],
    [keyEvent(',', { code: 'Comma' }), 'settings'],
    [keyEvent('A', { shiftKey: true }), 'new-activity'],
    [keyEvent('P', { shiftKey: true }), 'command-palette'],
    [keyEvent('Escape', { ctrlKey: false }), 'escape'],
  ];

  cases.forEach(([event, expected]) => {
    assert.equal(getShortcutAction(event), expected);
  });
  assert.equal(getShortcutAction(keyEvent('Escape', { ctrlKey: false })), 'escape');
});

test('shortcut matching rejects incorrect modifiers, repeats, and unrelated keys', () => {
  assert.equal(getShortcutAction(keyEvent('k', { shiftKey: true })), null);
  assert.equal(getShortcutAction(keyEvent('n', { altKey: true })), null);
  assert.equal(getShortcutAction(keyEvent('h')), null);
  assert.equal(getShortcutAction(keyEvent('Escape', { ctrlKey: false, repeat: true })), null);
  assert.equal(SHORTCUTS.find((shortcut) => shortcut.action === 'command-palette').keys.join('+'), 'Ctrl+Shift+P');
  assert.equal(SHORTCUTS.find((shortcut) => shortcut.action === 'escape').category, 'Interface Controls');
  assert.equal(getShortcutAction(keyEvent('k', { ctrlKey: false, metaKey: false })), null);
  assert.equal(getShortcutAction(keyEvent('k', { ctrlKey: false, metaKey: true })), 'search');
});

test('editable inputs and contenteditable regions are recognized', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT', type: 'text' }), true);
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
  assert.equal(isEditableTarget({ tagName: 'TEXTAREA' }), true);
  assert.equal(isEditableTarget({ tagName: 'SELECT' }), true);
  assert.equal(isEditableTarget({ tagName: 'INPUT', type: 'radio' }), false);
  assert.equal(isEditableTarget({ tagName: 'INPUT', type: 'checkbox' }), false);
  assert.equal(isEditableTarget({ isContentEditable: true }), true);
  assert.equal(isEditableTarget({
    closest: (selector) => selector.includes('[role="textbox"]') ? {} : null,
  }), true);
  assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false);
  assert.equal(isEditableTarget(null), false);
});
