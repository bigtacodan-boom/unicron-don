#!/usr/bin/env node
/**
 * Live smoke check for the GitHub adapter (§14 Phase 1 gate, §13.4 evidence).
 *
 * Runs the three adapter operations against the real GitHub REST API, compares
 * the resulting output shapes against the shapes derived from the recorded
 * fixtures, and writes the outcome into the registry entry's evidence.
 *
 * It is a script, not a test, on purpose: `npm test` stays offline, hermetic
 * and deterministic (§11.2), while this run proves the fixtures still match
 * reality and is recorded with a timestamp.
 *
 * Usage:
 *   GITHUB_TOKEN=... npm run smoke:live
 *   SMOKE_REPO=owner/name GITHUB_TOKEN=... npm run smoke:live
 *
 * Without GITHUB_TOKEN the run still works unauthenticated against the public
 * rate limit, and records `authenticated: false`.
 *
 * Exit codes: 0 shapes match, 1 drift or call failure, 2 bad configuration.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import { jsonResponse, routedFetch } from '../test/support.js';
import {
  fileContentsResponse,
  rateLimitResponse,
  repositoryResponse,
  treeResponse,
} from '../test/fixtures.js';
import type { LiveSmokeResult } from '../src/registry.js';

const REGISTRY_ENTRY = fileURLToPath(
  new URL('../registry/entries/github-repository.json', import.meta.url),
);

/** Field-by-field shape, values discarded: types and key sets only. */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) return value.length === 0 ? ['<empty>'] : [shapeOf(value[0])];
  if (value === null) return 'null';
  if (typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const shape: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) shape[key] = shapeOf(source[key]);
    return shape;
  }
  return typeof value;
}

function diffShapes(expected: unknown, actual: unknown, path: string, out: string[]): void {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length === 0 || actual.length === 0) return;
    diffShapes(expected[0], actual[0], `${path}[0]`, out);
    return;
  }

  const expectedObject =
    typeof expected === 'object' && expected !== null && !Array.isArray(expected);
  const actualObject = typeof actual === 'object' && actual !== null && !Array.isArray(actual);

  if (expectedObject && actualObject) {
    const left = expected as Record<string, unknown>;
    const right = actual as Record<string, unknown>;
    for (const key of Object.keys(left)) {
      if (!(key in right)) out.push(`${path}.${key}: in fixture, absent live`);
      else diffShapes(left[key], right[key], `${path}.${key}`, out);
    }
    for (const key of Object.keys(right)) {
      if (!(key in left)) out.push(`${path}.${key}: live only, not in fixture`);
    }
    return;
  }

  if (typeof expected === 'string' && typeof actual === 'string' && expected !== actual) {
    out.push(`${path}: fixture ${expected}, live ${actual}`);
  }
}

function fixtureConnector(owner: string, repo: string): GitHubRepositoryConnector {
  return new GitHubRepositoryConnector({
    retryDelayMs: 0,
    fetchImpl: routedFetch(
      {
        [`/repos/${owner}/${repo}`]: () => jsonResponse(repositoryResponse),
        [`/repos/${owner}/${repo}/git/trees/main?recursive=1`]: () => jsonResponse(treeResponse),
        [`/repos/${owner}/${repo}/contents/src/index.ts?ref=main`]: () =>
          jsonResponse(fileContentsResponse),
        '/rate_limit': () => jsonResponse(rateLimitResponse),
      },
      { calls: 0 },
    ),
  });
}

