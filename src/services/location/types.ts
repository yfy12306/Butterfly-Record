import type * as Location from 'expo-location';

export interface CollectionLocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface CollectionLocationAddress {
  name: string | null;
  streetNumber: string | null;
  street: string | null;
  district: string | null;
  city: string | null;
  subregion: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  isoCountryCode: string | null;
  formattedAddress: string | null;
}

export type CollectionLocationResult =
  | {
      status: 'success';
      coordinates: CollectionLocationCoordinates;
      address: CollectionLocationAddress | null;
      locationText: string | null;
      rawLocation: Location.LocationObject;
    }
  | {
      status: 'permission-denied';
      message: string;
    }
  | {
      status: 'timeout';
      message: string;
    }
  | {
      status: 'unavailable';
      message: string;
    }
  | {
      status: 'error';
      message: string;
      cause?: unknown;
    };

export interface OneShotCollectionLocationOptions {
  timeoutMs?: number;
  locationAccuracy?: Location.LocationAccuracy;
  requestPermission?: boolean;
  getForegroundPermissionsAsync?: typeof Location.getForegroundPermissionsAsync;
  requestForegroundPermissionsAsync?: typeof Location.requestForegroundPermissionsAsync;
  getCurrentPositionAsync?: typeof Location.getCurrentPositionAsync;
  reverseGeocodeAsync?: typeof Location.reverseGeocodeAsync;
  signal?: AbortSignal;
}
