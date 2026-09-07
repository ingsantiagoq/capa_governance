import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

export const schema = JSON.parse(await readFile(new URL('../schemas/capability-manifest.schema.json', import.meta.url), 'utf8'));

// Deliberately limited to the keywords used by the bundled schema. Fail closed
// when the schema evolves; this is not a general JSON Schema implementation.
const keywords = new Set(['$schema', 'title', 'type', 'additionalProperties', 'required', 'properties', 'minLength', 'pattern', 'minItems', 'uniqueItems', 'items', 'const', 'minimum', 'maximum']);
export function assertSupported(s) {
  for (const key of Object.keys(s)) {
    if (!keywords.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
  }
  if (s.type && !['object', 'array', 'string', 'integer'].includes(s.type)) throw new Error(`Unsupported type: ${s.type}`);
  for (const child of Object.values(s.properties ?? {})) assertSupported(child);
  if (s.items) assertSupported(s.items);
}
assertSupported(schema);

export function validate(value, s = schema, path = '$') {
  const errors = [];
  const fail = message => errors.push(`${path}: ${message}`);
  if ('const' in s && !isDeepStrictEqual(value, s.const)) fail(`expected ${JSON.stringify(s.const)}`);
  const matches = { object: value !== null && typeof value === 'object' && !Array.isArray(value), array: Array.isArray(value), string: typeof value === 'string', integer: Number.isInteger(value) };
  if (s.type && !matches[s.type]) { fail(`expected ${s.type}`); return errors; }
  if (s.type === 'object') {
    for (const key of s.required ?? []) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(s.properties ?? {}, key)) errors.push(...validate(child, s.properties[key], `${path}.${key}`));
      else if (s.additionalProperties === false) fail(`unknown property ${key}`);
    }
  }
  if (s.type === 'array') {
    if (value.length < (s.minItems ?? 0)) fail(`requires at least ${s.minItems} item(s)`);
    if (s.uniqueItems && value.some((item, i) => value.slice(0, i).some(other => isDeepStrictEqual(item, other)))) fail('duplicate items');
    if (s.items) value.forEach((item, i) => errors.push(...validate(item, s.items, `${path}[${i}]`)));
  }
  if (s.type === 'string') {
    if ([...value].length < (s.minLength ?? 0)) fail('string too short');
    if (s.pattern && !new RegExp(s.pattern, 'u').test(value)) fail(`must match ${s.pattern}`);
  }
  if (s.type === 'integer' && (value < (s.minimum ?? -Infinity) || value > (s.maximum ?? Infinity))) fail('out of bounds');
  return errors;
}

async function main() {
  let paths = process.argv.slice(2);
  if (!paths.length) {
    const dir = new URL('../examples/', import.meta.url);
    paths = (await readdir(dir)).filter(f => f.endsWith('.manifest.json')).sort().map(f => fileURLToPath(new URL(f, dir)));
  }
  if (!paths.length) throw new Error('No manifests found');
  const ids = new Set();
  for (const path of paths) {
    try {
      const manifest = JSON.parse(await readFile(path, 'utf8'));
      const errors = validate(manifest);
      if (manifest?.capability?.id) {
        if (ids.has(manifest.capability.id)) errors.push('duplicate capability id in input catalog');
        ids.add(manifest.capability.id);
      }
      if (errors.length) throw new Error(errors.join('\n'));
      console.log(`PASS ${path}`);
    } catch (error) { console.error(`FAIL ${path}: ${error.message}`); process.exitCode = 1; }
  }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
