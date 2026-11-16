/**
 * The Phase 1 gate, part two: admission requires a conformance proof that was
 * produced for this connector, this capability and this contract version, and
 * that actually passed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CapabilityRegistry, RegistryError, type RegistrationEntry } from '../src/registry.js';
import {
  CONTRACT_VERSION,
  type Connector,
  type ConnectorDescriptor,
  type ConnectorResult,
  type InvocationContext,
  type Permission,
  type Telemetry,
} from '../src/contract.js';
import { runConformance, type ConformanceProof } from '../src/conformance.js';
import { validate } from '../src/schema.js';
import { buildGitHubHarness } from './github-harness.js';

const entryPath = fileURLToPath(new URL('../registry/entries/github-repository.json', import.meta.url));

function committedEntry(): RegistrationEntry {
  return JSON.parse(readFileSync(entryPath, 'utf8')) as RegistrationEntry;
}

function proofOf(entry: RegistrationEntry): ConformanceProof {
  return entry.conformance;
}

const fixedClock = () => new Date('2026-11-16T00:00:00Z');

/**
 * A second provider that genuinely implements the contract, so its proof is
 * produced by the suite rather than written by hand.
 */
function stubConnector(
  providerId: string,
  permissions: readonly Permission[] = ['read-only-access'],
): Connector {
  const capabilityId = 'repository-discovery';

  const descriptor: ConnectorDescriptor = {
    provider: { id: providerId, name: `Stub ${providerId}` },
    capability: {
      id: capabilityId,
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
        input: {
          type: 'object',
          required: ['owner'],
          properties: { owner: { type: 'string' } },
          additionalProperties: false,
        },
        output: {
          type: 'object',
          required: ['ok'],
          properties: { ok: { type: 'boolean' } },
        },
        requiredPermissions: [...permissions],
        timeoutMs: 1_000,
        idempotent: true,
      },
    ],
    timeout: { defaultTimeoutMs: 1_000, maxTimeoutMs: 1_000, onTimeout: 'fail', maxAttempts: 1 },
    errors: { codes: ['invalid_input', 'permission_denied'], detailPolicy: 'redacted' },
    version: { connector: '0.1.0', contract: CONTRACT_VERSION },
  };

  const telemetry = (operation: string, attempts: number): Telemetry => ({
    providerId,
    capabilityId,
    operation,
    startedAt: new Date(0).toISOString(),
    durationMs: 0,
    attempts,
    trustTier: 'tier-0-authored',
  });

  return {
    descriptor,
    async healthCheck() {
      return { status: 'ok', checkedAt: new Date(0).toISOString(), durationMs: 0 };
    },
    async invoke<T = unknown>(
      operation: string,
      input: unknown,
      ctx: Partial<InvocationContext> = {},
    ): Promise<ConnectorResult<T>> {
      const definition = descriptor.operations.find((candidate) => candidate.name === operation);
      if (!definition) {
        return {
          status: 'not_attempted',
          error: { code: 'invalid_input', message: `unknown operation: ${operation}`, retryable: false },
          telemetry: telemetry(operation, 0),
        };
      }
      if (validate(input, definition.input).length > 0) {
        return {
          status: 'not_attempted',
          error: { code: 'invalid_input', message: 'invalid input', retryable: false },
          telemetry: telemetry(operation, 0),
        };
      }
      const granted = new Set(ctx.grantedPermissions ?? descriptor.permissions);
      if (definition.requiredPermissions.some((permission) => !granted.has(permission))) {
        return {
          status: 'blocked',
          error: { code: 'permission_denied', message: 'blocked', retryable: false },
          telemetry: telemetry(operation, 0),
        };
      }
      return { status: 'succeeded', output: { ok: true } as T, telemetry: telemetry(operation, 1) };
    },
  };
}

async function stubProof(connector: Connector): Promise<ConformanceProof> {
  return runConformance(
    {
      connector,
      cases: [{ operation: 'repository.get', validInput: { owner: 'fixture' } }],
      invalidInputCase: { operation: 'repository.get', invalidInput: { owner: 42 } },
    },
    fixedClock,
  );
}

function stubEntry(providerId: string, conformance: ConformanceProof): RegistrationEntry {
  return {
    capabilityId: 'repository-discovery',
    providerId,
    connectorVersion: '0.1.0',
    contractTest: 'test/registry.test.ts',
    conformance,
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

test('admits the committed GitHub entry with its recorded conformance proof', () => {
  const registry = new CapabilityRegistry();
  const entry = committedEntry();
  const { connector } = buildGitHubHarness();
  const record = registry.register(entry, connector, fixedClock);

  assert.equal(record.capabilityId, 'repository-discovery');
  assert.equal(record.providerId, 'github');
  assert.deepEqual(record.operations, ['repository.get', 'repository.tree', 'repository.contents']);
  assert.equal(record.contractTest, 'test/github-conformance.test.ts');
  assert.equal(record.registeredAt, '2026-11-16T00:00:00.000Z');

  // The proof is the gate: it must exist, have passed, cover the suite, and
  // match the connector and contract version that is being admitted.
  assert.equal(record.conformance.passed, true);
  assert.ok(record.conformance.checks.length >= 8, 'proof covers the full suite');
  assert.ok(record.conformance.checks.every((check) => check.passed));
  assert.equal(record.conformance.connectorVersion, connector.descriptor.version.connector);
  assert.equal(record.conformance.contractVersion, CONTRACT_VERSION);
  assert.equal(record.conformance.capabilityId, 'repository-discovery');
  assert.equal(record.conformance.providerId, 'github');

  // §13.4: sourceVerified may only be true when a live smoke run matched.
  const liveMatch = record.evidence.liveSmoke?.result === 'match';
  assert.equal(
    record.evidence.sourceVerified,
    liveMatch,
    liveMatch
      ? 'a matching live smoke run should promote the evidence'
      : 'documentation-derived shapes stay flagged unverified',
  );
  assert.equal(record.scan.verdict, 'pass');

  assert.equal(registry.has('repository-discovery'), true);
  assert.equal(registry.list().length, 1);
  assert.ok(registry.operation('repository-discovery', 'repository.tree'));
});

test('refuses an entry with no contract test', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  assert.throws(
    () => registry.register({ ...committedEntry(), contractTest: '   ' }, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('contractTest is required')),
  );
});

test('refuses an entry with no conformance proof', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const withoutProof = { ...entry } as Partial<RegistrationEntry>;
  delete withoutProof.conformance;

  assert.throws(
    () => registry.register(withoutProof as RegistrationEntry, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('conformance proof is required')),
  );
});

