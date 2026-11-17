// Watch mode for the Node.js services: recompiles with tsc and restarts on output changes.
// Usage (from a service directory): node ../../scripts/dev-node-service.mjs [node args...] <entry>
// tsc is used (not a TS loader) because NestJS dependency injection needs decorator metadata.
import { execFileSync, spawn } from 'node:child_process';

const tsc = ['exec', 'tsc', '-p', 'tsconfig.build.json'];
const shell = process.platform === 'win32';

// Initial build so the first start has fresh output.
execFileSync('pnpm', tsc, { stdio: 'inherit', shell });

const children = [
  spawn('pnpm', [...tsc, '--watch', '--preserveWatchOutput'], { stdio: 'inherit', shell }),
  spawn(
    process.execPath,
    [
      '--enable-source-maps',
      '--env-file-if-exists=.env',
      '--watch-path=dist',
      ...process.argv.slice(2),
    ],
    { stdio: 'inherit' },
  ),
];

function stop() {
  for (const child of children) child.kill();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const child of children) {
  child.on('exit', (code) => {
    stop();
    process.exitCode = code ?? 0;
  });
}
