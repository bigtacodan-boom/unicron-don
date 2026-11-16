/**
 * Minimal validator for the JsonSchema subset in contract.ts.
 *
 * Connector outputs are validated before they are returned, so a mapper that
 * silently drifts from its declared shape fails loudly (§11.1 contract tests).
 */
import type { JsonSchema } from './contract.js';

export type ValidationIssue = { path: string; message: string };

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function matchesType(value: unknown, type: JsonSchema['type']): boolean {
  switch (type) {
    case 'array':
      return Array.isArray(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
  }
}

/** Returns every issue found; an empty array means the value conforms. */
export function validate(
  value: unknown,
  schema: JsonSchema,
  path = '$',
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (schema.enum && !(schema.enum as readonly unknown[]).includes(value)) {
    issues.push({
      path,
      message: `expected one of ${schema.enum.map(String).join(', ')}, received ${String(value)}`,
    });
    return issues;
  }

  if (!matchesType(value, schema.type)) {
    issues.push({
      path,
      message: `expected ${schema.type}, received ${describe(value)}`,
    });
    return issues;
  }

  if (schema.type === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) issues.push({ path: `${path}.${key}`, message: 'is required' });
    }
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in obj) issues.push(...validate(obj[key], sub, `${path}.${key}`));
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties ?? {}));
      for (const key of Object.keys(obj)) {
        if (!allowed.has(key)) {
          issues.push({ path: `${path}.${key}`, message: 'is not a declared property' });
        }
      }
    }
  }

  if (schema.type === 'array' && schema.items) {
    const items = schema.items;
    (value as unknown[]).forEach((item, index) => {
      issues.push(...validate(item, items, `${path}[${index}]`));
    });
  }

  return issues;
}

export function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues.map((issue) => `${issue.path} ${issue.message}`).join('; ');
}
