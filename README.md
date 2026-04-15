# Fuel Finder SDK

Lightweight Javascript/TypeScript client for the UK Government Fuel Finder endpoints. It wraps the OAuth access-token API for generating and regenerating access tokens.

https://www.fuel-finder.service.gov.uk/

## Installation

```bash
npm install fuel-finder-gov-uk
```

Node.js 18+ is recommended because it provides a native `fetch` implementation.

To register for credentials, visit https://www.fuel-finder.service.gov.uk/.

## Usage

```ts
import { FuelFinderClient } from "fuel-finder-gov-uk";

const client = new FuelFinderClient({
  clientId: process.env.FUEL_FINDER_CLIENT_ID || "",
  clientSecret: process.env.FUEL_FINDER_CLIENT_SECRET || "",
});

async function main() {
  // Eagerly fetch and cache the access token if you don't want lazy fetching:
  const accessToken = await client.getAccessToken();
  console.log("Access token:", accessToken);

  // The client will lazily fetch and refresh the access token as needed.
  const allPrices = await client.getAllPFSFuelPrices();
  console.log("Prices count:", allPrices.length);

  const stationInfo = await client.getPFSInfo();
  console.log("Station count:", stationInfo.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## API surface (FuelFinderClient)

### Constructor (auto-token fetching)

```ts
new FuelFinderClient({
  clientId: string;        // required
  clientSecret: string;    // required
  baseUrl?: string;        // defaults to https://www.fuel-finder.service.gov.uk
  fetch?: typeof fetch;    // override fetch (for tests or custom transport)
  timeoutMs?: number;      // optional request timeout
})
```

### Token handling
- The client lazily calls `generateAccessToken` with your `clientId`/`clientSecret` when needed.
- If a refresh token is available, it will attempt `regenerateAccessToken` when the access token expires.
- If the live API rejects a cached token during a PFS request, the client clears the cache and retries once with a fresh token.
- You can manually fetch and cache the current token up front with `getAccessToken()`.

### Token handling
- `getAccessToken()` — ensures a valid access token is available and returns it

### Data fetchers (all use `Authorization: Bearer <token>` with the managed access token)
- `getAllPFSFuelPrices()` — fetches all fuel prices across all batches
- `getIncrementalPFSFuelPrices(dateTime: string | Date)` — fetches fuel prices updated since the timestamp across all batches; accepts `YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS`, or `Date` (converted to UTC `YYYY-MM-DD HH:MM:SS`)
- `getPFSInfo()` — fetches all station metadata across all batches
- `getIncrementalPFSInfo(dateTime: string | Date)` — fetches station metadata updated since the timestamp across all batches; accepts `YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS`, or `Date` (converted to UTC `YYYY-MM-DD HH:MM:SS`)

## API surface (FuelFinderAuthClient)

### Token generation and refresh
- `generateAccessToken(payload: GenerateAccessTokenRequest)` — exchanges client credentials for an access token
- `regenerateAccessToken(payload: RegenerateAccessTokenRequest)` — exchanges a refresh token for a new access token

## Error handling

Errors throw `FuelFinderApiError` with fields:
- `message` – human-readable summary
- `status` – HTTP status (0 for transport-level failures)
- `details` – parsed response body or underlying error

You can catch and inspect these for richer diagnostics.

## Integration test (live API)

This hits the production Fuel Finder OAuth endpoints (no mocks). With `.env` populated, run:

```bash
npm test
```

Tests use Vitest and will fail fast if `FUEL_FINDER_CLIENT_ID` or `FUEL_FINDER_CLIENT_SECRET` are missing. The live suite runs serially because the API can revoke tokens across overlapping auth flows.

### Environment variables

Environment variables are only required for running the live integration tests. To run the suite, create a `.env` in the project root:

```
FUEL_FINDER_CLIENT_ID=your-client-id
FUEL_FINDER_CLIENT_SECRET=your-client-secret
```

Optional:

```
FUEL_FINDER_ENABLE_NEGATIVE_LIVE_TESTS=1
```

Negative live auth tests are skipped by default to avoid tripping the API's documented rate limits.
