'use client';

import { useEffect, useState } from 'react';

type VisitorSnapshot = {
  updatedAt: string | null;
  totalVisits: number;
  locatedVisits: number;
  locations: {
    code: string;
    latitude: number;
    longitude: number;
    visitors: number;
  }[];
};

function isVisitorSnapshot(value: unknown): value is VisitorSnapshot {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<VisitorSnapshot>;
  return (
    (data.updatedAt === null ||
      (typeof data.updatedAt === 'string' &&
        Number.isFinite(Date.parse(data.updatedAt)))) &&
    Number.isSafeInteger(data.totalVisits) &&
    (data.totalVisits ?? -1) >= 0 &&
    Array.isArray(data.locations) &&
    data.locations.every(
      (point) =>
        point &&
        typeof point.code === 'string' &&
        Number.isFinite(point.latitude) &&
        Math.abs(point.latitude) <= 90 &&
        Number.isFinite(point.longitude) &&
        Math.abs(point.longitude) <= 180 &&
        Number.isFinite(point.visitors) &&
        point.visitors > 0,
    )
  );
}

export function VisitorMap() {
  const [snapshot, setSnapshot] = useState<VisitorSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Local previews never generate visits. The endpoint contains no credentials.
    if (window.location.origin !== 'https://zezhouyang.github.io') return;
    void fetch('/visitor-config.json', { cache: 'no-cache' })
      .then((response) => response.json())
      .then((value) => {
        const url = (value as { collectionUrl?: unknown }).collectionUrl;
        if (typeof url !== 'string') return;
        const endpoint = new URL(url);
        if (
          endpoint.protocol !== 'https:' ||
          endpoint.pathname !== '/collect' ||
          endpoint.username ||
          endpoint.password
        )
          return;
        return fetch(endpoint, {
          method: 'POST',
          credentials: 'omit',
          keepalive: true,
        });
      })
      .catch(() => {
        /* Counting must never affect the homepage. */
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/visitor-stats.json', {
      signal: controller.signal,
      cache: 'no-cache',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Statistics unavailable');
        return response.json();
      })
      .then((data) => {
        if (!isVisitorSnapshot(data)) {
          throw new Error('Invalid statistics');
        }
        setSnapshot(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      className="chapter visitors-section"
      id="visitors"
      aria-labelledby="visitors-heading"
    >
      <div className="section-heading">
        <h3 id="visitors-heading">Visitors</h3>
      </div>
      <div className="visitor-map">
        <div className="visitor-map-outline" aria-hidden="true" />
        <svg
          className="visitor-map-points"
          viewBox="0 0 720 290"
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- The SVG needs image semantics; an HTML img cannot contain data points.
          role="img"
          aria-label={
            snapshot
              ? `World map showing ${snapshot.locations.length} approximate visitor origins at city level.`
              : 'World map. Visitor locations are not yet available.'
          }
        >
          {snapshot?.locations.map((point) => {
            const x = (point.longitude + 180) * 2;
            const y = (85 - point.latitude) * 2;
            const radius = Math.min(5, 3 + Math.log2(point.visitors + 1) * 0.4);
            return (
              <g key={point.code} className="visitor-point">
                <title>
                  {point.visitors}{' '}
                  {point.visitors === 1 ? 'visitor' : 'visitors'} · approximate
                  origin
                </title>
                <circle
                  className="visitor-point-halo"
                  cx={x}
                  cy={y}
                  r={radius + 5}
                />
                <circle
                  className="visitor-point-core"
                  cx={x}
                  cy={y}
                  r={radius}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="visitor-map-footer">
        <p className="visitor-status" role={failed ? 'status' : undefined}>
          {failed ? (
            'Location data is temporarily unavailable.'
          ) : snapshot?.updatedAt ? (
            <>
              Approximate origins · Updated{' '}
              <time dateTime={snapshot.updatedAt}>
                {new Date(snapshot.updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </time>
            </>
          ) : snapshot ? (
            'Visitor locations will appear here.'
          ) : (
            'Loading visitor locations…'
          )}
        </p>
        {snapshot?.updatedAt && (
          <span
            className="visitor-total"
            title="Each IP and browser combination is counted once per UTC day."
          >
            {snapshot.totalVisits.toLocaleString('en-US')} daily unique visits
          </span>
        )}
      </div>
    </section>
  );
}
