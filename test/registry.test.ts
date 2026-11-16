/**
 * Registry gates (§14 Phase 1): an entry is admitted only with a contract
 * test, provenance and a scan verdict, and several providers may offer the
 * same capability for substitution.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CapabilityRegistry, RegistryError, type RegistrationEntry } from '../src/registry.js';
import type { Connector, ConnectorDescriptor, ConnectorResult, Permission } from '../src/contract.js';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import { jsonResponse, routedFetch } from './support.js';
import { fileContentsResponse, rateLimitResponse, repositoryResponse, treeResponse } from './fixtures.js';

const OWNER = 'bigtacodan-boom';
const REPO = 'unicron-don';

const entryPath = fileURLToPath(new URL('../registry/entries/github-repository.json', import.meta.url));

function githubConnector(): Connector {
  return new GitHubRepositoryConnector({
    retryDelayMs: 0,
    fetchImpl: routedFetch(
      {
        [`/repos/${OWNER}/${REPO}`]: () => jsonResponse(repositoryResponse),
        [`/repos/${OWNER}/${REPO}/git/trees/main?recursive=1`]: () => jsonResponse(treeResponse),
        [`/repos/${OWNER}/${REPO}/contents/src/index.ts?ref=main`]: () =>
          jsonResponse(fileContentsResponse),
        '/rate_limit': () => jsonResponse(rateLimitResponse),
      },
      { calls: 0 },
    ),
  });
}

function committedEntry(): RegistrationEntry {
  return JSON.parse(readFileSync(entryPath, 'utf8')) as RegistrationEntry;
}

/** Minimal second provider, used to prove capability substitution. */
function stubConnector(providerId: string, permissions: readonly Permission[] = ['read-only-access']): Connector {
  const descriptor: ConnectorDescriptor = {
    provider: { id: providerId, name: `Stub ${providerId}` },
    capability: {
      id: 'repository-discovery',
      version: '0.1.0',
      summary: 'Stub provider for registry substitution tests.',
    },
    connection: { baseUrl: 'in-process', transport: 'in-process', configKeys: [] },
    auth: { scheme: 'none', required: false },
    permissions,
    operations: [
      {
        name: 'repository.get',
        summary: 'Stub read.',
        input: { type: 'object', required: ['owner'], properties: { owner: { type: 'string' } } },
        output: { type: 'object' },
        requiredPermissions: [...permissions],
        timeoutMs: 1_000,
        idempotent: true,
      },
    ],
    timeout: { defaultTimeoutMs: 1_000, maxTimeoutMs: 1_000, onTimeout: 'fail', maxAttempts: 1 },
    errors: { codes: ['invalid_input'], detailPolicy: 'redacted' },
    version: { connector: '0.1.0', contract: '1.0.0' },
  };

  return {
    descriptor,
    async healthCheck() {
      return { status: 'ok', checkedAt: new Date(0).toISOString(), durationMs: 0 };
    },
    async invoke<T = unknown>(): Promise<ConnectorResult<T>> {
      return {
        status: 'not_attempted',
        error: { code: 'invalid_input', message: 'stub', retryable: false },
        telemetry: {
          providerId,
          capabilityId: 'repository-discovery',
          operation: 'repository.get',
          startedAt: new Date(0).toISOString(),
          durationMs: 0,
          attempts: 0,
          trustTier: 'tier-0-authored',
        },
      };
    },
  };
}

function stubEntry(providerId: string): RegistrationEntry {
  return {
    capabilityId: 'repository-discovery',
    providerId,
    connectorVersion: '0.1.0',
    contractTest: 'test/registry.test.ts',
    evidence: {
      sourceUrl: 'https://example.test/stub',
      retrievedAt: '2026-11-16T00:00:00.000Z',
      revision: 'authored',
      sourceVerified: true,
    },
    scan: {
      verdict: 'pass',
      ruleSetVersion: 'authored-code/1',
      trustTier: 'tier-0-authored',
      evidenceRefs: ['test/registry.test.ts'],
    },
  };
}

