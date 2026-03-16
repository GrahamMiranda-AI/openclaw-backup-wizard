import test from 'node:test';
import assert from 'node:assert';
import { renderPage } from '../src/views.js';
import { isAuthed } from '../src/routes.js';

test('renderPage returns expected HTML structure', () => {
  const html = renderPage({ title: 'Test Title', body: '<p>Test Body</p>' });
  assert.ok(html.includes('<title>Test Title</title>'), 'Contains title');
  assert.ok(html.includes('<p>Test Body</p>'), 'Contains body');
});

test('renderPage includes status if provided', () => {
  const html = renderPage({ title: 'T', body: 'B', status: 'Success!' });
  assert.ok(html.includes('<div class="status">Success!</div>'), 'Contains status div');
});

test('isAuthed calls next if authed', (t) => {
  let nextCalled = false;
  const req = { session: { authed: true } };
  const res = { redirect: () => {} };
  const next = () => { nextCalled = true; };

  isAuthed(req, res, next);
  assert.strictEqual(nextCalled, true, 'next() should be called');
});

test('isAuthed redirects if not authed', (t) => {
  let redirectUrl = null;
  const req = { session: {} };
  const res = { redirect: (url) => { redirectUrl = url; } };
  const next = () => {};

  isAuthed(req, res, next);
  assert.strictEqual(redirectUrl, '/login', 'Should redirect to /login');
});
