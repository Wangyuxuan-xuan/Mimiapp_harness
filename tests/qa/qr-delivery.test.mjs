import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {verifyPreview, validateVerificationPlan, validateVerificationEvidence} from '../../server/verify.mjs';
import {createQrFixture, deliverySteps, shortText, longText} from './qr-fixture.mjs';

// Real Edge + viewport pixels, with a deterministic application fixture.
// No model, Taro build, saved Studio profile, or user project is involved.
const requirements = {profile: 'text-qr'};
const cases = [
  ['normal', 'passed'],
  ['constant-empty-label', 'failed'],
  ['fresh-feedback-keep-qr', 'passed'],
  ['clear-count', 'passed'],
  ['please-first', 'passed'],
  ['hidden-feedback', 'failed'],
  ['hidden-ancestor', 'failed'],
  ['overlay', 'failed'],
];

for (const [mode, expected] of cases) {
  test(`independent QR delivery: ${mode} (${expected}, real Edge)`, {timeout: 45000}, async () => {
    assert.equal(longText.length, 120);
    assert.match(longText, /^[\u3400-\u9fff]+$/);
    const fixture = await createQrFixture(mode);
    try {
      const steps = deliverySteps(mode);
      validateVerificationPlan(steps, requirements);
      // verifyPreview owns its random-port HTTP server and browser lifecycle.
      const result = await verifyPreview(fixture.root, steps, {
        viewport: {width: 375, height: 720},
        signal: AbortSignal.timeout(40000),
      });
      assert.equal(result.kind, 'real-browser');
      assert.deepEqual(result.viewport, {width: 375, height: 720});
      assert.deepEqual(result.runtimeErrors || [], []);
      assert.equal(result.state, expected, JSON.stringify(result));
      if (mode === 'overlay') {
        assert.match(result.error, /无法解码/);
        assert.equal(result.step, 3);
      } else {
        assert.deepEqual(result.qrChecks.map(check => check.data), [shortText, longText]);
        for (const check of result.qrChecks) {
          assert.equal(check.fullyVisible, true);
          assert.match(check.imageDigest, /^[0-9a-f]{64}$/);
          assert.match(check.viewportImageDigest, /^[0-9a-f]{64}$/);
          assert.ok(check.box.x >= 0 && check.box.y >= 0);
          assert.ok(check.box.x + check.box.width <= 375);
          assert.ok(check.box.y + check.box.height <= 720);
        }
        if (expected === 'failed') {
          assert.equal(result.step, 9);
          assert.match(result.error, /空输入未引起新的可见错误反馈/);
        }
      }
      if (expected === 'passed') {
        validateVerificationEvidence(result, steps, requirements);
        assert.equal(result.emptyChecks.length, 1);
        assert.equal(result.emptyChecks[0].transition, true);
        if (mode === 'clear-count') {
          assert.equal(result.emptyChecks[0].before.count, 1);
          assert.equal(result.emptyChecks[0].after.count, 0);
        } else {
          assert.equal(result.emptyChecks[0].after.visible, true);
          assert.equal(result.emptyChecks[0].before.text, '');
        }
        assert.throws(() => validateVerificationEvidence({...result, emptyChecks: []}, steps, requirements), /空输入检查缺少/);
      }
    } finally {
      await fixture.cleanup();
      await assert.rejects(fs.stat(fixture.root), {code: 'ENOENT'});
    }
  });
}
