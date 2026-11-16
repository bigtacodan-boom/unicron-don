/**
 * The Phase 1 gate, part one: every check in the reusable suite must pass
 * against the GitHub adapter, and running the suite must produce a proof the
 * registry can accept.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import { buildConformanceChecks, runConformance } from '../src/conformance.js';
import { jsonResponse } from './support.js';
import { buildGitHubHarness, githubCases, invalidInputCase } from './github-harness.js';

const { harness, connector } = buildGitHubHarness();

for (const check of buildConformanceChecks(harness)) {
  test(`conformance: ${check.name}`, async () => {
    await check.run();
  });
}

test('conformance suite is non-trivial: it covers every operation and the permission gate', () => {
  const checks = buildConformanceChecks(harness);
  const names = new Set(connector.descriptor.operations.map((operation) => operation.name));
  const covered = new Set(githubCases.map((testCase) => testCase.operation));
  assert.deepEqual([...names].sort(), [...covered].sort(), 'every operation needs a conformance case');
  assert.ok(checks.length >= 7, `expected the full suite, got ${checks.length} checks`);
});

test('runConformance records a passing proof with a timestamp', async () => {
  const proof = await runConformance(harness, () => new Date('2026-11-16T00:00:00Z'));

  const failures = proof.checks.filter((check) => !check.passed);
  assert.equal(proof.passed, true, `failing checks: ${JSON.stringify(failures)}`);
  assert.equal(proof.capabilityId, 'repository-discovery');
  assert.equal(proof.providerId, 'github');
  assert.equal(proof.connectorVersion, connector.descriptor.version.connector);
  assert.equal(proof.contractVersion, connector.descriptor.version.contract);
  assert.equal(proof.ranAt, '2026-11-16T00:00:00.000Z');
  assert.ok(proof.checks.length >= 8, `expected the full suite, got ${proof.checks.length}`);
  assert.ok(proof.checks.every((check) => check.passed && check.name.length > 0));
});

test('a connector that returns the wrong shape gets a failing proof with detail', async () => {
  const broken = new GitHubRepositoryConnector({
    retryDelayMs: 0,
    fetchImpl: (async () => jsonResponse({ unexpected: true })) as typeof fetch,
  });

  const proof = await runConformance({ connector: broken, cases: githubCases, invalidInputCase });
  const failures = proof.checks.filter((check) => !check.passed);

  assert.equal(proof.passed, false, 'a broken connector must not earn a passing proof');
  assert.ok(failures.length > 0, 'expected at least one failing check');
  assert.ok(
    failures.every((check) => typeof check.detail === 'string' && check.detail.length > 0),
    'every failure carries a reason',
  );
});