test('admits the committed GitHub entry with its evidence and scan verdict', () => {
  const registry = new CapabilityRegistry();
  const record = registry.register(committedEntry(), githubConnector(), () => new Date('2026-11-16T00:00:00Z'));

  assert.equal(record.capabilityId, 'repository-discovery');
  assert.equal(record.providerId, 'github');
  assert.deepEqual(record.operations, ['repository.get', 'repository.tree', 'repository.contents']);
  assert.equal(record.contractTest, 'test/github-conformance.test.ts');
  // §13.4: sourceVerified may only be true when a live smoke run matched.
  const liveMatch = record.evidence.liveSmoke?.result === 'match';
  assert.equal(
    record.evidence.sourceVerified,
    liveMatch,
    liveMatch
      ? 'a matching live smoke run should promote the evidence'
      : 'documentation-derived shapes stay flagged unverified',
  );
  assert.equal(record.evidence.revision, '2022-11-28');
  assert.equal(record.scan.verdict, 'pass');
  assert.equal(record.registeredAt, '2026-11-16T00:00:00.000Z');

  assert.equal(registry.has('repository-discovery'), true);
  assert.equal(registry.list().length, 1);
  assert.ok(registry.operation('repository-discovery', 'repository.tree'));
});

test('refuses an entry with no contract test', () => {
  const registry = new CapabilityRegistry();
  const entry = { ...committedEntry(), contractTest: '   ' };
  assert.throws(
    () => registry.register(entry, githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('contractTest is required')),
  );
});

test('refuses an entry with a reject scan verdict', () => {
  const registry = new CapabilityRegistry();
  const entry = committedEntry();
  const rejected: RegistrationEntry = { ...entry, scan: { ...entry.scan, verdict: 'reject' } };
  assert.throws(
    () => registry.register(rejected, githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError && error.issues.some((issue) => issue.includes('reject')),
  );
});

test('refuses tier-3 content unless registered as pass-with-constraints', () => {
  const registry = new CapabilityRegistry();
  const entry = committedEntry();
  const untrusted: RegistrationEntry = {
    ...entry,
    scan: { ...entry.scan, trustTier: 'tier-3-untrusted' },
  };
  assert.throws(
    () => registry.register(untrusted, githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('tier-3 untrusted content')),
  );
});

test('refuses an entry whose declared provider or capability does not match the adapter', () => {
  const registry = new CapabilityRegistry();
  const entry = { ...committedEntry(), providerId: 'not-github' };
  assert.throws(
    () => registry.register(entry, githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('providerId')),
  );
});

test('refuses provenance with no explicit sourceVerified flag', () => {
  const registry = new CapabilityRegistry();
  const entry = committedEntry();
  const evidence = { ...entry.evidence } as Record<string, unknown>;
  delete evidence.sourceVerified;
  assert.throws(
    () => registry.register({ ...entry, evidence: evidence as RegistrationEntry['evidence'] }, githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('sourceVerified')),
  );
});

test('refuses a duplicate registration of the same provider version', () => {
  const registry = new CapabilityRegistry();
  registry.register(committedEntry(), githubConnector());
  assert.throws(
    () => registry.register(committedEntry(), githubConnector()),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('already registered')),
  );
});

test('holds several implementations of one capability for substitution', () => {
  const registry = new CapabilityRegistry();
  registry.register(committedEntry(), githubConnector());
  registry.register(stubEntry('local-mirror'), stubConnector('local-mirror', ['read-only-access']));

  const implementations = registry.implementations('repository-discovery');
  assert.equal(implementations.length, 2);
  assert.deepEqual(
    implementations.map((implementation) => implementation.record.providerId).sort(),
    ['github', 'local-mirror'],
  );

  const operation = registry.operation('repository-discovery', 'repository.tree');
  assert.equal(operation?.record.providerId, 'github', 'only GitHub offers repository.tree');
});
