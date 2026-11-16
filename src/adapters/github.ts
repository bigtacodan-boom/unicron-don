/**
 * GitHub repository adapter — the first real connector (§14 Phase 1).
 *
 * Implements read-only repository discovery through the GitHub REST API:
 * metadata, the recursive tree, and file contents. Shapes follow the GitHub
 * REST documentation (API version 2022-11-28). The tests replay recorded
 * fixtures through an injected fetch, so the contract suite needs no network
 * and no credentials.
 */
import {
  CONTRACT_VERSION,
  type Connector,
  type ConnectorDescriptor,
  type ConnectorError,
  type ConnectorResult,
  type HealthStatus,
  type InvocationContext,
  type JsonSchema,
  type OperationDefinition,
  type Permission,
  type Telemetry,
  type TrustTier,
} from '../contract.js';
import { formatIssues, validate } from '../schema.js';

const CAPABILITY_ID = 'repository-discovery';
const CONNECTOR_VERSION = '0.1.0';
const API_VERSION = '2022-11-28';

const repoKey = {
  owner: { type: 'string' as const, description: 'Repository owner (user or organisation).' },
  repo: { type: 'string' as const, description: 'Repository name.' },
};

const repositoryGetInput: JsonSchema = {
  type: 'object',
  required: ['owner', 'repo'],
  properties: { ...repoKey },
  additionalProperties: false,
};

const repositoryGetOutput: JsonSchema = {
  type: 'object',
  required: [
    'id',
    'fullName',
    'defaultBranch',
    'visibility',
    'archived',
    'licenseSpdxId',
    'stars',
    'sizeKb',
    'pushedAt',
  ],
  properties: {
    id: { type: 'number' },
    fullName: { type: 'string' },
    defaultBranch: { type: 'string' },
    visibility: { type: 'string', enum: ['public', 'private', 'internal'] },
    archived: { type: 'boolean' },
    licenseSpdxId: { type: 'string', description: 'SPDX id, or NOASSERTION when unknown.' },
    stars: { type: 'number' },
    sizeKb: { type: 'number' },
    pushedAt: { type: 'string' },
  },
};

const repositoryTreeInput: JsonSchema = {
  type: 'object',
  required: ['owner', 'repo'],
  properties: {
    ...repoKey,
    ref: { type: 'string', description: 'Branch, tag or commit SHA. Defaults to the default branch.' },
    recursive: { type: 'boolean', description: 'Walk subtrees. Defaults to true.' },
  },
  additionalProperties: false,
};

const treeEntry: JsonSchema = {
  type: 'object',
  required: ['path', 'type', 'sha', 'size'],
  properties: {
    path: { type: 'string' },
    type: { type: 'string', enum: ['blob', 'tree', 'commit'] },
    sha: { type: 'string' },
    size: { type: 'number' },
  },
};

const repositoryTreeOutput: JsonSchema = {
  type: 'object',
  required: ['sha', 'truncated', 'entries'],
  properties: {
    sha: { type: 'string' },
    truncated: { type: 'boolean', description: 'True when the provider limited the tree size.' },
    entries: { type: 'array', items: treeEntry },
  },
};

const repositoryContentsInput: JsonSchema = {
  type: 'object',
  required: ['owner', 'repo', 'path'],
  properties: {
    ...repoKey,
    path: { type: 'string', description: 'File or directory path inside the repository.' },
    ref: { type: 'string', description: 'Branch, tag or commit SHA.' },
  },
  additionalProperties: false,
};

const directoryEntry: JsonSchema = {
  type: 'object',
  required: ['name', 'path', 'type', 'sha', 'size'],
  properties: {
    name: { type: 'string' },
    path: { type: 'string' },
    type: { type: 'string' },
    sha: { type: 'string' },
    size: { type: 'number' },
  },
};

