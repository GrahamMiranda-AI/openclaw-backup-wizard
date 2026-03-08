import test from 'node:test';
import assert from 'node:assert';
import { renderPage } from '../src/views.js';
import { APP_NAME } from '../src/config.js';

test('renderPage generates valid HTML structure', () => {
  const html = renderPage({ title: 'Test Title', body: '<p>Test Body</p>' });

  assert.ok(html.includes('<!doctype html>'), 'Contains doctype');
  assert.ok(html.includes('<title>Test Title</title>'), 'Contains title');
  assert.ok(html.includes('<p>Test Body</p>'), 'Contains body');
  assert.ok(html.includes(APP_NAME), 'Contains app name in header');
  assert.ok(html.includes('Project by Graham Miranda'), 'Contains footer info');
});

test('renderPage includes status when provided', () => {
  const html = renderPage({ title: 'Test Title', body: '<p>Test Body</p>', status: 'Test Status Message' });

  assert.ok(html.includes('<div class="status">Test Status Message</div>'), 'Contains status div');
});

test('renderPage handles missing status correctly', () => {
  const html = renderPage({ title: 'Test Title', body: '<p>Test Body</p>' });

  assert.ok(!html.includes('<div class="status">'), 'Does not contain status div when status is not provided');
});
