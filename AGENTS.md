# AGENTS.md

This repo is a TypeScript SDK for the UK Government Fuel Finder API. Use this file as the single source of truth for how to work in this codebase.

## Purpose
- Provide a lightweight, dependency-free client for the Fuel Finder OAuth endpoints and PFS data endpoints.
- Expose a small public API surface with strong typing and predictable error handling.

## Repo layout
- `src/client.ts` — main implementation: `FuelFinderAuthClient` and `FuelFinderClient`.
- `src/types.ts` — request/response and domain types.
- `src/errors.ts` — `FuelFinderApiError`.
- `src/index.ts` — public exports.
- `tests/` — Vitest integration tests hitting the live API.
- `dist/` — compiled output (do not edit by hand).

## Runtime requirements
- Node.js 18+ (relies on built-in `fetch`).
- No runtime dependencies.

## Public API (exports)
- `FuelFinderAuthClient` — OAuth-only client
  - `generateAccessToken(payload)` -> `AccessTokenData`
  - `regenerateAccessToken(payload)` -> `RefreshAccessTokenData`
- `FuelFinderClient` — token-managed client for PFS endpoints
  - `getAccessToken()`
  - `getAllPFSFuelPrices()`
  - `getIncrementalPFSFuelPrices(dateTime)`
  - `getPFSInfo()`
  - `getIncrementalPFSInfo(dateTime)`
- `FuelFinderApiError` and all types from `src/types.ts`.

## API behavior and invariants
- Base URL defaults to `https://www.register-fuel-finder-scheme.service.gov.uk`.
- Trailing slashes are stripped from `baseUrl` once and then used consistently.
- OAuth requests are JSON `POST` with snake_case fields required by the API.
- PFS requests are JSON `GET` and use `Authorization: <tokenType> <accessToken>`.
- `FuelFinderClient` caches tokens in memory and refreshes early with a 5s buffer.
- Refresh flow:
  - If a refresh token is cached, try `regenerateAccessToken`.
  - On refresh failure, fall back to `generateAccessToken`.
- Incremental endpoints require `YYYY-MM-DD HH:MM:SS` in UTC; `Date` inputs are normalized to that format.

## Error handling
- All API errors throw `FuelFinderApiError` with:
  - `message` (human-readable)
  - `status` (HTTP status or 0 for transport errors)
  - `details` (parsed response or underlying error)
- Timeouts use `AbortController`.
- Timeout status for OAuth POST is 408 with message `Request timed out after <ms>ms.`.
- Timeout status for PFS GET is 408 with message `Request timed out.`.

## Build and test
- Build: `npm run build:only` (tsc to `dist/`).
- Lint: `npm run lint` (tsc typecheck).
- Tests: `npm test` (build + Vitest).
- Integration tests are live API calls; no mocks.
- `.env` required for tests:
  - `FUEL_FINDER_CLIENT_ID`
  - `FUEL_FINDER_CLIENT_SECRET`
- Tests read from `tests/setup-env.ts` and will throw if credentials are missing.

## Development guidelines
- Keep TypeScript strict; do not relax `tsconfig.json`.
- Preserve API compatibility: avoid breaking changes to public types or exports.
- When adding/altering endpoints, update:
  - `src/client.ts` (behavior)
  - `src/types.ts` (types)
  - `src/index.ts` (exports)
  - `README.md` (usage and API surface)
- Do not edit generated files in `dist/`; run `npm run build:only` instead.
- Prefer small, explicit helpers rather than introducing new dependencies.

## Suggested verification
- Run `npm run lint` for typecheck-only changes.
- Run `npm test` when touching OAuth logic, token handling, or endpoint paths.
