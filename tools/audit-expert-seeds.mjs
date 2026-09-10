import { basename, resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { validateManifest } from './validate-capability-manifests.mjs';
import { seedVerificationSha256, sha256 } from './governance-readiness-gate.mjs';

const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

function compact(nodes) {
  return nodes.map(node => ({ id: node.id, sourceFile: node.source_file ?? null }));
}

function uniqueRoot(nodes, predicate) {
  const matches = nodes.filter(predicate);
  if (matches.length === 1) return matches;
  const roots = matches.filter(node => node.label === basename(node.source_file ?? ''));
  return roots.length ? roots : matches;
}

function exactSource(nodes, seed) {
  const exact = uniqueRoot(nodes, node => node.source_file === seed);
  if (exact.length) return exact;
  return uniqueRoot(nodes, node => node.source_file?.endsWith(`/${seed}`));
}

export function resolveSeed(seed, nodes) {
  const stages = [
    ['exact-id', nodes.filter(node => node.id === seed)],
    ['exact-label', nodes.filter(node => node.label === seed)],
    ['exact-source', exactSource(nodes, seed)],
    ['normalized-id', nodes.filter(node => normalize(node.id ?? '') === normalize(seed))],
    ['normalized-label', nodes.filter(node => normalize(node.label ?? '') === normalize(seed))]
  ];
  const adr = seed.match(/^(CAPA )?ADR-(\d{4})(?:\s+(.+))?$/i);
  if (adr) {
    const [, capa, number, title = ''] = adr;
    if (capa && title) {
      const slug = normalize(title);
      stages.push(['capa-manifest', uniqueRoot(nodes, node => {
        const source = normalize(node.source_file ?? '');
        return source.includes(`capa_adr_${number}_`) && source.includes(`_${slug}_manifest_json`);
      })]);
    } else {
      stages.push(['adr-document', uniqueRoot(nodes, node =>
        (node.source_file ?? '').startsWith('docs/adr/') && (node.source_file ?? '').includes(`ADR-${number}-`))]);
    }
  }
  for (const [method, matches] of stages) {
    if (!matches.length) continue;
    return { seed, status: matches.length === 1 ? 'resolved' : 'ambiguous', method, matches: compact(matches.slice(0, 10)), matchCount: matches.length };
  }
  return { seed, status: 'missing', method: null, matches: [], matchCount: 0 };
}

export function auditExpertSeeds(graph, manifests, graphRevision) {
  const nodes = graph?.nodes;
  if (!Array.isArray(nodes) || !nodes.length || typeof graphRevision !== 'string' || !graphRevision.trim()) {
    throw new TypeError('Graph nodes and graph revision are required');
  }
  return {
    kind: 'domain-expert-seed-audit',
    version: 1,
    graphRevision,
    experts: manifests.map(manifest => {
      const errors = validateManifest(manifest);
      if (errors.length) throw new TypeError(`Invalid expert ${manifest?.id ?? 'unknown'}: ${errors.join('; ')}`);
      const seeds = manifest.seedNodes.map(seed => resolveSeed(seed, nodes));
      const counts = Object.fromEntries(['resolved', 'ambiguous', 'missing'].map(status => [status, seeds.filter(item => item.status === status).length]));
      return {
        expertId: manifest.id,
        manifestSha256: sha256(manifest),
        decision: counts.ambiguous || counts.missing ? 'BLOCK' : 'READY',
        counts,
        seedVerificationSha256: counts.ambiguous || counts.missing ? null : seedVerificationSha256(graphRevision, manifest.seedNodes),
        seeds
      };
    })
  };
}

async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const revisionIndex = args.indexOf('--graph-revision');
  const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
  const graphRevision = revisionIndex >= 0 ? args[revisionIndex + 1] : null;
  const optionIndexes = new Set();
  if (outputIndex >= 0) {
    optionIndexes.add(outputIndex);
    optionIndexes.add(outputIndex + 1);
  }
  if (revisionIndex >= 0) {
    optionIndexes.add(revisionIndex);
    optionIndexes.add(revisionIndex + 1);
  }
  const positional = args.filter((_, index) => !optionIndexes.has(index));
  const [graphPath, ...manifestPaths] = positional;
  if (!graphPath || !manifestPaths.length || !graphRevision) {
    throw new Error('Usage: node tools/audit-expert-seeds.mjs <graph.json> <expert...json> --graph-revision <revision> [--output <report.json>]');
  }
  const graph = JSON.parse(await readFile(graphPath, 'utf8'));
  const manifests = await Promise.all(manifestPaths.map(path => readFile(path, 'utf8').then(JSON.parse)));
  const result = auditExpertSeeds(graph, manifests, graphRevision);
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) await writeFile(outputPath, json);
  else console.log(json.trimEnd());
  for (const expert of result.experts) {
    console.error(`${expert.decision} ${expert.expertId}: ${expert.counts.resolved} resolved, ${expert.counts.ambiguous} ambiguous, ${expert.counts.missing} missing`);
  }
  if (result.experts.some(expert => expert.decision !== 'READY')) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
