// Checks that every reference URL still resolves (FR-053). Runs on a schedule in CI, never in the
// site itself. Node built-ins only. Writes a Markdown summary of failures to the path in argv[2].
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { references } = JSON.parse(fs.readFileSync(path.join(root, 'content', 'references.json'), 'utf8'));
const out = process.argv[2];
const AGENT = 'Wi-Fi7-Healthcare-Explainer-LinkCheck/1.0 (+https://github.com/timbertino1/Wi-Fi_Comparison)';

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': AGENT } });
      if (res.status === 405 && method === 'HEAD') continue;
      if (res.status === 403 && method === 'HEAD') continue;
      return { ok: res.status < 400, status: res.status };
    } catch (e) {
      // Some publisher servers omit their intermediate certificate. Browsers complete the chain
      // themselves, so the page is reachable for viewers; report it rather than fail.
      if (['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'].includes(e.cause?.code)) {
        return { ok: true, status: 'reachable (server sends an incomplete TLS chain)' };
      }
      if (method === 'GET') return { ok: false, status: e.name === 'TimeoutError' ? 'timeout' : e.cause?.code ?? e.message };
    }
  }
  return { ok: false, status: 'unknown' };
}

const failures = [];
for (const r of references.filter((x) => !x.retired)) {
  const result = await check(r.url);
  console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${result.status} ${r.id} ${r.url}`);
  if (!result.ok) failures.push({ ...r, status: result.status });
  await new Promise((resolve) => setTimeout(resolve, 1000)); // be polite to standards sites
}

if (out) {
  const lines = failures.length
    ? ['The following reference links did not resolve in the scheduled check:', '', '| Reference | Status | URL |', '|---|---|---|', ...failures.map((f) => `| \`${f.id}\` | ${f.status} | ${f.url} |`), '', 'Find the current official URL on the same publisher domain and update `content/references.json`.']
    : [];
  fs.writeFileSync(out, lines.join('\n'));
}
console.log(`${references.length - failures.length}/${references.length} reference links healthy.`);
process.exit(0);