const repositoryContentsOutput: JsonSchema = {
  type: 'object',
  required: ['path', 'type', 'sha', 'size'],
  properties: {
    path: { type: 'string' },
    type: { type: 'string', description: "'file' for files, 'dir' when the path is a directory." },
    sha: { type: 'string' },
    size: { type: 'number' },
    text: { type: 'string', description: 'Decoded UTF-8 content for base64 file responses.' },
    entries: { type: 'array', items: directoryEntry },
  },
};

const READ_PERMISSIONS = ['read-only-access', 'network-access'] as const;

const OPERATIONS: readonly OperationDefinition[] = [
  {
    name: 'repository.get',
    summary: 'Read repository metadata: default branch, visibility, licence, size.',
    input: repositoryGetInput,
    output: repositoryGetOutput,
    requiredPermissions: [...READ_PERMISSIONS],
    timeoutMs: 15_000,
    idempotent: true,
  },
  {
    name: 'repository.tree',
    summary: 'List the repository tree, recursively by default (§9 source discovery).',
    input: repositoryTreeInput,
    output: repositoryTreeOutput,
    requiredPermissions: [...READ_PERMISSIONS],
    timeoutMs: 20_000,
    idempotent: true,
  },
  {
    name: 'repository.contents',
    summary: 'Read one file, or list one directory, at an optional ref.',
    input: repositoryContentsInput,
    output: repositoryContentsOutput,
    requiredPermissions: [...READ_PERMISSIONS],
    timeoutMs: 15_000,
    idempotent: true,
  },
];

export type GitHubConnectorOptions = {
  /** Optional token. Defaults to GITHUB_TOKEN. Never recorded in telemetry. */
  token?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  retryDelayMs?: number;
  now?: () => Date;
};

type RawResponse = {
  json: unknown;
  httpStatus: number;
  attempts: number;
  providerRequestId?: string;
  quota?: { remaining?: number; resetAt?: string };
};

type FailureStatus = 'failed' | 'timeout' | 'blocked' | 'not_attempted';

class ConnectorFailure extends Error {
  readonly error: ConnectorError;
  readonly attempts: number;

  constructor(error: ConnectorError, attempts: number) {
    super(error.message);
    this.name = 'ConnectorFailure';
    this.error = error;
    this.attempts = attempts;
  }
}

class OutputShapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OutputShapeError';
  }
}

function toConnectorFailure(error: unknown): ConnectorFailure {
  if (error instanceof ConnectorFailure) return error;
  return new ConnectorFailure(
    { code: 'network_error', message: 'request failed before a response was received', retryable: false },
    0,
  );
}

function record(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new OutputShapeError(`${what} is not an object`);
  }
  return value as Record<string, unknown>;
}

function stringField(obj: Record<string, unknown>, key: string, what: string): string {
  const value = obj[key];
  if (typeof value !== 'string') throw new OutputShapeError(`${what}.${key} is not a string`);
  return value;
}

function numberField(obj: Record<string, unknown>, key: string, what: string): number {
  const value = obj[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new OutputShapeError(`${what}.${key} is not a number`);
  }
  return value;
}

function booleanField(obj: Record<string, unknown>, key: string, what: string): boolean {
  const value = obj[key];
  if (typeof value !== 'boolean') throw new OutputShapeError(`${what}.${key} is not a boolean`);
  return value;
}

function textField(obj: Record<string, unknown>, key: string): string {
  const value = obj[key];
  return typeof value === 'string' ? value : '';
}

