/**
 * Adapter behaviour beyond the shared contract: error mapping, retries,
 * timeouts, credential redaction and replay determinism (§10.3, §11.2).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { GitHubRepositoryConnector } from '../src/adapters/github.js';
import {
  repositoryResponse,
  unencodedFileContentsResponse,
} from './fixtures.js';
import { jsonResponse } from './support.js';

const OWNER = 'bigtacodan-boom';
const REPO = 'unicron-don';
const INPUT = { owner: OWNER, repo: REPO };

function connectorWith(fetchImpl: typeof fetch, token?: string) {
  return new GitHubRepositoryConnector({
    fetchImpl,
    token,
    retryDelayMs: 0,
    now: () => new Date('2026-11-16T00:00:00.000Z'),
  });
}

function failingFetch(status: number, headers: Record<string, string> = {}): typeof fetch {
  return (async () => jsonResponse({ message: 'provider error body' }, { status, headers })) as typeof fetch;
}

test('maps 401 to unauthorized without retrying', async () => {
  const connector = connectorWith(failingFetch(401));
  const result = await connector.invoke('repository.get', INPUT);
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'unauthorized');
  assert.equal(result.error.retryable, false);
  assert.equal(result.telemetry.attempts, 1);
  assert.equal(result.telemetry.httpStatus, 401);
});

test('maps 404 to not_found', async () => {
  const result = await connectorWith(failingFetch(404)).invoke('repository.get', INPUT);
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'not_found');
});

test('maps exhausted quota (403 with remaining 0) to rate_limited and retries', async () => {
  const result = await connectorWith(
    failingFetch(403, { 'x-ratelimit-remaining': '0' }),
  ).invoke('repository.get', INPUT);
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'rate_limited');
  assert.equal(result.error.retryable, true);
  assert.equal(result.telemetry.attempts, 2, 'a retryable failure should use the second attempt');
});

test('maps plain 403 to forbidden without retrying', async () => {
  const result = await connectorWith(failingFetch(403)).invoke('repository.get', INPUT);
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'forbidden');
  assert.equal(result.telemetry.attempts, 1);
});

test('retries a 5xx and then succeeds, recording both attempts', async () => {
  let call = 0;
  const flaky = (async () => {
    call += 1;
    return call === 1
      ? jsonResponse({ message: 'boom' }, { status: 502 })
      : jsonResponse(repositoryResponse);
  }) as typeof fetch;

  const result = await connectorWith(flaky).invoke('repository.get', INPUT);
  assert.equal(result.status, 'succeeded');
  assert.equal(result.telemetry.attempts, 2);
});

test('reports timeout distinctly from failure', async () => {
  // The keep-alive timer is deliberately ref'd. AbortSignal.timeout() uses an
  // unref'd timer, so a fake fetch with no real socket lets the event loop
  // drain before the deadline fires; the runner then reports the test as
  // cancelled by parent (observed on Node 22 CI, invisible on Node 26).
  const hanging = ((_input: Request | string | URL, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      const keepAlive = setTimeout(() => {}, 5_000);
      init?.signal?.addEventListener('abort', () => {
        clearTimeout(keepAlive);
        reject(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));
      });
    })) as typeof fetch;

  const result = await connectorWith(hanging).invoke('repository.get', INPUT, { timeoutMs: 20 });
  assert.equal(result.status, 'timeout');
  assert.equal(result.error.code, 'timeout');
});

test('never leaks the credential into results or health output', async () => {
  const token = 'ghp_this_must_never_appear';
  const connector = connectorWith(failingFetch(404), token);
  const result = await connector.invoke('repository.get', INPUT);
  const health = await connector.healthCheck();
  const serialized = JSON.stringify({ result, health, descriptor: connector.descriptor });
  assert.ok(!serialized.includes(token), 'credential must not appear in output or telemetry');
  assert.ok(!serialized.includes('authorization'), 'headers are never serialized into results');
});

test('omits decoded text when the provider returns an unencoded body', async () => {
  const connector = connectorWith(
    (async () =>
      jsonResponse({
        ...unencodedFileContentsResponse,
        path: 'assets/big.bin',
      })) as typeof fetch,
  );
  const result = await connector.invoke('repository.contents', {
    owner: OWNER,
    repo: REPO,
    path: 'assets/big.bin',
  });
  assert.equal(result.status, 'succeeded');
  if (result.status !== 'succeeded') return;
  assert.ok(!('text' in (result.output as Record<string, unknown>)), 'text must be omitted, not undefined');
});

test('replays deterministically from the same fixture', async () => {
  const connector = connectorWith(
    (async () => jsonResponse(repositoryResponse)) as typeof fetch,
  );
  const first = await connector.invoke('repository.get', INPUT);
  const second = await connector.invoke('repository.get', INPUT);
  assert.equal(first.status, 'succeeded');
  assert.equal(second.status, 'succeeded');
  if (first.status !== 'succeeded' || second.status !== 'succeeded') return;
  assert.deepEqual(first.output, second.output);
});

test('propagates the caller trust tier into telemetry', async () => {
  const connector = connectorWith(
    (async () => jsonResponse(repositoryResponse)) as typeof fetch,
  );
  const result = await connector.invoke('repository.get', INPUT, { trustTier: 'tier-2-inspected' });
  assert.equal(result.telemetry.trustTier, 'tier-2-inspected');
});

test('rejects unknown operations before contacting the provider', async () => {
  let calls = 0;
  const connector = connectorWith(
    (async () => {
      calls += 1;
      return jsonResponse(repositoryResponse);
    }) as typeof fetch,
  );
  const result = await connector.invoke('repository.delete', INPUT);
  assert.equal(result.status, 'not_attempted');
  assert.equal(result.error.code, 'invalid_input');
  assert.equal(calls, 0);
});

test('healthCheck reports unavailable when the probe fails', async () => {
  const connector = connectorWith(
    (async () => {
      throw new Error('socket closed');
    }) as typeof fetch,
  );
  const health = await connector.healthCheck();
  assert.equal(health.status, 'unavailable');
});
