/**
 * Universal connector contract — §5.2 of MASTER_ENGINEERING_SPEC.md.
 *
 * Every adapter exposes this same internal representation so the orchestration
 * layer can treat providers as interchangeable. Permission categories mirror
 * §10.7, and trust tiers mirror the classes in §10.1.
 */

/** Contract revision this module implements. Recorded in every descriptor. */
export const CONTRACT_VERSION = '1.0.0';

/** §10.1 trust tiers. Content carries its tier from fetch time onward. */
export type TrustTier =
  | 'tier-0-authored'
  | 'tier-1-verified'
  | 'tier-2-inspected'
  | 'tier-3-untrusted';

/** §10.7 permission categories. Permission is per component, never inherited. */
export type Permission =
  | 'read-only-access'
  | 'local-file-create'
  | 'local-file-modify'
  | 'repository-modify'
  | 'network-access'
  | 'external-service-access'
  | 'process-execute'
  | 'package-install'
  | 'credential-access'
  | 'deploy'
  | 'financial-action'
  | 'destructive-operation';

/**
 * Minimal JSON Schema subset. Deliberately small: enough to describe and
 * validate connector inputs and outputs (objects, arrays, scalars, enums,
 * required keys) without pulling in a full validator dependency.
 */
export type JsonSchema = {
  type: 'object' | 'string' | 'number' | 'integer' | 'boolean' | 'array';
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  enum?: readonly string[];
  items?: JsonSchema;
  additionalProperties?: boolean;
};

export type OperationDefinition = {
  /** Dotted operation name, unique inside a connector. */
  name: string;
  summary: string;
  input: JsonSchema;
  output: JsonSchema;
  /** Must be a subset of the connector's declared permissions. */
  requiredPermissions: readonly Permission[];
  timeoutMs: number;
  idempotent: boolean;
};

export type ProviderIdentity = {
  id: string;
  name: string;
  homepage?: string;
};

export type CapabilityIdentity = {
  /** The capability this connector provides; several providers may share it. */
  id: string;
  version: string;
  summary: string;
};

export type ConnectionConfig = {
  baseUrl: string;
  transport: 'https' | 'http' | 'stdio' | 'websocket' | 'in-process';
  /** Names of required configuration values. Never the values themselves. */
  configKeys: readonly string[];
};

export type AuthConfig = {
  scheme: 'none' | 'bearer' | 'api-key' | 'oauth2' | 'basic';
  /** Environment variable holding the credential; values are never stored here. */
  envVar?: string;
  required: boolean;
};

export type TimeoutBehavior = {
  defaultTimeoutMs: number;
  maxTimeoutMs: number;
  onTimeout: 'fail' | 'retry';
  maxAttempts: number;
};

export type ConnectorErrorCode =
  | 'invalid_input'
  | 'permission_denied'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'timeout'
  | 'network_error'
  | 'provider_error'
  | 'output_invalid'
  | 'unavailable';

export type ErrorRepresentation = {
  codes: readonly ConnectorErrorCode[];
  /**
   * 'redacted' means provider bodies are never echoed verbatim. Fetched
   * content is untrusted (§10.3) and a response body can carry injected text.
   */
  detailPolicy: 'redacted' | 'verbatim';
};

/** §11.8 keeps build/test states distinct; execution follows the same rule. */
export type ExecutionStatus =
  | 'succeeded'
  | 'failed'
  | 'timeout'
  | 'blocked'
  | 'not_attempted';

export type Telemetry = {
  providerId: string;
  capabilityId: string;
  operation: string;
  startedAt: string;
  durationMs: number;
  attempts: number;
  trustTier: TrustTier;
  providerRequestId?: string;
  quota?: { remaining?: number; resetAt?: string };
  httpStatus?: number;
};

export type ConnectorError = {
  code: ConnectorErrorCode;
  message: string;
  retryable: boolean;
  httpStatus?: number;
};

export type ConnectorResult<T = unknown> =
  | { status: 'succeeded'; output: T; telemetry: Telemetry }
  | {
      status: 'failed' | 'timeout' | 'blocked' | 'not_attempted';
      error: ConnectorError;
      telemetry: Telemetry;
    };

export type ConnectorDescriptor = {
  provider: ProviderIdentity;
  capability: CapabilityIdentity;
  connection: ConnectionConfig;
  auth: AuthConfig;
  permissions: readonly Permission[];
  operations: readonly OperationDefinition[];
  timeout: TimeoutBehavior;
  errors: ErrorRepresentation;
  version: { connector: string; contract: string };
};

export type InvocationContext = {
  /** Permissions granted for this run. A connector may not exceed its declaration. */
  grantedPermissions: readonly Permission[];
  trustTier: TrustTier;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type HealthStatus = {
  status: 'ok' | 'degraded' | 'unavailable';
  detail?: string;
  checkedAt: string;
  durationMs: number;
};

export interface Connector {
  readonly descriptor: ConnectorDescriptor;
  healthCheck(ctx?: Partial<InvocationContext>): Promise<HealthStatus>;
  invoke<T = unknown>(
    operation: string,
    input: unknown,
    ctx?: Partial<InvocationContext>,
  ): Promise<ConnectorResult<T>>;
}
