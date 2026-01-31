# Changelog

## 0.3.0

### Breaking Changes
- Updated PFS endpoints to match the new Fuel Finder API response format. `getAllPFSFuelPrices`, `getIncrementalPFSFuelPrices`, `getPFSInfo`, and `getIncrementalPFSInfo` now return plain arrays rather than the previous nested envelope structure.
- PFS endpoints now paginate by `batch-number` and the SDK automatically fetches all batches until completion.
- Fuel price `price` fields are now strings (or `null`) to match the API response.

### Notes
- These changes are required due to upstream Fuel Finder API updates.
