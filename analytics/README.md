# Visitor analytics

A Cloudflare Worker records approximate visitor origins in D1. GitHub Actions
exports aggregate statistics to the static homepage every six hours and before
each deployment.

## Setup

Requires a Cloudflare account, Node.js 22.13 or later, and the project dependencies.

```sh
npm ci
npm run visitors:setup
```

The setup script authenticates with Cloudflare, creates or reuses the D1 database,
applies migrations, generates service secrets, and deploys the Worker. A
`workers.dev` subdomain must be enabled in the Cloudflare account.
For accounts with multiple Cloudflare memberships, set `CLOUDFLARE_ACCOUNT_ID`
to select the deployment account.

Authentication uses a browser link and requests account/user read, Workers
scripts, and D1 permissions. In a remote environment, the final localhost callback
may not connect: save its complete URL in `.env.visitors.oauth-callback` while
the script is running. The script validates the state, forwards the callback to
the local Wrangler listener, and clears the file. Each attempt expires after two
minutes. Keep the callback URL private.

Generated credentials are saved in ignored `.env.visitors.*` files. Keep these
files for subsequent deployments; the setup script reuses them. Never commit
credentials. A public-endpoint health-check failure preserves the deployed
configuration so that connectivity can be checked separately.

## GitHub configuration

Under **Settings → Secrets and variables → Actions**, configure:

| Type     | Name                  | Value                                            |
| -------- | --------------------- | ------------------------------------------------ |
| Variable | `VISITOR_API_URL`     | The deployed Worker HTTPS origin                 |
| Secret   | `VISITOR_STATS_TOKEN` | The corresponding value in `.env.visitors.local` |

Set **Settings → Pages → Source** to **GitHub Actions**, then run the deployment
workflow. Only visits to `https://zezhouyang.github.io` are recorded. Local previews
are excluded. GitHub Actions requires only the statistics token, not Cloudflare
account credentials.

For a local snapshot refresh:

```sh
npm run visitors:refresh
npm run build:pages
```

Cloudflare and GitHub usage quotas apply. The setup script does not select paid
plans or configure billing.

## Counting and storage

Each IP and user-agent combination counts once per UTC day. This is an approximate
daily unique visit count: shared networks can merge visits, and returning on
another day counts again.

The service stores a daily salted HMAC instead of the raw IP or user-agent.
Deduplication records are removed after three days; aggregate counts remain in
D1 across deployments. City coordinates are rounded to one decimal place. Raw
IP addresses, URLs, names, and email addresses are not stored by the application.
Cloudflare infrastructure processing is subject to its own policies.

Only requests with city information and valid coordinates create map dots.
Unknown origins contribute to the total without a dot. Known crawler user-agents
are excluded. Origin checks and daily deduplication do not fully prevent
intentional automated traffic.

`POST /collect` accepts visits from the configured homepage origin. `GET /stats`
requires a bearer token and returns aggregates only. Individual deduplication
records and credentials are never exported. The browser reads the public snapshot
and does not receive the statistics token.

The GitHub workflow caches the latest snapshot. If a refresh fails, the previous
snapshot and its date remain; without a cache, the repository snapshot is used.
D1 is the authoritative store regardless of snapshot or cache state. Worker
observability is disabled; do not add request/header logging.

## Validation

```sh
npm run visitors:test
npx tsc --noEmit
npx wrangler deploy --dry-run --config analytics/wrangler.jsonc
npm run build:pages
```

Tests use an in-memory SQLite database and the production migration to verify
deduplication, retained totals, unknown origins, authorization, CORS, bot exclusion,
and daily HMAC rotation. Tests do not make external requests.
