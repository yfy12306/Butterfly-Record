import * as Location from 'expo-location';

import type {
  CollectionLocationAddress,
  CollectionLocationResult,
  OneShotCollectionLocationOptions,
} from './types';

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatAddressParts(address: CollectionLocationAddress): string[] {
  const toStrings = (parts: Array<string | null>): string[] => parts.filter((part): part is string => Boolean(part));
  const streetLine = toStrings([address.streetNumber, address.street]).join(' ').trim();
  const countryLine = toStrings([address.country, address.postalCode]).join(' ').trim();

  return [
    address.name,
    streetLine || null,
    ...toStrings([address.district, address.city, address.region]),
    countryLine || null,
  ].filter((part): part is string => Boolean(part));
}

export function formatCollectionLocationLabel(address: CollectionLocationAddress | null): string | null {
  if (!address) {
    return null;
  }

  if (address.formattedAddress) {
    return address.formattedAddress.trim() || null;
  }

  const parts = formatAddressParts(address);
  return parts.length > 0 ? parts.join(', ') : null;
}

function mapAddress(address: Location.LocationGeocodedAddress): CollectionLocationAddress {
  return {
    name: address.name ?? null,
    streetNumber: address.streetNumber ?? null,
    street: address.street ?? null,
    district: address.district ?? null,
    city: address.city ?? null,
    subregion: address.subregion ?? null,
    region: address.region ?? null,
    country: address.country ?? null,
    postalCode: address.postalCode ?? null,
    isoCountryCode: address.isoCountryCode ?? null,
    formattedAddress: address.formattedAddress ?? null,
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) {
    throw signal.reason ?? createAbortError('Request aborted.');
  }

  return await new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(createAbortError('Location request timed out.'));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(signal?.reason ?? createAbortError('Request aborted.'));
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
        reject(error);
      });
  });
}

async function requestForegroundPermission(
  getPermissionAsync: typeof Location.getForegroundPermissionsAsync,
  requestPermissionAsync: typeof Location.requestForegroundPermissionsAsync,
): Promise<boolean> {
  try {
    const current = await getPermissionAsync();
    if (current.granted) {
      return true;
    }
  } catch {
    // Fall back to requesting permission directly when the current permission
    // status cannot be determined in the current environment.
  }

  const requested = await requestPermissionAsync();
  return requested.granted;
}

export async function reverseGeocodeCollectionLocationOnce(
  options: OneShotCollectionLocationOptions = {},
): Promise<CollectionLocationResult> {
  const timeoutMs = options.timeoutMs ?? 20_000;
  const locationAccuracy = options.locationAccuracy ?? Location.LocationAccuracy.Highest;
  const getForegroundPermissionsAsync =
    options.getForegroundPermissionsAsync ?? Location.getForegroundPermissionsAsync;
  const requestPermissionAsync =
    options.requestForegroundPermissionsAsync ?? Location.requestForegroundPermissionsAsync;
  const getCurrentPositionAsync = options.getCurrentPositionAsync ?? Location.getCurrentPositionAsync;
  const reverseGeocodeAsync = options.reverseGeocodeAsync ?? Location.reverseGeocodeAsync;

  try {
    const granted = options.requestPermission === false
      ? (await getForegroundPermissionsAsync()).granted
      : await requestForegroundPermission(getForegroundPermissionsAsync, requestPermissionAsync);
    if (!granted) {
      return {
        status: 'permission-denied',
        message: 'Location permission was not granted.',
      };
    }

    const rawLocation = await withTimeout(
      getCurrentPositionAsync({
        accuracy: locationAccuracy,
        mayShowUserSettingsDialog: true,
      }),
      timeoutMs,
      options.signal,
    );

    let address: CollectionLocationAddress | null = null;
    try {
      const geocoded = await withTimeout(
        reverseGeocodeAsync({
          latitude: rawLocation.coords.latitude,
          longitude: rawLocation.coords.longitude,
        }),
        timeoutMs,
        options.signal,
      );
      address = geocoded[0] ? mapAddress(geocoded[0]) : null;
    } catch {
      address = null;
    }

    return {
      status: 'success',
      coordinates: {
        latitude: rawLocation.coords.latitude,
        longitude: rawLocation.coords.longitude,
        accuracy: typeof rawLocation.coords.accuracy === 'number' ? rawLocation.coords.accuracy : null,
      },
      address,
      locationText: formatCollectionLocationLabel(address),
      rawLocation,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'timeout',
        message: error.message,
      };
    }

    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unable to determine location.',
      cause: error,
    };
  }
}

export async function reverseGeocodeCollectionLocationWithRetry(
  options: OneShotCollectionLocationOptions & { retries?: number; retryDelayMs?: number } = {},
): Promise<CollectionLocationResult> {
  const retries = options.retries ?? 0;
  const retryDelayMs = options.retryDelayMs ?? 250;
  let lastResult: CollectionLocationResult = {
    status: 'error',
    message: 'Unable to determine location.',
  };

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const result = await reverseGeocodeCollectionLocationOnce(options);
    lastResult = result;

    if (result.status === 'success' || result.status === 'permission-denied') {
      return result;
    }

    if (attempt < retries && result.status !== 'timeout') {
      await delay(retryDelayMs * (attempt + 1));
    }
  }

  return lastResult;
}
