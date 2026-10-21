import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { locationFromGeo, visitorHash } from './worker.ts';

function environment() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(
    readFileSync(
      new URL('./migrations/0001_visitors.sql', import.meta.url),
      'utf8',
    ),
  );
  const env = {
    ALLOWED_ORIGIN: 'https://zezhouyang.github.io',
    VISITOR_SALT: 'test-salt-only',
    STATS_TOKEN: 'test-token-only',
    DB: {
      prepare(sql) {
        let bindings = [];
        const statement = {
          bind(...values) {
            bindings = values;
            return statement;
          },
          async run() {
            return sqlite.prepare(sql).run(...bindings);
          },
          async all() {
            return { results: sqlite.prepare(sql).all(...bindings) };
          },
        };
        return statement;
      },
    },
  };
  return { env, sqlite };
}
function visit({
  origin = 'https://zezhouyang.github.io',
  ip = '192.0.2.1',
  geo,
  ua = 'Mozilla/5.0',
} = {}) {
  const request = new Request('https://test.example/collect', {
    method: 'POST',
    headers: { Origin: origin, 'CF-Connecting-IP': ip, 'User-Agent': ua },
  });
  Object.defineProperty(request, 'cf', { value: geo });
  return request;
}
async function stats(env) {
  const response = await worker.fetch(
    new Request('https://test.example/stats', {
      headers: { Authorization: 'Bearer test-token-only' },
    }),
    env,
  );
  assert.equal(response.status, 200);
  return response.json();
}

test('city coordinates are approximate; missing city/invalid data never become invented points', () => {
  assert.deepEqual(
    locationFromGeo({
      city: 'Hong Kong',
      latitude: '22.3193',
      longitude: '114.1694',
    }),
    { latitude: 22.3, longitude: 114.2 },
  );
  assert.equal(locationFromGeo({ latitude: 35, longitude: 105 }), null);
  assert.equal(
    locationFromGeo({ city: 'X', latitude: '', longitude: 0 }),
    null,
  );
  assert.equal(
    locationFromGeo({ city: 'X', latitude: 91, longitude: 0 }),
    null,
  );
  assert.equal(locationFromGeo(), null);
});

test('HMAC deduplication changes daily and does not contain the raw IP', async () => {
  const a = await visitorHash('192.0.2.1', 'browser', '2026-10-21', 'salt');
  assert.equal(
    a,
    await visitorHash('192.0.2.1', 'browser', '2026-10-21', 'salt'),
  );
  assert.notEqual(
    a,
    await visitorHash('192.0.2.1', 'browser', '2026-10-22', 'salt'),
  );
  assert.notEqual(
    a,
    await visitorHash('192.0.2.1', 'browser', '2026-10-21', 'another salt'),
  );
  assert(!a.includes('192.0.2.1'));
});

test('real SQL deduplicates visits; unknown origins count without a map point', async () => {
  const { env, sqlite } = environment();
  const geo = { city: 'Hong Kong', latitude: '22.3193', longitude: '114.1694' };
  for (let i = 0; i < 2; i++)
    assert.equal((await worker.fetch(visit({ geo }), env)).status, 204);
  await worker.fetch(visit({ ip: '192.0.2.2' }), env);
  const data = await stats(env);
  assert.equal(data.totalVisits, 2);
  assert.equal(data.locatedVisits, 1);
  assert.equal(data.locations.length, 1);
  assert.equal(data.locations[0].latitude, 22.3);
  const record = sqlite.prepare('SELECT * FROM daily_visits LIMIT 1').get();
  assert(!JSON.stringify(record).includes('192.0.2.1'));
  sqlite.close();
});

test('unauthorized reads, foreign origins and obvious bots are rejected', async () => {
  const { env, sqlite } = environment();
  assert.equal(
    (await worker.fetch(new Request('https://test.example/stats'), env)).status,
    401,
  );
  assert.equal(
    (await worker.fetch(visit({ origin: 'https://other.example' }), env))
      .status,
    403,
  );
  assert.equal(
    (await worker.fetch(visit({ ua: 'Googlebot/2.1' }), env)).status,
    204,
  );
  assert.equal((await stats(env)).totalVisits, 0);
  const preflight = await worker.fetch(
    new Request('https://test.example/collect', {
      method: 'OPTIONS',
      headers: { Origin: env.ALLOWED_ORIGIN },
    }),
    env,
  );
  assert.equal(preflight.status, 204);
  assert.equal(
    preflight.headers.get('Access-Control-Allow-Origin'),
    env.ALLOWED_ORIGIN,
  );
  sqlite.close();
});

test('cleanup deletes old deduplication hashes without deleting lifetime counts', async () => {
  const { env, sqlite } = environment();
  sqlite
    .prepare('INSERT INTO daily_visits VALUES (?, ?, ?, ?, ?)')
    .run('old-hash', '2000-01-01', '1,2', 1, 2);
  await worker.scheduled({}, env);
  assert.equal(
    sqlite.prepare('SELECT COUNT(*) AS n FROM daily_visits').get().n,
    0,
  );
  assert.equal((await stats(env)).totalVisits, 1);
  sqlite.close();
});
