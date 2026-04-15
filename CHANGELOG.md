# Changelog

## 0.4.0

### Breaking Changes
- Updated PFS response types to match the live Fuel Finder API. Fuel price `price` fields are now numbers (or `null`) rather than strings, and PFS `location.latitude` / `location.longitude` are now numbers (or `null`).

### Changes
- Added `price_change_effective_timestamp` to fuel price entries.
- Incremental PFS fetchers now accept `YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS`, or `Date` inputs.
- Improved token handling for live API instability by retrying once with a fresh token when a cached token is rejected as revoked or expired.
- PFS pagination now stops cleanly when the API reports that the next batch is unavailable.
- Live integration tests now run serially with fresh clients per test, and negative live auth tests are opt-in to avoid upstream rate limiting.

### Maintenance
- Updated the TypeScript configuration to use Node16 module resolution for TypeScript 6 compatibility.

## 0.3.0

### Breaking Changes
- Updated PFS endpoints to match the new Fuel Finder API response format. `getAllPFSFuelPrices`, `getIncrementalPFSFuelPrices`, `getPFSInfo`, and `getIncrementalPFSInfo` now return plain arrays rather than the previous nested envelope structure.
- PFS endpoints now paginate by `batch-number` and the SDK automatically fetches all batches until completion.
- Fuel price `price` fields are now strings (or `null`) to match the API response.

### Notes
- These changes are required due to upstream Fuel Finder API updates.
