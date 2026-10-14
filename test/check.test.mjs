import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseImage } from '../src/image.mjs';
import { checkScreenshots } from '../src/check.mjs';
import { makePng, makeJpeg } from './helpers.mjs';

const item = (name, buf) => ({ name, buf });
const set = (n, w, h) => Array.from({ length: n }, (_, i) => item(`s${i}.png`, makePng(w, h)));

test('reads PNG dimensions and alpha', () => {
  assert.deepEqual(parseImage(makePng(1080, 1920, 2)), { type: 'png', width: 1080, height: 1920, hasAlpha: false });
  assert.equal(parseImage(makePng(1080, 1920, 6)).hasAlpha, true);
});

test('reads JPEG dimensions', () => {
  assert.deepEqual(parseImage(makeJpeg(1290, 2796)), { type: 'jpeg', width: 1290, height: 2796, hasAlpha: false });
});

test('rejects a non-image', () => {
  assert.throws(() => parseImage(Buffer.from('hello')));
});

test('android: a normal screenshot set passes', () => {
  const report = checkScreenshots(set(3, 1080, 1920));
  assert.equal(report.ok, true);
  assert.equal(report.failed.length, 0);
});

test('android: too-small screenshots fail', () => {
  const report = checkScreenshots(set(2, 200, 400));
  assert.equal(report.ok, false);
  assert.ok(report.failed.some((c) => c.id.endsWith(':min')));
});

test('android: an over-long aspect ratio fails', () => {
  const report = checkScreenshots(set(2, 1000, 3000));
  assert.equal(report.ok, false);
  assert.ok(report.failed.some((c) => c.id.endsWith(':ratio')));
});

test('android: too-large screenshots fail', () => {
  const report = checkScreenshots(set(2, 1080, 5000));
  assert.equal(report.ok, false);
  assert.ok(report.failed.some((c) => c.id.endsWith(':max')));
});

test('android: warns when the count is out of range', () => {
  const report = checkScreenshots(set(1, 1080, 1920));
  assert.equal(report.ok, true);
  assert.ok(report.warned.some((c) => c.id === 'count'));
});

test('ios: a native 6.9" size is clean', () => {
  const report = checkScreenshots(set(3, 1290, 2796), { platform: 'ios' });
  assert.equal(report.ok, true);
  assert.equal(report.warned.length, 0);
});

test('ios: a non-native size warns (not fails)', () => {
  const report = checkScreenshots(set(3, 1080, 1920), { platform: 'ios' });
  assert.equal(report.ok, true);
  assert.ok(report.warned.some((c) => c.id.endsWith(':size')));
});

test('ios: PNG alpha warns', () => {
  const report = checkScreenshots([item('a.png', makePng(1290, 2796, 6))], { platform: 'ios' });
  assert.ok(report.warned.some((c) => c.id.endsWith(':alpha')));
});

test('empty input fails cleanly', () => {
  const report = checkScreenshots([]);
  assert.equal(report.ok, false);
  assert.match(report.failed[0].detail, /no screenshots/);
});

test('JPEG screenshots are accepted', () => {
  const report = checkScreenshots([item('a.jpg', makeJpeg(1242, 2208)), item('b.jpg', makeJpeg(1242, 2208))]);
  assert.equal(report.ok, true);
});
