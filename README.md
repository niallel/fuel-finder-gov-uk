# Fuel Finder SDK (TypeScript)

Lightweight TypeScript client for the UK Government Fuel Finder endpoints. It wraps the OAuth access-token API for generating and regenerating access tokens.

https://www.register-fuel-finder-scheme.service.gov.uk

## Installation

```bash
npm install fuel-finder-gov-uk
```

Node.js 18+ is recommended because it provides a native `fetch` implementation.

To register for credentials, visit https://www.register-fuel-finder-scheme.service.gov.uk.

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
  console.log("Prices count:", allPrices.data.data.length);

  const stationInfo = await client.getPFSInfo();
  console.log("Station count:", stationInfo.data.data.length);
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
  baseUrl?: string;        // defaults to https://www.register-fuel-finder-scheme.service.gov.uk
  fetch?: typeof fetch;    // override fetch (for tests or custom transport)
  timeoutMs?: number;      // optional request timeout
})
```

### Token handling
- The client lazily calls `generateAccessToken` with your `clientId`/`clientSecret` when needed.
- If a refresh token is available, it will attempt `regenerateAccessToken` when the access token expires.
- You can manually fetch and cache the current token up front with `getAccessToken()`.

### Data fetchers (all use `Authorization: Bearer <token>` with the managed access token)
- `getAllPFSFuelPrices()`
- `getIncrementalPFSFuelPrices(dateTime: string)` — date string (e.g., `2025-09-05`)
- `getPFSInfo()`
- `getIncrementalPFSInfo(dateTime: string)`

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

Tests use Vitest and will fail fast if `FUEL_FINDER_CLIENT_ID` or `FUEL_FINDER_CLIENT_SECRET` are missing.

### Environment variables

Environment variables are only required for running the live integration tests. To run the suite, create a `.env` in the project root:

```
FUEL_FINDER_CLIENT_ID=your-client-id
FUEL_FINDER_CLIENT_SECRET=your-client-secret
```
