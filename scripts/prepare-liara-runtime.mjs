import { chmodSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(standalone)) {
  throw new Error('Next standalone output was not generated.');
}

const copyDirectory = (source, destination) => {
  if (!existsSync(source)) throw new Error(`Required runtime path is missing: ${source}`);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
};

copyDirectory(path.join(root, 'prisma'), path.join(standalone, 'prisma'));
copyDirectory(path.join(root, 'seed - Data.csv'), path.join(standalone, 'seed - Data.csv'));
copyDirectory(path.join(root, 'public', 'zamin.csv'), path.join(standalone, 'public', 'zamin.csv'));
copyDirectory(path.join(root, 'liara_bootstrap_manual.sh'), path.join(standalone, 'bootstrap-database.sh'));
chmodSync(path.join(standalone, 'bootstrap-database.sh'), 0o755);

await build({
  entryPoints: [path.join(root, 'scripts', 'liara-migrate.mjs')],
  outfile: path.join(standalone, 'liara-migrate.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  logLevel: 'warning',
});

await build({
  entryPoints: [path.join(root, 'prisma', 'bootstrap-production.ts')],
  outfile: path.join(standalone, 'bootstrap-production.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['@prisma/client'],
  logLevel: 'warning',
});

console.log('Liara standalone migration runtime prepared during npm build.');
