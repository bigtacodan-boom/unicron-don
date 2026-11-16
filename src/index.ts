export {
  CONTRACT_VERSION,
  type AuthConfig,
  type CapabilityIdentity,
  type ConnectionConfig,
  type Connector,
  type ConnectorDescriptor,
  type ConnectorError,
  type ConnectorErrorCode,
  type ConnectorResult,
  type ErrorRepresentation,
  type ExecutionStatus,
  type HealthStatus,
  type InvocationContext,
  type JsonSchema,
  type OperationDefinition,
  type Permission,
  type ProviderIdentity,
  type Telemetry,
  type TimeoutBehavior,
  type TrustTier,
} from './contract.js';

export { formatIssues, validate, type ValidationIssue } from './schema.js';

export {
  CapabilityRegistry,
  RegistryError,
  type CapabilityRecord,
  type Evidence,
  type Implementation,
  type LiveSmokeResult,
  type RegistrationEntry,
  type ScanVerdict,
} from './registry.js';

export {
  GitHubRepositoryConnector,
  type GitHubConnectorOptions,
} from './adapters/github.js';

export {
  buildConformanceChecks,
  runConformance,
  type ConformanceCase,
  type ConformanceCheck,
  type ConformanceCheckResult,
  type ConformanceHarness,
  type ConformanceProof,
} from './conformance.js';