function record(result: LiveSmokeResult): void {
  const entry = JSON.parse(readFileSync(REGISTRY_ENTRY, 'utf8')) as {
    evidence: Record<string, unknown>;
  };
  entry.evidence.liveSmoke = result;

  if (result.result === 'match') {
    // Confirmed at source: this is the one path that promotes the evidence.
    entry.evidence.sourceVerified = true;
    entry.evidence.note = `Response shapes confirmed against the live GitHub REST API (${result.ranAt}) for ${result.target}; they matched the recorded fixtures.`;
  } else if (result.result === 'drift') {
    // The provider changed: the shapes are no longer confirmed.
    entry.evidence.sourceVerified = false;
    entry.evidence.note = `Live smoke run on ${result.ranAt} found shape drift against the recorded fixtures; fixtures need regeneration before the shapes are treated as verified.`;
  }
  // 'failed' leaves provenance untouched: an outage or a rate limit is
  // evidence of neither a match nor a drift, so it must not demote a previous
  // verification. The attempt itself is recorded in liveSmoke.

  writeFileSync(REGISTRY_ENTRY, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
}

async function main(): Promise<number> {
  const target = process.env.SMOKE_REPO || 'bigtacodan-boom/unicron-don';
  const [owner, repo] = target.split('/');
  if (!owner || !repo) {
    console.error(`SMOKE_REPO must look like owner/name, received "${target}"`);
    return 2;
  }

  const token = process.env.GITHUB_TOKEN;
  const ranAt = new Date().toISOString();
  const live = new GitHubRepositoryConnector({ token, retryDelayMs: 250 });
  const fixtures = fixtureConnector(owner, repo);
  const trustTier = 'tier-1-verified' as const;

  console.log(`live smoke: github ${target}`);
  console.log(`auth: ${token ? 'token present' : 'unauthenticated (public rate limit)'}`);

  const operations: string[] = [];
  const drift: string[] = [];

  const meta = await live.invoke('repository.get', { owner, repo }, { trustTier });
  if (meta.status !== 'succeeded') {
    console.error(`repository.get failed: ${meta.error.code} — ${meta.error.message}`);
    record({
      ranAt,
      target,
      authenticated: Boolean(token),
      result: 'failed',
      operations,
      drift,
      note: `repository.get failed with ${meta.error.code}`,
    });
    return 1;
  }
  operations.push('repository.get');
  console.log(`repository.get: succeeded (HTTP ${meta.telemetry.httpStatus ?? '?'})`);

  const metadata = meta.output as { defaultBranch: string; sizeKb: number };
  const ref = process.env.SMOKE_REF || metadata.defaultBranch;

  const tree = await live.invoke('repository.tree', { owner, repo, ref }, { trustTier });
  if (tree.status !== 'succeeded') {
    console.error(`repository.tree failed: ${tree.error.code} — ${tree.error.message}`);
    record({
      ranAt,
      target,
      authenticated: Boolean(token),
      result: 'failed',
      operations,
      drift,
      note: `repository.tree failed with ${tree.error.code}`,
    });
    return 1;
  }
  operations.push('repository.tree');
  console.log(`repository.tree: succeeded (${(tree.output as { entries: unknown[] }).entries.length} entries)`);

  const contents = await live.invoke(
    'repository.contents',
    { owner, repo, path: 'MASTER_ENGINEERING_SPEC.md', ref },
    { trustTier },
  );
  if (contents.status !== 'succeeded') {
    console.error(`repository.contents failed: ${contents.error.code} — ${contents.error.message}`);
    record({
      ranAt,
      target,
      authenticated: Boolean(token),
      result: 'failed',
      operations,
      drift,
      note: `repository.contents failed with ${contents.error.code}`,
    });
    return 1;
  }
  operations.push('repository.contents');
  const decoded = (contents.output as { text?: string }).text;
  console.log(`repository.contents: succeeded (${decoded ? `${decoded.length} chars decoded` : 'no decoded text'})`);

  // Compare live shapes with fixture-derived shapes for the same operations.
  const fixtureCalls: { operation: string; input: Record<string, unknown> }[] = [
    { operation: 'repository.get', input: { owner, repo } },
    { operation: 'repository.tree', input: { owner, repo, ref: 'main' } },
    { operation: 'repository.contents', input: { owner, repo, path: 'src/index.ts', ref: 'main' } },
  ];
  const liveOutputs = new Map<string, unknown>([
    ['repository.get', meta.output],
    ['repository.tree', tree.output],
    ['repository.contents', contents.output],
  ]);

  for (const call of fixtureCalls) {
    const expected = await fixtures.invoke(call.operation, call.input, { trustTier });
    if (expected.status !== 'succeeded') {
      drift.push(`${call.operation}: fixture replay failed (${expected.error.code})`);
      continue;
    }
    const actual = liveOutputs.get(call.operation);
    diffShapes(shapeOf(expected.output), shapeOf(actual), call.operation, drift);
  }

  const health = await live.healthCheck();
  console.log(`health: ${health.status}${health.detail ? ` (${health.detail})` : ''}`);

  if (drift.length > 0) {
    console.error(`shape drift: ${drift.length} difference(s)`);
    for (const line of drift.slice(0, 20)) console.error(`  - ${line}`);
  } else {
    console.log('shape drift: none — fixtures match the live API');
  }

  const result: 'match' | 'drift' = drift.length === 0 ? 'match' : 'drift';
  record({
    ranAt,
    target,
    authenticated: Boolean(token),
    result,
    operations,
    drift: drift.slice(0, 20),
  });

  console.log(
    `registry evidence updated: ${result === 'match' ? 'sourceVerified=true' : 'sourceVerified=false (drift)'}`,
  );

  return result === 'match' ? 0 : 1;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  },
);
