/**
 * The GitHub adapter's conformance harness, in one place so the test file and
 * scripts/record-conformance.ts cannot drift apart.
 */
import assert from 'node:assert/strict';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import type { ConformanceCase, ConformanceHarness } from '../src/conformance.js';
import { jsonResponse, routedFetch } from './support.js';
import {
  fileContentsResponse,
  rateLimitResponse,
  repositoryResponse,
  treeResponse,
} from './fixtures.js';

export const OWNER = 'bigtacodan-boom';
export const REPO = 'unicron-don';

export const githubCases: readonly ConformanceCase[] = [
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
      const tree = output as { entries: { path: string }[]; truncated: boolean };
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

export const invalidInputCase = {
  operation: 'repository.get',
  invalidInput: { owner: 42 },
};

export type GitHubHarness = {
  connector: GitHubRepositoryConnector;
  harness: ConformanceHarness;
  calls: () => number;
};

export function buildGitHubHarness(token?: string): GitHubHarness {
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

  return {
    connector,
    calls: () => counter.calls,
    harness: {
      connector,
      cases: githubCases,
      invalidInputCase,
      providerCallCount: () => counter.calls,
    },
  };
}
