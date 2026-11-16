/**
 * Reusable conformance suite for the universal connector contract (§5.2).
 *
 * One suite, every adapter: if the assertions below hold, the connector is
 * substitutable inside a workflow, and if they fail the adapter is not ready
 * to enter the registry. The suite is harness-driven so it needs no network —
 * inputs and provider call counts are supplied by the test.
 */
import assert from 'node:assert/strict';
import type { Connector, Permission } from './contract.js';
import { formatIssues, validate } from './schema.js';

const KNOWN_PERMISSIONS: readonly Permission[] = [
  'read-only-access',
  'local-file-create',
  'local-file-modify',
  'repository-modify',
  'network-access',
  'external-service-access',
  'process-execute',
  'package-install',
  'credential-access',
  'deploy',
  'financial-action',
  'destructive-operation',
];

export type ConformanceCase = {
  operation: string;
  validInput: unknown;
  /** Optional deeper assertion on the mapped output. */
  assertOutput?: (output: unknown) => void;
};

export type ConformanceHarness = {
  connector: Connector;
  cases: readonly ConformanceCase[];
  invalidInputCase: { operation: string; invalidInput: unknown };
  /** Provider call counter, used to prove rejection happens before any call. */
  providerCallCount?: () => number;
};

export type ConformanceCheck = { name: string; run: () => Promise<void> };

/** One check's outcome, recorded so a proof is inspectable rather than a boolean. */
export type ConformanceCheckResult = {
  name: string;
  passed: boolean;
  detail?: string;
};

/**
 * Evidence that a connector's contract was actually exercised (§14 Phase 1).
 * Admission requires one of these, so "the tests pass" is an artifact with a
 * timestamp and a version rather than a claim.
 */
export type ConformanceProof = {
  capabilityId: string;
  providerId: string;
  connectorVersion: string;
  contractVersion: string;
  ranAt: string;
  checks: readonly ConformanceCheckResult[];
  passed: boolean;
};

function failuresInContract(connector: Connector): string[] {
  const problems: string[] = [];
  const d = connector.descriptor;

  if (!d.provider.id || !d.provider.name) problems.push('provider identity is incomplete');
  if (!d.capability.id || !d.capability.version || !d.capability.summary) {
    problems.push('capability identity is incomplete');
  }
  if (!d.connection.baseUrl || !d.connection.transport) {
    problems.push('connection configuration is incomplete');
  }
  if (!Array.isArray(d.connection.configKeys)) {
    problems.push('connection.configKeys must list configuration names');
  }
  if (!d.auth.scheme) problems.push('authentication scheme is missing');
  if (d.auth.required && !d.auth.envVar) {
    problems.push('required authentication must name the environment variable holding the credential');
  }
  if (d.permissions.length === 0) problems.push('no permissions declared');
  if (d.operations.length === 0) problems.push('no operations declared');
  if (!(d.timeout.defaultTimeoutMs > 0)) problems.push('timeout.defaultTimeoutMs must be positive');
  if (d.timeout.maxTimeoutMs < d.timeout.defaultTimeoutMs) {
    problems.push('timeout.maxTimeoutMs must be at least the default');
  }
  if (d.timeout.maxAttempts < 1) problems.push('timeout.maxAttempts must be at least 1');
  if (d.errors.codes.length === 0) problems.push('no error codes declared');
  if (!d.version.connector || !d.version.contract) problems.push('version information is incomplete');

  return problems;
}

/**
 * Runs every check and returns their outcomes. Unlike the checks themselves it
 * does not throw on failure: a failed run is a proof that says so, which is
 * what the registry needs in order to refuse admission with a reason.
 */
export async function runConformance(
  harness: ConformanceHarness,
  now: () => Date = () => new Date(),
): Promise<ConformanceProof> {
  const results: ConformanceCheckResult[] = [];

  for (const check of buildConformanceChecks(harness)) {
    try {
      await check.run();
      results.push({ name: check.name, passed: true });
    } catch (error) {
      results.push({
        name: check.name,
        passed: false,
        // First line only: proofs are stored, and assertion messages can be long.
        detail: error instanceof Error ? error.message.split('\n')[0] : String(error),
      });
    }
  }

  const descriptor = harness.connector.descriptor;
  return {
    capabilityId: descriptor.capability.id,
    providerId: descriptor.provider.id,
    connectorVersion: descriptor.version.connector,
    contractVersion: descriptor.version.contract,
    ranAt: now().toISOString(),
    checks: results,
    passed: results.every((result) => result.passed),
  };
}

