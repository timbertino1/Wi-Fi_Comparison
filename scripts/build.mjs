// Bundles src/ into a classic (IIFE) script so dist/index.html opens from file:// (research R1).
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const args = new Set(process.argv.slice(2));
const watch = args.has('--watch');
const snapshots = !args.has('--no-snapshots');
const MAX_GZIP_BYTES = 500 * 1024;

function copyStatic() {
  fs.mkdirSync(dist, { recursive: true });
  fs.copyFileSync(path.join(root, 'src', 'index.html'), path.join(dist, 'index.html'));
  const stylesDir = path.join(root, 'src', 'styles');
  for (const file of fs.readdirSync(stylesDir)) {
    if (file.endsWith('.css')) fs.copyFileSync(path.join(stylesDir, file), path.join(dist, file));
  }
}

function checkSize() {
  const bundle = fs.readFileSync(path.join(dist, 'app.js'));
  const gz = zlib.gzipSync(bundle).length;
  console.log(`dist/app.js: ${(bundle.length / 1024).toFixed(1)} KB, ${(gz / 1024).toFixed(1)} KB gzipped`);
  if (gz > MAX_GZIP_BYTES) {
    console.error(`Bundle exceeds the ${MAX_GZIP_BYTES / 1024} KB gzip budget.`);
    return false;
  }
  return true;
}

const options = {
  entryPoints: [path.join(root, 'src', 'main.js')],
  outfile: path.join(dist, 'app.js'),
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: true,
  sourcemap: 'linked',
  loader: { '.json': 'json' },
  legalComments: 'linked',
  logLevel: 'warning'
};

fs.rmSync(dist, { recursive: true, force: true });
copyStatic();
// The speaker talk track is regenerated from content on every build, into docs/ (never dist/).
const talkTrack = spawnSync(process.execPath, [path.join(root, 'scripts', 'talk-track.mjs')], { stdio: 'inherit' });
if (talkTrack.status !== 0) process.exit(talkTrack.status ?? 1);

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{
      name: 'copy-static',
      setup(build) {
        build.onEnd((result) => {
          copyStatic();
          if (!result.errors.length) checkSize();
        });
      }
    }]
  });
  await ctx.watch();
  console.log('Watching for changes…');
} else {
  await esbuild.build(options);
  if (!checkSize()) process.exit(1);
  const snapshotScript = path.join(root, 'scripts', 'snapshots.mjs');
  if (snapshots && fs.existsSync(snapshotScript)) {
    const run = spawnSync(process.execPath, [snapshotScript], { stdio: 'inherit' });
    if (run.status !== 0) process.exit(run.status ?? 1);
  }
}
