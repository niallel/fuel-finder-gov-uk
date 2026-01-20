export interface GenerateAccessTokenRequest {
  clientId: string;
  clientSecret: string;
}

export interface RegenerateAccessTokenRequest {
  clientId: string;
  refreshToken: string;
}

export interface AccessTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface RefreshAccessTokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface GenerateAccessTokenResponse {
  success: boolean;
  data?: AccessTokenData;
  message?: string;
}

export type RegenerateAccessTokenResponse =
  | {
      success: boolean;
      data?: RefreshAccessTokenData;
      message?: string;
    }
  | RefreshAccessTokenData;

export interface ErrorResponse {
  success?: boolean;
  message?: string;
  statusCode?: number;
  error?: string;
}

export interface FuelFinderAuthClientOptions {
  /**
   * Base URL for the Fuel Finder API.
   * Defaults to the production URL.
   */
  baseUrl?: string;
  /**
   * Custom fetch implementation. Defaults to global fetch (Node 18+).
   */
  fetch?: typeof globalThis.fetch;
  /**
   * Optional timeout in milliseconds for API requests.
   */
  timeoutMs?: number;
}

export interface FuelFinderClientOptions extends FuelFinderAuthClientOptions {
  /**
   * OAuth client ID issued by Fuel Finder.
   */
  clientId: string;
  /**
   * OAuth client secret issued by Fuel Finder.
   */
  clientSecret: string;
}

export interface PFSLocation {
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  country: string | null;
  county: string | null;
  postcode: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface PFSDayOpening {
  open: string | null;
  close: string | null;
  is_24_hours: boolean | null;
}

export interface PFSBankHolidayOpening {
  type: string | null;
  open_time: string | null;
  close_time: string | null;
  is_24_hours: boolean | null;
}

export interface PFSOpeningTimes {
  usual_days?: {
    monday?: PFSDayOpening;
    tuesday?: PFSDayOpening;
    wednesday?: PFSDayOpening;
    thursday?: PFSDayOpening;
    friday?: PFSDayOpening;
    saturday?: PFSDayOpening;
    sunday?: PFSDayOpening;
  };
  bank_holiday?: PFSBankHolidayOpening;
}

// Station metadata returned from the PFS info endpoints.
export interface PFSStationInfo {
  node_id: string;
  mft_organisation_name?: string;
  trading_name?: string;
  brand_name?: string;
  temporary_closure?: boolean | null;
  permanent_closure?: boolean | null;
  permanent_closure_date?: string | null;
  is_motorway_service_station?: boolean | null;
  is_supermarket_service_station?: boolean | null;
  location?: PFSLocation;
  amenities?: string[] | null;
  opening_times?: PFSOpeningTimes;
  public_phone_number?: string | null;
  is_same_trading_and_brand_name?: boolean | null;
  fuel_types?: string[];
}

// Shared API envelope wrapper used by the PFS endpoints.
export interface FuelFinderEnvelope<T> {
  success: boolean;
  data: {
    success: boolean;
    data: T;
    message?: string;
  };
  message?: string;
}

// Price entry for a specific fuel type at a station.
export interface PFSFuelPriceEntry {
  price: number | null;
  fuel_type: string;
  price_last_updated: string | null;
}

// Station entry returned by the fuel-prices endpoint.
export interface PFSFuelPriceStation {
  node_id: string;
  mft_organisation_name?: string;
  public_phone_number?: string | null;
  trading_name?: string;
  fuel_prices: PFSFuelPriceEntry[];
}

export type PFSFuelPricesResponse = FuelFinderEnvelope<PFSFuelPriceStation[]>;

export type PFSInfoResponse = FuelFinderEnvelope<PFSStationInfo[]>;