function optionalSize(obj: Record<string, unknown>): number {
  const value = obj.size;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export class GitHubRepositoryConnector implements Connector {
  readonly descriptor: ConnectorDescriptor;

  readonly #fetch: typeof fetch;
  readonly #baseUrl: string;
  readonly #token: string | undefined;
  readonly #retryDelayMs: number;
  readonly #clock: () => Date;

  constructor(options: GitHubConnectorOptions = {}) {
    this.#fetch = options.fetchImpl ?? globalThis.fetch;
    this.#baseUrl = (options.baseUrl ?? 'https://api.github.com').replace(/\/+$/, '');
    this.#token = options.token ?? process.env.GITHUB_TOKEN;
    this.#retryDelayMs = options.retryDelayMs ?? 250;
    this.#clock = options.now ?? (() => new Date());

    this.descriptor = {
      provider: { id: 'github', name: 'GitHub', homepage: 'https://docs.github.com/en/rest' },
      capability: {
        id: CAPABILITY_ID,
        version: CONNECTOR_VERSION,
        summary:
          'Discover repository metadata, trees and file contents through the GitHub REST API.',
      },
      connection: {
        baseUrl: this.#baseUrl,
        transport: 'https',
        configKeys: ['GITHUB_TOKEN'],
      },
      auth: { scheme: 'bearer', envVar: 'GITHUB_TOKEN', required: false },
      permissions: [...READ_PERMISSIONS],
      operations: OPERATIONS,
      timeout: {
        defaultTimeoutMs: 15_000,
        maxTimeoutMs: 60_000,
        onTimeout: 'retry',
        maxAttempts: 2,
      },
      errors: {
        codes: [
          'invalid_input',
          'permission_denied',
          'unauthorized',
          'forbidden',
          'not_found',
          'rate_limited',
          'timeout',
          'network_error',
          'provider_error',
          'output_invalid',
          'unavailable',
        ],
        detailPolicy: 'redacted',
      },
      version: { connector: CONNECTOR_VERSION, contract: CONTRACT_VERSION },
    };
  }

  async healthCheck(ctx: Partial<InvocationContext> = {}): Promise<HealthStatus> {
    const startedAt = this.#clock();
    const elapsed = () => Math.max(0, this.#clock().getTime() - startedAt.getTime());
    try {
      const response = await this.#request('/rate_limit', 5_000, ctx);
      if (response.status === 200) {
        return { status: 'ok', checkedAt: this.#clock().toISOString(), durationMs: elapsed() };
      }
      if (response.status === 401) {
        return {
          status: 'unavailable',
          detail: 'credential rejected (HTTP 401)',
          checkedAt: this.#clock().toISOString(),
          durationMs: elapsed(),
        };
      }
      if (response.status === 403) {
        return {
          status: 'degraded',
          detail: 'rate limited (HTTP 403)',
          checkedAt: this.#clock().toISOString(),
          durationMs: elapsed(),
        };
      }
      return {
        status: 'degraded',
        detail: `unexpected status HTTP ${response.status}`,
        checkedAt: this.#clock().toISOString(),
        durationMs: elapsed(),
      };
    } catch {
      return {
        status: 'unavailable',
        detail: 'rate-limit probe failed',
        checkedAt: this.#clock().toISOString(),
        durationMs: elapsed(),
      };
    }
  }

  async invoke<T = unknown>(
    operation: string,
    input: unknown,
    ctx: Partial<InvocationContext> = {},
  ): Promise<ConnectorResult<T>> {
    const startedAt = this.#clock();
    const trustTier: TrustTier = ctx.trustTier ?? 'tier-3-untrusted';
    const operation_ = OPERATIONS.find((candidate) => candidate.name === operation);

    if (!operation_) {
      return this.#fail('not_attempted', operation, startedAt, trustTier, 0, {
        code: 'invalid_input',
        message: `unknown operation: ${operation}`,
        retryable: false,
      });
    }

    const inputIssues = validate(input, operation_.input);
    if (inputIssues.length > 0) {
      return this.#fail('not_attempted', operation, startedAt, trustTier, 0, {
        code: 'invalid_input',
        message: `invalid input: ${formatIssues(inputIssues)}`,
        retryable: false,
      });
    }

    // Permission gate (§10.7): absent a grant, the provider is never contacted.
    const granted = new Set<Permission>(ctx.grantedPermissions ?? this.descriptor.permissions);
    const missing = operation_.requiredPermissions.filter((permission) => !granted.has(permission));
    if (missing.length > 0) {
      return this.#fail('blocked', operation, startedAt, trustTier, 0, {
        code: 'permission_denied',
        message: `missing permissions: ${missing.join(', ')}`,
        retryable: false,
      });
    }

    const timeoutMs = Math.max(
      1,
      Math.min(ctx.timeoutMs ?? operation_.timeoutMs, operation_.timeoutMs, this.descriptor.timeout.maxTimeoutMs),
    );
    const params = input as Record<string, unknown>;

    let raw: RawResponse;
    try {
      raw = await this.#execute(this.#path(operation, params), timeoutMs, ctx);
    } catch (error) {
      const failure = toConnectorFailure(error);
      const status: FailureStatus = failure.error.code === 'timeout' ? 'timeout' : 'failed';
      return this.#fail(status, operation, startedAt, trustTier, failure.attempts, failure.error);
    }

    let output: unknown;
    try {
      output = this.#map(operation, raw.json, params);
    } catch {
      return this.#fail(
        'failed',
        operation,
        startedAt,
        trustTier,
        raw.attempts,
        {
          code: 'output_invalid',
          message: `provider response did not match the declared shape for ${operation}`,
          retryable: false,
          httpStatus: raw.httpStatus,
        },
        raw,
      );
    }

    const outputIssues = validate(output, operation_.output);
    if (outputIssues.length > 0) {
      return this.#fail(
        'failed',
        operation,
        startedAt,
        trustTier,
        raw.attempts,
        {
          code: 'output_invalid',
          message: `output failed schema validation: ${formatIssues(outputIssues)}`,
          retryable: false,
          httpStatus: raw.httpStatus,
        },
        raw,
      );
    }

    return {
      status: 'succeeded',
      output: output as T,
      telemetry: this.#telemetry(operation, startedAt, trustTier, raw.attempts, raw),
    };
  }

  #path(operation: string, params: Record<string, unknown>): string {
    const owner = String(params.owner);
    const repo = String(params.repo);
    const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const ref = typeof params.ref === 'string' && params.ref.length > 0 ? params.ref : undefined;

    switch (operation) {
      case 'repository.get':
        return base;
      case 'repository.tree': {
        const treeRef = ref ?? 'HEAD';
        const recursive = params.recursive === false ? '' : '?recursive=1';
        return `${base}/git/trees/${encodeURIComponent(treeRef)}${recursive}`;
      }
      case 'repository.contents': {
        const path = String(params.path).replace(/^\/+/, '');
        const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
        return `${base}/contents/${path}${query}`;
      }
      default:
        throw new ConnectorFailure(
          { code: 'invalid_input', message: `unknown operation: ${operation}`, retryable: false },
          0,
        );
    }
  }

  #headers(): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'x-github-api-version': API_VERSION,
      'user-agent': 'to-kill-a-jarvis-connector/0.1',
    };
    // The credential is attached here and nowhere else: it must not reach
    // telemetry, output or an error message.
    if (this.#token) headers.authorization = `Bearer ${this.#token}`;
    return headers;
  }

  async #request(path: string, timeoutMs: number, ctx: Partial<InvocationContext>): Promise<Response> {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = ctx.signal ? AbortSignal.any([ctx.signal, timeout]) : timeout;
    return this.#fetch(`${this.#baseUrl}${path}`, { headers: this.#headers(), signal });
  }

  #sleep(attempt: number): Promise<void> {
    const delay = this.#retryDelayMs * attempt;
    if (delay <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async #execute(path: string, timeoutMs: number, ctx: Partial<InvocationContext>): Promise<RawResponse> {
    const maxAttempts = Math.max(1, this.descriptor.timeout.maxAttempts);
    let last: ConnectorFailure | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.#request(path, timeoutMs, ctx);

        if (!response.ok) {
          const error = this.#mapHttpError(response);
          if (error.retryable && attempt < maxAttempts) {
            last = new ConnectorFailure(error, attempt);
            await this.#sleep(attempt);
            continue;
          }
          throw new ConnectorFailure(error, attempt);
        }

        const json = await response.json().catch(() => {
          throw new ConnectorFailure(
            {
              code: 'provider_error',
              message: 'provider returned a body that is not JSON',
              retryable: false,
              httpStatus: response.status,
            },
            attempt,
          );
        });

        const remaining = response.headers.get('x-ratelimit-remaining');
        const reset = response.headers.get('x-ratelimit-reset');
        const providerRequestId = response.headers.get('x-github-request-id') ?? undefined;

        return {
          json,
          httpStatus: response.status,
          attempts: attempt,
          providerRequestId,
          quota:
            remaining === null
              ? undefined
              : {
                  remaining: Number(remaining),
                  resetAt:
                    reset === null ? undefined : new Date(Number(reset) * 1000).toISOString(),
                },
        };
      } catch (error) {
        const failure = this.#classifyFailure(error, ctx);
        if (failure.error.retryable && attempt < maxAttempts) {
          last = new ConnectorFailure(failure.error, attempt);
          await this.#sleep(attempt);
          continue;
        }
        throw new ConnectorFailure(failure.error, attempt);
      }
    }

    throw (
      last ??
      new ConnectorFailure(
        { code: 'unavailable', message: 'no attempt completed', retryable: false },
        maxAttempts,
      )
    );
  }

  /**
   * Separates a timeout from a transport failure (§11.8): collapsing the two
   * would report an exhausted deadline as an ordinary error.
   */
  #classifyFailure(error: unknown, ctx: Partial<InvocationContext>): ConnectorFailure {
    if (error instanceof ConnectorFailure) return error;

    const name = error instanceof Error ? error.name : '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      const abortedByCaller = ctx.signal?.aborted === true;
      return new ConnectorFailure(
        {
          code: 'timeout',
          message: abortedByCaller ? 'request aborted by the caller' : 'request exceeded its timeout',
          retryable: !abortedByCaller,
        },
        0,
      );
    }

    return new ConnectorFailure(
      {
        code: 'network_error',
        message: 'request failed before a response was received',
        retryable: true,
      },
      0,
    );
  }

  /**
   * Maps HTTP status to a declared error code. Provider bodies are never
   * echoed: fetched content is untrusted and can carry injected instructions.
   */
  #mapHttpError(response: Response): ConnectorError {
    const status = response.status;
    const remaining = response.headers.get('x-ratelimit-remaining');
    const message = `GitHub API returned HTTP ${status}`;

    if (status === 401) return { code: 'unauthorized', message, retryable: false, httpStatus: status };
    if (status === 403 && remaining === '0') {
      return { code: 'rate_limited', message, retryable: true, httpStatus: status };
    }
    if (status === 403) return { code: 'forbidden', message, retryable: false, httpStatus: status };
    if (status === 404) return { code: 'not_found', message, retryable: false, httpStatus: status };
    if (status === 422) return { code: 'invalid_input', message, retryable: false, httpStatus: status };
    if (status === 429) return { code: 'rate_limited', message, retryable: true, httpStatus: status };
    if (status >= 500) return { code: 'provider_error', message, retryable: true, httpStatus: status };
    return { code: 'provider_error', message, retryable: false, httpStatus: status };
  }

  #map(operation: string, json: unknown, params: Record<string, unknown>): unknown {
    switch (operation) {
      case 'repository.get':
        return this.#mapRepository(json);
      case 'repository.tree':
        return this.#mapTree(json);
      case 'repository.contents':
        return this.#mapContents(json, params);
      default:
        throw new OutputShapeError(`unknown operation: ${operation}`);
    }
  }

  #mapRepository(json: unknown): unknown {
    const repository = record(json, 'repository');
    const licence = repository.license;
    const spdx =
      licence === null || licence === undefined
        ? 'NOASSERTION'
        : stringField(record(licence, 'repository.license'), 'spdx_id', 'repository.license');
    const visibility =
      typeof repository.visibility === 'string'
        ? repository.visibility
        : repository.private === true
          ? 'private'
          : 'public';

    return {
      id: numberField(repository, 'id', 'repository'),
      fullName: stringField(repository, 'full_name', 'repository'),
      defaultBranch: stringField(repository, 'default_branch', 'repository'),
      visibility,
      archived: booleanField(repository, 'archived', 'repository'),
      licenseSpdxId: spdx,
      stars: numberField(repository, 'stargazers_count', 'repository'),
      sizeKb: numberField(repository, 'size', 'repository'),
      pushedAt: textField(repository, 'pushed_at'),
    };
  }

  #mapTree(json: unknown): unknown {
    const tree = record(json, 'tree');
    const entries = tree.tree;
    if (!Array.isArray(entries)) throw new OutputShapeError('tree.tree is not an array');

    return {
      sha: stringField(tree, 'sha', 'tree'),
      truncated: booleanField(tree, 'truncated', 'tree'),
      entries: entries.map((raw) => {
        const entry = record(raw, 'tree.entry');
        return {
          path: stringField(entry, 'path', 'tree.entry'),
          type: stringField(entry, 'type', 'tree.entry'),
          sha: stringField(entry, 'sha', 'tree.entry'),
          size: optionalSize(entry),
        };
      }),
    };
  }

  #mapContents(json: unknown, params: Record<string, unknown>): unknown {
    const requestedPath = typeof params.path === 'string' ? params.path : '';

    if (Array.isArray(json)) {
      return {
        path: requestedPath,
        type: 'dir',
        sha: '',
        size: 0,
        entries: json.map((raw) => {
          const entry = record(raw, 'contents.entry');
          return {
            name: stringField(entry, 'name', 'contents.entry'),
            path: stringField(entry, 'path', 'contents.entry'),
            type: stringField(entry, 'type', 'contents.entry'),
            sha: stringField(entry, 'sha', 'contents.entry'),
            size: optionalSize(entry),
          };
        }),
      };
    }

    const file = record(json, 'contents');
    const encoding = textField(file, 'encoding');
    const encoded = textField(file, 'content');
    const text =
      encoding === 'base64' && encoded.length > 0
        ? Buffer.from(encoded, 'base64').toString('utf8')
        : undefined;

    const output: Record<string, unknown> = {
      path: stringField(file, 'path', 'contents'),
      type: stringField(file, 'type', 'contents'),
      sha: stringField(file, 'sha', 'contents'),
      size: numberField(file, 'size', 'contents'),
    };
    // Omitted rather than set to undefined: the key must not appear when the
    // provider returned no decodable text (large files come back unencoded).
    if (text !== undefined) output.text = text;
    return output;
  }

  #telemetry(
    operation: string,
    startedAt: Date,
    trustTier: TrustTier,
    attempts: number,
    raw?: RawResponse,
  ): Telemetry {
    const telemetry: Telemetry = {
      providerId: this.descriptor.provider.id,
      capabilityId: this.descriptor.capability.id,
      operation,
      startedAt: startedAt.toISOString(),
      durationMs: Math.max(0, this.#clock().getTime() - startedAt.getTime()),
      attempts,
      trustTier,
    };
    if (raw?.providerRequestId) telemetry.providerRequestId = raw.providerRequestId;
    if (raw?.quota) telemetry.quota = raw.quota;
    if (raw?.httpStatus !== undefined) telemetry.httpStatus = raw.httpStatus;
    return telemetry;
  }

  #fail(
    status: FailureStatus,
    operation: string,
    startedAt: Date,
    trustTier: TrustTier,
    attempts: number,
    error: ConnectorError,
    raw?: RawResponse,
  ): ConnectorResult<never> {
    const telemetry = this.#telemetry(operation, startedAt, trustTier, attempts, raw);
    const httpStatus = error.httpStatus ?? raw?.httpStatus;
    if (httpStatus !== undefined) telemetry.httpStatus = httpStatus;
    return { status, error, telemetry };
  }
}
