/**
 * Capability registry — §4.2 and §5.2.
 *
 * A capability may have several implementations (Docker/E2B/Daytona for code
 * execution, for example), so entries are keyed by capability and can be
 * substituted without redesigning a workflow.
 *
 * Registration is gated on evidence: an entry is refused unless it names a
 * contract test, records provenance for every claim, and carries a scan
 * verdict. This is the Phase 1 gate in §14 made executable — a capability is
 * not "registered" because it sounds useful, but because it is traceable and
 * tested.
 */
import type { Connector, Permission, TrustTier } from './contract.js';
import type { ConformanceProof } from './conformance.js';

/**
 * Outcome of a live smoke run against the real provider (scripts/live-smoke.ts).
 * Recorded so "the fixtures match reality" is an artifact with a timestamp,
 * not an assumption.
 */
export type LiveSmokeResult = {
  ranAt: string;
  /** Repository, endpoint or environment the run targeted. */
  target: string;
  authenticated: boolean;
  result: 'match' | 'drift' | 'failed';
  operations: readonly string[];
  drift: readonly string[];
  note?: string;
};

/** §13.4 evidence discipline: every fact carries provenance and a confidence flag. */
export type Evidence = {
  sourceUrl: string;
  /** ISO timestamp of retrieval. */
  retrievedAt: string;
  /** Commit SHA, release tag or API version examined. */
  revision: string;
  /** True only when confirmed at source, never merely read from a description. */
  sourceVerified: boolean;
  note?: string;
  liveSmoke?: LiveSmokeResult;
};

/** §10 scan output, attached to whatever the registry admits. */
export type ScanVerdict = {
  verdict: 'pass' | 'pass-with-constraints' | 'reject';
  ruleSetVersion: string;
  trustTier: TrustTier;
  evidenceRefs: readonly string[];
};

/**
 * What a caller supplies to register a connector. Provider, capability,
 * operations and permissions are cross-checked against the connector's own
 * descriptor, so the entry cannot claim more than the adapter declares.
 */
export type RegistrationEntry = {
  capabilityId: string;
  providerId: string;
  connectorVersion: string;
  operations?: readonly string[];
  permissions?: readonly Permission[];
  /** Path to the contract/conformance test that proves this adapter (§3.2). */
  contractTest: string;
  /**
   * Result of actually running that suite (src/conformance.ts). Required: a
   * path is a pointer, this is evidence, and admission does not run a
   * connector on trust.
   */
  conformance: ConformanceProof;
  evidence: Evidence;
  scan: ScanVerdict;
};

export type CapabilityRecord = {
  capabilityId: string;
  providerId: string;
  connectorVersion: string;
  operations: readonly string[];
  permissions: readonly Permission[];
  contractTest: string;
  conformance: ConformanceProof;
  evidence: Evidence;
  scan: ScanVerdict;
  registeredAt: string;
};

export type Implementation = {
  record: CapabilityRecord;
  connector: Connector;
};

export class RegistryError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`capability registration refused:\n- ${issues.join('\n- ')}`);
    this.name = 'RegistryError';
    this.issues = issues;
  }
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

export class CapabilityRegistry {
  readonly #entries = new Map<string, Implementation>();

