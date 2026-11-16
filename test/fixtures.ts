/**
 * Recorded fixtures for the GitHub adapter.
 *
 * These are synthetic bodies shaped exactly like GitHub REST responses for API
 * version 2022-11-28, so the contract suite runs with no network and no
 * credentials. The values are not captured from a live call — see
 * registry/entries/github-repository.json, which records that the shapes are
 * documentation-derived rather than source-verified against the live API.
 */

export const repositoryResponse = {
  id: 987_654_321,
  full_name: 'bigtacodan-boom/unicron-don',
  default_branch: 'main',
  visibility: 'public',
  private: false,
  archived: false,
  license: { key: 'mit', name: 'MIT License', spdx_id: 'MIT' },
  stargazers_count: 12,
  size: 2048,
  pushed_at: '2026-11-16T03:00:00Z',
};

export const treeResponse = {
  sha: '4ceed45',
  truncated: false,
  tree: [
    { path: 'LICENSE', mode: '100644', type: 'blob', sha: 'a1b2c3', size: 1072 },
    { path: 'MASTER_ENGINEERING_SPEC.md', mode: '100644', type: 'blob', sha: 'd4e5f6', size: 51579 },
    { path: 'src', mode: '040000', type: 'tree', sha: '0102030' },
  ],
};

export const fileContentsResponse = {
  type: 'file',
  encoding: 'base64',
  size: 24,
  name: 'index.ts',
  path: 'src/index.ts',
  sha: 'aa11bb22',
  content: Buffer.from('export const ok = true;\n', 'utf8').toString('base64'),
};

export const unencodedFileContentsResponse = {
  type: 'file',
  encoding: 'none',
  size: 4_000_000,
  name: 'big.bin',
  path: 'assets/big.bin',
  sha: 'cc33dd44',
  content: '',
};

export const rateLimitResponse = {
  resources: {
    core: { limit: 60, remaining: 59, reset: 1_763_000_000 },
  },
  rate: { limit: 60, remaining: 59, reset: 1_763_000_000 },
};