test('refuses a stale conformance proof from an older connector version', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const stale: RegistrationEntry = {
    ...entry,
    conformance: { ...proofOf(entry), connectorVersion: '0.0.9' },
  };

  assert.throws(
    () => registry.register(stale, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('conformance proof is stale')),
  );
});

test('refuses a proof produced against a different contract version', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const mismatched: RegistrationEntry = {
    ...entry,
    conformance: { ...proofOf(entry), contractVersion: '0.9.0' },
  };

  assert.throws(
    () => registry.register(mismatched, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('contract version')),
  );
});

test('refuses a proof with a failing check', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const failing: RegistrationEntry = {
    ...entry,
    conformance: {
      ...proofOf(entry),
      passed: true,
      checks: [...proofOf(entry).checks, { name: 'deliberate failure', passed: false, detail: 'boom' }],
    },
  };

  assert.throws(
    () => registry.register(failing, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('failing checks: deliberate failure')),
  );
});

test('refuses a proof that did not pass', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const failed: RegistrationEntry = { ...entry, conformance: { ...proofOf(entry), passed: false } };

  assert.throws(
    () => registry.register(failed, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('conformance proof did not pass')),
  );
});

test('refuses a proof that records no checks', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const empty: RegistrationEntry = {
    ...entry,
    conformance: { ...proofOf(entry), checks: [], passed: true },
  };

  assert.throws(
    () => registry.register(empty, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('records no checks')),
  );
});

test('refuses a proof produced for a different capability or provider', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const wrongCapability: RegistrationEntry = {
    ...entry,
    conformance: { ...proofOf(entry), capabilityId: 'someone-elses-capability' },
  };
  const wrongProvider: RegistrationEntry = {
    ...entry,
    conformance: { ...proofOf(entry), providerId: 'not-github' },
  };

  for (const subject of [wrongCapability, wrongProvider]) {
    assert.throws(
      () => registry.register(subject, connector),
      (error: unknown) =>
        error instanceof RegistryError &&
        error.issues.some((issue) => issue.includes('conformance proof was produced for')),
    );
  }
});

test('refuses an entry with a reject scan verdict', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const rejected: RegistrationEntry = { ...entry, scan: { ...entry.scan, verdict: 'reject' } };

  assert.throws(
    () => registry.register(rejected, connector),
    (error: unknown) =>
      error instanceof RegistryError && error.issues.some((issue) => issue.includes('reject')),
  );
});

test('refuses tier-3 content unless registered as pass-with-constraints', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const untrusted: RegistrationEntry = {
    ...entry,
    scan: { ...entry.scan, trustTier: 'tier-3-untrusted' },
  };

  assert.throws(
    () => registry.register(untrusted, connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('tier-3 untrusted content')),
  );
});

test('refuses an entry whose declared provider does not match the adapter', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  assert.throws(
    () => registry.register({ ...committedEntry(), providerId: 'not-github' }, connector),
    (error: unknown) =>
      error instanceof RegistryError && error.issues.some((issue) => issue.includes('providerId')),
  );
});

test('refuses provenance with no explicit sourceVerified flag', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  const entry = committedEntry();
  const evidence = { ...entry.evidence } as Record<string, unknown>;
  delete evidence.sourceVerified;

  assert.throws(
    () =>
      registry.register(
        { ...entry, evidence: evidence as RegistrationEntry['evidence'] },
        connector,
      ),
    (error: unknown) =>
      error instanceof RegistryError && error.issues.some((issue) => issue.includes('sourceVerified')),
  );
});

test('refuses a duplicate registration of the same provider version', () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  registry.register(committedEntry(), connector);
  assert.throws(
    () => registry.register(committedEntry(), connector),
    (error: unknown) =>
      error instanceof RegistryError &&
      error.issues.some((issue) => issue.includes('already registered')),
  );
});

test('holds several implementations of one capability, each with its own proof', async () => {
  const registry = new CapabilityRegistry();
  const { connector } = buildGitHubHarness();
  registry.register(committedEntry(), connector);

  const mirror = stubConnector('local-mirror');
  const mirrorProof = await stubProof(mirror);
  assert.equal(mirrorProof.passed, true, 'the stub must pass the same suite to be admissible');
  registry.register(stubEntry('local-mirror', mirrorProof), mirror);

  const implementations = registry.implementations('repository-discovery');
  assert.equal(implementations.length, 2);
  assert.deepEqual(
    implementations.map((implementation) => implementation.record.providerId).sort(),
    ['github', 'local-mirror'],
  );

  const treeOperation = registry.operation('repository-discovery', 'repository.tree');
  assert.equal(treeOperation?.record.providerId, 'github', 'only GitHub offers repository.tree');
  assert.ok(
    implementations.every((implementation) => implementation.record.conformance.passed),
    'no implementation is admitted without a passing proof',
  );
});
