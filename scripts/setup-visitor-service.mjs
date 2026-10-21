import { readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { login } from './cloudflare-login.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = fileURLToPath(
  new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);
const configPath = new URL('../analytics/wrangler.jsonc', import.meta.url);
const secretPath = new URL('../.env.visitors.secrets.json', import.meta.url);
function cli(args, capture = false) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Cloudflare command failed: ${args[0]}`);
  return result.stdout ?? '';
}

// Deployment requires an authenticated Cloudflare account.
// It never creates accounts, selects a paid plan, or adds billing details.
const identity = cli(['whoami'], true);
if (/not authenticated/i.test(identity)) await login();
else console.log(identity);

const config = JSON.parse(await readFile(configPath, 'utf8'));
let databases = JSON.parse(cli(['d1', 'list', '--json'], true));
let database = databases.find((item) => item.name === 'zezhouyang-visitors');
if (!database) {
  cli([
    'd1',
    'create',
    'zezhouyang-visitors',
    '--update-config=false',
    '--config',
    'analytics/wrangler.jsonc',
  ]);
  databases = JSON.parse(cli(['d1', 'list', '--json'], true));
  database = databases.find((item) => item.name === 'zezhouyang-visitors');
}
if (!database?.uuid) throw new Error('Unable to find the new D1 database');
config.d1_databases[0].database_id = database.uuid;
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
cli([
  'd1',
  'migrations',
  'apply',
  'zezhouyang-visitors',
  '--remote',
  '--config',
  'analytics/wrangler.jsonc',
]);

let secrets;
try {
  secrets = JSON.parse(await readFile(secretPath, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  secrets = {
    VISITOR_SALT: randomBytes(32).toString('hex'),
    STATS_TOKEN: randomBytes(32).toString('hex'),
  };
  await writeFile(secretPath, JSON.stringify(secrets) + '\n', { mode: 0o600 });
}
if (!secrets.VISITOR_SALT || !secrets.STATS_TOKEN)
  throw new Error('Local visitor secrets are incomplete');
const output = cli(
  [
    'deploy',
    '--config',
    'analytics/wrangler.jsonc',
    '--secrets-file',
    '.env.visitors.secrets.json',
  ],
  true,
);
console.log(output);
const origin = output.match(
  /https:\/\/zezhouyang-visitors\.[a-zA-Z0-9-]+\.workers\.dev\b/,
)?.[0];
if (!origin)
  throw new Error(
    'Deployment finished but Worker URL was not found in the output',
  );
await writeFile(
  new URL('../.env.visitors.local', import.meta.url),
  `VISITOR_API_URL=${origin}\nVISITOR_STATS_TOKEN=${secrets.STATS_TOKEN}\n`,
  { mode: 0o600 },
);
await writeFile(
  new URL('../public/visitor-config.json', import.meta.url),
  JSON.stringify({ collectionUrl: `${origin}/collect` }) + '\n',
);
try {
  const response = await fetch(`${origin}/stats`, {
    headers: { Authorization: `Bearer ${secrets.STATS_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  if (data.precision !== 'city' || !Array.isArray(data.locations))
    throw new Error('Invalid response');
  console.log('Authenticated statistics health check passed.');
} catch {
  console.warn(
    'Worker was deployed and local configuration was saved, but its public URL could not be verified from this network.',
  );
  console.warn(
    'Check the workers.dev URL from your browser or GitHub Actions. It may require a custom domain where workers.dev is unavailable.',
  );
}
console.log(`Visitor service deployed: ${origin}`);
console.log(
  'Local secrets were saved in ignored .env.visitors.* files; never commit or share them.',
);
console.log(
  'Next: set GitHub repository variable VISITOR_API_URL to the URL above.',
);
console.log(
  'Set repository secret VISITOR_STATS_TOKEN from the matching entry in .env.visitors.local.',
);
console.log(
  'Then run the Pages workflow to enable counting and publish the snapshot.',
);