export function buildConformanceChecks(harness: ConformanceHarness): ConformanceCheck[] {
  const { connector, cases, invalidInputCase, providerCallCount } = harness;
  const descriptor = connector.descriptor;
  const inputs = new Map(cases.map((testCase) => [testCase.operation, testCase.validInput]));

  const calls = (): number | undefined => providerCallCount?.();

  return [
    {
      name: 'descriptor declares every field of the connector contract (§5.2)',
      run: async () => {
        const problems = failuresInContract(connector);
        assert.deepEqual(problems, [], `contract gaps: ${problems.join('; ')}`);
        const d = connector.descriptor;
        for (const permission of d.permissions) {
          assert.ok(
            KNOWN_PERMISSIONS.includes(permission),
            `permission "${permission}" is not a declared category (§10.7)`,
          );
        }
      },
    },
    {
      name: 'operations are unique, complete, and require only declared permissions',
      run: async () => {
        const names = descriptor.operations.map((operation) => operation.name);
        assert.equal(new Set(names).size, names.length, 'operation names must be unique');
        for (const operation of descriptor.operations) {
          assert.ok(operation.name.length > 0, 'operation name is empty');
          assert.ok(operation.summary.length > 0, `${operation.name} has no summary`);
          assert.equal(operation.input.type, 'object', `${operation.name} input must be an object schema`);
          assert.ok(operation.output.type, `${operation.name} has no output schema`);
          assert.ok(operation.timeoutMs > 0, `${operation.name} timeout must be positive`);
          assert.equal(typeof operation.idempotent, 'boolean', `${operation.name} idempotent flag`);
          const undeclared = operation.requiredPermissions.filter(
            (permission) => !descriptor.permissions.includes(permission),
          );
          assert.deepEqual(
            undeclared,
            [],
            `${operation.name} requires permissions it did not declare: ${undeclared.join(', ')}`,
          );
        }
      },
    },
    {
      name: 'healthCheck reports a well-formed status',
      run: async () => {
        const health = await connector.healthCheck();
        assert.ok(
          ['ok', 'degraded', 'unavailable'].includes(health.status),
          `unexpected health status: ${health.status}`,
        );
        assert.ok(!Number.isNaN(Date.parse(health.checkedAt)), 'checkedAt must be an ISO timestamp');
        assert.ok(health.durationMs >= 0, 'durationMs must not be negative');
      },
    },
    ...cases.map((testCase) => ({
      name: `operation ${testCase.operation} succeeds with contract-conforming output`,
      run: async () => {
        const result = await connector.invoke(testCase.operation, testCase.validInput);
        assert.equal(
          result.status,
          'succeeded',
          `${testCase.operation} failed: ${'error' in result ? result.error.code : 'no error'}`,
        );
        if (result.status !== 'succeeded') return;

        const operation = descriptor.operations.find((candidate) => candidate.name === testCase.operation);
        assert.ok(operation, `case names an undeclared operation: ${testCase.operation}`);
        const issues = validate(result.output, operation.output);
        assert.deepEqual(issues, [], `output violates its schema: ${formatIssues(issues)}`);

        testCase.assertOutput?.(result.output);

        const telemetry = result.telemetry;
        assert.equal(telemetry.providerId, descriptor.provider.id, 'telemetry.providerId');
        assert.equal(telemetry.capabilityId, descriptor.capability.id, 'telemetry.capabilityId');
        assert.equal(telemetry.operation, testCase.operation, 'telemetry.operation');
        assert.ok(telemetry.attempts >= 1, 'telemetry.attempts must record a real attempt');
        assert.ok(telemetry.durationMs >= 0, 'telemetry.durationMs must not be negative');
        assert.ok(!Number.isNaN(Date.parse(telemetry.startedAt)), 'telemetry.startedAt');
        assert.ok(telemetry.trustTier, 'telemetry.trustTier must be recorded');
      },
    })),
    {
      name: 'invalid input is rejected with a declared code before the provider is called',
      run: async () => {
        const before = calls();
        const result = await connector.invoke(
          invalidInputCase.operation,
          invalidInputCase.invalidInput,
          { grantedPermissions: descriptor.permissions },
        );
        assert.notEqual(result.status, 'succeeded', 'invalid input must not succeed');
        if (result.status === 'succeeded') return;
        assert.equal(result.status, 'not_attempted', 'invalid input must not reach the provider');
        assert.equal(result.error.code, 'invalid_input');
        assert.ok(
          descriptor.errors.codes.includes(result.error.code),
          `error code "${result.error.code}" was not declared in errors.codes`,
        );
        assert.equal(result.telemetry.attempts, 0, 'no attempt should be recorded');
        if (before !== undefined) {
          assert.equal(calls(), before, 'the provider must not be called for invalid input');
        }
      },
    },
    {
      name: 'operations are blocked when their permissions are not granted (§10.7)',
      run: async () => {
        const gated = descriptor.operations.filter((operation) => operation.requiredPermissions.length > 0);
        assert.ok(gated.length > 0, 'at least one operation must declare a permission for this check to mean anything');

        for (const operation of gated) {
          const input = inputs.get(operation.name);
          assert.ok(input !== undefined, `no conformance case supplies input for ${operation.name}`);
          const before = calls();
          const result = await connector.invoke(operation.name, input, { grantedPermissions: [] });
          assert.equal(result.status, 'blocked', `${operation.name} must be blocked without permission`);
          if (result.status !== 'blocked') continue;
          assert.equal(result.error.code, 'permission_denied');
          assert.equal(result.telemetry.attempts, 0, 'a blocked call must not reach the provider');
          if (before !== undefined) {
            assert.equal(calls(), before, `${operation.name} called the provider without permission`);
          }
        }
      },
    },
  ];
}
