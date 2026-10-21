import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function validateCallback(value, expectedState) {
  const url = new URL(value.trim());
  if (
    !expectedState ||
    url.protocol !== 'http:' ||
    url.hostname !== 'localhost' ||
    url.port !== '8976' ||
    url.pathname !== '/oauth/callback' ||
    url.username ||
    url.password ||
    url.hash ||
    url.searchParams.get('state') !== expectedState ||
    !(url.searchParams.get('code') || url.searchParams.get('error'))
  ) {
    throw new Error('Callback does not match this login attempt');
  }
  return url;
}

export async function login() {
  const callbackFile = new URL(
    '../.env.visitors.oauth-callback',
    import.meta.url,
  );
  await writeFile(callbackFile, '', { mode: 0o600 });
  console.log(
    'Open the official authorization link below in your own browser.',
  );
  console.log(
    'If the final localhost page cannot connect, save its COMPLETE address in:',
  );
  console.log(fileURLToPath(callbackFile));
  console.log(
    'Keep the callback address private. Authorization expires after 2 minutes.',
  );
  const child = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
      ),
      'login',
      '--browser=false',
      '--scopes',
      'account:read',
      'user:read',
      'workers_scripts:write',
      'd1:write',
    ],
    { stdio: ['inherit', 'pipe', 'inherit'], env: process.env },
  );
  let expectedState;
  let output = '';
  let forwarding = false;
  let rejected = false;
  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    output = (output + chunk.toString()).slice(-65536);
    const auth = output.match(
      /https:\/\/dash\.cloudflare\.com\/oauth2\/auth\?[^\s]+/,
    );
    if (auth) expectedState = new URL(auth[0]).searchParams.get('state');
  });
  const timer = setInterval(async () => {
    if (forwarding || !expectedState) return;
    forwarding = true;
    try {
      const value = await readFile(callbackFile, 'utf8');
      if (!value.trim()) return;
      const url = validateCallback(value, expectedState);
      // Replay only to Wrangler's verified loopback listener. Do not follow redirects.
      await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(25000),
      });
      await writeFile(callbackFile, '', { mode: 0o600 });
    } catch {
      if (!rejected)
        console.error(
          'Callback not accepted; check the file contains the complete address for this login attempt.',
        );
      rejected = true;
    } finally {
      forwarding = false;
    }
  }, 500);
  const stop = () => child.kill('SIGTERM');
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', (code) =>
        code === 0
          ? resolve()
          : reject(
              new Error(
                'Cloudflare authorization did not finish; rerun setup for a new link',
              ),
            ),
      );
    });
  } finally {
    clearInterval(timer);
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    await writeFile(callbackFile, '', { mode: 0o600 });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await login();
}