  /**
   * Register a connector. Throws RegistryError listing every unmet
   * requirement rather than the first one, so a failed registration is
   * actionable in a single pass.
   */
  register(
    entry: RegistrationEntry,
    connector: Connector,
    now: () => Date = () => new Date(),
  ): CapabilityRecord {
    const descriptor = connector.descriptor;
    const issues: string[] = [];

    if (entry.capabilityId !== descriptor.capability.id) {
      issues.push(
        `capabilityId "${entry.capabilityId}" does not match the connector descriptor ("${descriptor.capability.id}")`,
      );
    }
    if (entry.providerId !== descriptor.provider.id) {
      issues.push(
        `providerId "${entry.providerId}" does not match the connector descriptor ("${descriptor.provider.id}")`,
      );
    }
    if (entry.connectorVersion !== descriptor.version.connector) {
      issues.push(
        `connectorVersion "${entry.connectorVersion}" does not match the connector descriptor ("${descriptor.version.connector}")`,
      );
    }

    if (!entry.contractTest || entry.contractTest.trim().length === 0) {
      issues.push('contractTest is required: a capability enters the registry with a test that proves it');
    }

    const { evidence, scan } = entry;

    if (!evidence || !evidence.sourceUrl || evidence.sourceUrl.trim().length === 0) {
      issues.push('evidence.sourceUrl is required');
    }
    if (!evidence || !evidence.retrievedAt || Number.isNaN(Date.parse(evidence.retrievedAt))) {
      issues.push('evidence.retrievedAt must be an ISO timestamp');
    }
    if (!evidence || !evidence.revision || evidence.revision.trim().length === 0) {
      issues.push('evidence.revision must name the commit, tag or API version examined');
    }
    if (!evidence || typeof evidence.sourceVerified !== 'boolean') {
      issues.push('evidence.sourceVerified must be an explicit boolean, not implied');
    }

    if (!scan) {
      issues.push('scan verdict is required: nothing is admitted without inspection (§10)');
    } else {
      if (scan.verdict === 'reject') {
        issues.push('scan verdict is reject: a rejected component cannot be registered');
      }
      if (!scan.ruleSetVersion || scan.ruleSetVersion.trim().length === 0) {
        issues.push('scan.ruleSetVersion is required so the verdict can be reproduced');
      }
      if (!scan.evidenceRefs || scan.evidenceRefs.length === 0) {
        issues.push('scan.evidenceRefs must reference the evidence the verdict rests on');
      }
      if (scan.trustTier === 'tier-3-untrusted' && scan.verdict !== 'pass-with-constraints') {
        issues.push('tier-3 untrusted content may only be registered as pass-with-constraints (§10.1)');
      }
    }

    const proof = entry.conformance;
    if (!proof) {
      issues.push(
        'conformance proof is required: run the suite (src/conformance.ts) and pass its result, a test path alone proves nothing',
      );
    } else {
      if (proof.capabilityId !== descriptor.capability.id) {
        issues.push(
          `conformance proof was produced for capability "${proof.capabilityId}", not "${descriptor.capability.id}"`,
        );
      }
      if (proof.providerId !== descriptor.provider.id) {
        issues.push(
          `conformance proof was produced for provider "${proof.providerId}", not "${descriptor.provider.id}"`,
        );
      }
      if (proof.connectorVersion !== descriptor.version.connector) {
        issues.push(
          `conformance proof is stale: produced for connector version "${proof.connectorVersion}", connector is "${descriptor.version.connector}"`,
        );
      }
      if (proof.contractVersion !== descriptor.version.contract) {
        issues.push(
          `conformance proof targets contract version "${proof.contractVersion}", connector implements "${descriptor.version.contract}"`,
        );
      }
      if (!proof.ranAt || Number.isNaN(Date.parse(proof.ranAt))) {
        issues.push('conformance proof.ranAt must be an ISO timestamp');
      }
      if (!proof.checks || proof.checks.length === 0) {
        issues.push('conformance proof records no checks');
      } else {
        const failed = proof.checks.filter((check) => !check.passed).map((check) => check.name);
        if (failed.length > 0) {
          issues.push(`conformance proof has failing checks: ${failed.join(', ')}`);
        }
        if (!proof.passed) {
          issues.push('conformance proof did not pass');
        }
      }
    }

    if (descriptor.operations.length === 0) {
      issues.push('connector declares no operations');
    }
    for (const operation of descriptor.operations) {
      const undeclared = operation.requiredPermissions.filter(
        (permission) => !descriptor.permissions.includes(permission),
      );
      if (undeclared.length > 0) {
        issues.push(
          `operation "${operation.name}" requires permissions it did not declare: ${undeclared.join(', ')}`,
        );
      }
    }

    if (entry.operations && !sameSet(entry.operations, descriptor.operations.map((op) => op.name))) {
      issues.push('entry.operations does not match the connector descriptor');
    }
    if (entry.permissions && !sameSet(entry.permissions, descriptor.permissions)) {
      issues.push('entry.permissions does not match the connector descriptor');
    }

    const key = `${descriptor.capability.id}|${descriptor.provider.id}|${descriptor.version.connector}`;
    if (this.#entries.has(key)) {
      issues.push(`already registered: ${key}`);
    }

    if (issues.length > 0) throw new RegistryError(issues);

    const record: CapabilityRecord = {
      capabilityId: descriptor.capability.id,
      providerId: descriptor.provider.id,
      connectorVersion: descriptor.version.connector,
      operations: descriptor.operations.map((operation) => operation.name),
      permissions: [...descriptor.permissions],
      contractTest: entry.contractTest,
      conformance: {
        ...entry.conformance,
        checks: entry.conformance.checks.map((check) => ({ ...check })),
      },
      evidence: { ...evidence },
      scan: { ...scan, evidenceRefs: [...scan.evidenceRefs] },
      registeredAt: now().toISOString(),
    };

    this.#entries.set(key, { record, connector });
    return record;
  }

  list(): readonly CapabilityRecord[] {
    return [...this.#entries.values()].map((implementation) => implementation.record);
  }

  has(capabilityId: string): boolean {
    return this.implementations(capabilityId).length > 0;
  }

  /** All implementations of one capability, for provider substitution. */
  implementations(capabilityId: string): readonly Implementation[] {
    return [...this.#entries.values()].filter(
      (implementation) => implementation.record.capabilityId === capabilityId,
    );
  }

  /** Resolve a specific operation, or undefined when no provider offers it. */
  operation(capabilityId: string, operationName: string): Implementation | undefined {
    return this.implementations(capabilityId).find((implementation) =>
      implementation.record.operations.includes(operationName),
    );
  }
}
