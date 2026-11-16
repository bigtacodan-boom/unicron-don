/**
 * The Phase 1 gate: every check in the reusable conformance suite must pass
 * against the GitHub adapter, replayed from recorded fixtures.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import { buildConformanceChecks, type ConformanceCase } from '../src/conformance.js';
import { jsonResponse, routedFetch } from './support.js';
import {
  fileContentsResponse,
  rateLimitResponse,
  repositoryResponse,
  treeResponse,
} from './fixtures.js';

const OWNER = 'bigtacodan-boom';
const REPO = 'unicron-don';

const cases: readonly ConformanceCase[] = [
  {
    operation: 'repository.get',
    validInput: { owner: OWNER, repo: REPO },
    assertOutput: (output) => {
      const repository = output as { fullName: string; licenseSpdxId: string; visibility: string };
      assert.equal(repository.fullName, 'bigtacodan-boom/unicron-don');
      assert.equal(repository.licenseSpdxId, 'MIT');
      assert.equal(repository.visibility, 'public');
    },
  },
  {
    operation: 'repository.tree',
    validInput: { owner: OWNER, repo: REPO, ref: 'main' },
    assertOutput: (output) => {
      const tree = output as { entries: { path: string; type: string }[]; truncated: boolean };
      assert.equal(tree.truncated, false);
      assert.equal(tree.entries.length, 3);
      assert.ok(tree.entries.some((entry) => entry.path === 'MASTER_ENGINEERING_SPEC.md'));
    },
  },
  {
    operation: 'repository.contents',
    validInput: { owner: OWNER, repo: REPO, path: 'src/index.ts', ref: 'main' },
    assertOutput: (output) => {
      const file = output as { text?: string; type: string };
      assert.equal(file.type, 'file');
      assert.equal(file.text, 'export const ok = true;\n');
    },
  },
];

function buildHarness(token?: string) {
  const counter = { calls: 0 };
  const connector = new GitHubRepositoryConnector({
    token,
    retryDelayMs: 0,
    fetchImpl: routedFetch(
      {
        [`/repos/${OWNER}/${REPO}`]: () => jsonResponse(repositoryResponse),
        [`/repos/${OWNER}/${REPO}/git/trees/main?recursive=1`]: () => jsonResponse(treeResponse),
        [`/repos/${OWNER}/${REPO}/contents/src/index.ts?ref=main`]: () =>
          jsonResponse(fileContentsResponse),
        '/rate_limit': () => jsonResponse(rateLimitResponse),
      },
      counter,
    ),
  });
  return { connector, counter };
}

const { connector, counter } = buildHarness();

for (const check of buildConformanceChecks({
  connector,
  cases,
  invalidInputCase: { operation: 'repository.get', invalidInput: { owner: 42 } },
  providerCallCount: () => counter.calls,
})) {
  test(`conformance: ${check.name}`, async () => {
    await check.run();
  });
}

test('conformance suite is non-trivial: it covers every operation and the permission gate', () => {
  const checks = buildConformanceChecks({
    connector,
    cases,
    invalidInputCase: { operation: 'repository.get', invalidInput: { owner: 42 } },
    providerCallCount: () => counter.calls,
  });
  const names = new Set(connector.descriptor.operations.map((operation) => operation.name));
  const covered = new Set(cases.map((testCase) => testCase.operation));
  assert.deepEqual([...names].sort(), [...covered].sort(), 'every operation needs a conformance case');
  assert.ok(checks.length >= 7, `expected the full suite, got ${checks.length} checks`);
});
