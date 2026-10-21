interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  VISITOR_SALT: string;
  STATS_TOKEN: string;
}

type Geo = { city?: unknown; latitude?: unknown; longitude?: unknown };

// Never substitute a country center when city-level information is unavailable.
export function locationFromGeo(geo?: Geo) {
  if (
    typeof geo?.city !== 'string' ||
    !geo.city.trim() ||
    geo.latitude == null ||
    geo.longitude == null ||
    geo.latitude === '' ||
    geo.longitude === ''
  )
    return null;
  const latitude = Number(geo.latitude);
  const longitude = Number(geo.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  // About 11 km resolution in latitude: these are approximate IP-derived origins.
  return {
    latitude: Math.round(latitude * 10) / 10,
    longitude: Math.round(longitude * 10) / 10,
  };
}

export async function visitorHash(
  ip: string,
  userAgent: string,
  day: string,
  secret: string,
) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const result = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(JSON.stringify([day, ip, userAgent.slice(0, 512)])),
  );
  return Array.from(new Uint8Array(result), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

async function authorized(request: Request, token: string) {
  if (!token) return false;
  // Compare fixed-length digests rather than leaking token prefix timing.
  const encoder = new TextEncoder();
  const [expected, received] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(`Bearer ${token}`)),
    crypto.subtle.digest(
      'SHA-256',
      encoder.encode(request.headers.get('authorization') ?? ''),
    ),
  ]);
  const a = new Uint8Array(expected);
  const b = new Uint8Array(received);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    const noStore = { 'Cache-Control': 'no-store' };
    if (path === '/stats' && request.method === 'GET') {
      if (!(await authorized(request, env.STATS_TOKEN))) {
        return new Response('Unauthorized', { status: 401, headers: noStore });
      }
      const { results } = await env.DB.prepare(
        'SELECT location_key, latitude, longitude, visits, last_seen FROM locations ORDER BY location_key',
      ).all<{
        location_key: string;
        latitude: number | null;
        longitude: number | null;
        visits: number;
        last_seen: string;
      }>();
      const locations = results
        .filter((row) => row.latitude !== null && row.longitude !== null)
        .map((row) => ({
          code: row.location_key,
          latitude: row.latitude,
          longitude: row.longitude,
          visitors: row.visits,
        }));
      return Response.json(
        {
          updatedAt: new Date().toISOString(),
          precision: 'city',
          totalVisits: results.reduce((total, row) => total + row.visits, 0),
          locatedVisits: locations.reduce(
            (total, row) => total + row.visitors,
            0,
          ),
          locations,
        },
        { headers: noStore },
      );
    }
    if (path !== '/collect') return new Response('Not found', { status: 404 });
    if (request.headers.get('origin') !== env.ALLOWED_ORIGIN) {
      return new Response('Forbidden', { status: 403, headers: noStore });
    }
    const headers = {
      ...noStore,
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers });
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405, headers });
    if (!env.VISITOR_SALT)
      return new Response('Not configured', { status: 503, headers });
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip)
      return new Response('Client address unavailable', {
        status: 400,
        headers,
      });
    const ua = request.headers.get('user-agent') ?? '';
    if (/bot\b|crawler|spider|headless|curl\/|wget\//i.test(ua)) {
      return new Response(null, { status: 204, headers });
    }
    const day = new Date().toISOString().slice(0, 10);
    const hash = await visitorHash(ip, ua, day, env.VISITOR_SALT);
    // request.cf is supplied by Cloudflare, never by a client JSON payload.
    const location = locationFromGeo(request.cf as Geo | undefined);
    const locationKey = location
      ? `${location.latitude},${location.longitude}`
      : 'unknown';
    await env.DB.prepare(`INSERT OR IGNORE INTO daily_visits
      (visitor_hash, day, location_key, latitude, longitude) VALUES (?, ?, ?, ?, ?)`)
      .bind(
        hash,
        day,
        locationKey,
        location?.latitude ?? null,
        location?.longitude ?? null,
      )
      .run();
    return new Response(null, { status: 204, headers });
  },
  async scheduled(_controller: ScheduledController, env: Env) {
    await env.DB.prepare(
      "DELETE FROM daily_visits WHERE day < date('now', '-3 days')",
    ).run();
  },
};

export default worker;
