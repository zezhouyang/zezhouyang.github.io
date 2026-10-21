import { readFile, writeFile } from 'node:fs/promises';

const configPath = new URL('../public/visitor-config.json', import.meta.url);
const statsPath = new URL('../public/visitor-stats.json', import.meta.url);
const apiUrl = process.env.VISITOR_API_URL?.trim();

if (!apiUrl) {
  await writeFile(configPath, JSON.stringify({ collectionUrl: null }) + '\n');
  console.log('Visitor service not configured; collection is disabled.');
} else {
  const origin = new URL(apiUrl);
  if (
    origin.protocol !== 'https:' ||
    origin.username ||
    origin.password ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash
  ) {
    throw new Error(
      'VISITOR_API_URL must be an HTTPS origin without a path or credentials',
    );
  }
  await writeFile(
    configPath,
    JSON.stringify({ collectionUrl: `${origin.origin}/collect` }) + '\n',
  );
  try {
    const token = process.env.VISITOR_STATS_TOKEN;
    if (!token) throw new Error('VISITOR_STATS_TOKEN is missing');
    const response = await fetch(`${origin.origin}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok)
      throw new Error(`Statistics returned HTTP ${response.status}`);
    const data = await response.json();
    if (
      data.precision !== 'city' ||
      !Number.isFinite(Date.parse(data.updatedAt)) ||
      !Number.isSafeInteger(data.totalVisits) ||
      data.totalVisits < 0 ||
      !Array.isArray(data.locations) ||
      !data.locations.every(
        (point) =>
          typeof point.code === 'string' &&
          Number.isFinite(point.latitude) &&
          Math.abs(point.latitude) <= 90 &&
          Number.isFinite(point.longitude) &&
          Math.abs(point.longitude) <= 180 &&
          Number.isSafeInteger(point.visitors) &&
          point.visitors > 0,
      ) ||
      new Set(data.locations.map((point) => point.code)).size !==
        data.locations.length ||
      data.locatedVisits !==
        data.locations.reduce((total, point) => total + point.visitors, 0) ||
      data.totalVisits < data.locatedVisits
    ) {
      throw new Error('Invalid city snapshot; preserving last snapshot');
    }
    // Whitelist fields so API changes can never expose private records or credentials.
    await writeFile(
      statsPath,
      JSON.stringify(
        {
          updatedAt: data.updatedAt,
          precision: 'city',
          totalVisits: data.totalVisits,
          locatedVisits: data.locatedVisits,
          locations: data.locations.map(
            ({ code, latitude, longitude, visitors }) => ({
              code,
              latitude,
              longitude,
              visitors,
            }),
          ),
        },
        null,
        2,
      ) + '\n',
    );
    console.log(
      `Updated visitor snapshot: ${data.totalVisits} visits, ${data.locations.length} approximate origins`,
    );
  } catch (error) {
    console.warn(`Visitor refresh failed: ${error.message}`);
    await readFile(statsPath); // Keep a previous dated snapshot or the honest initial empty state.
  }
}
