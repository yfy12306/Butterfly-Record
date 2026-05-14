// @ts-nocheck

import { formatCollectionLocationLabel, reverseGeocodeCollectionLocationOnce } from '../reverse-geocode';

describe('one-shot location resolver', () => {
  test('formats address labels', () => {
    expect(
      formatCollectionLocationLabel({
        name: 'Xishuangbanna',
        streetNumber: null,
        street: 'Rainforest Road',
        district: 'Jinghong',
        city: 'Xishuangbanna',
        subregion: null,
        region: 'Yunnan',
        country: 'China',
        postalCode: null,
        isoCountryCode: 'CN',
        formattedAddress: null,
      }),
    ).toBe('Xishuangbanna, Rainforest Road, Jinghong, Xishuangbanna, Yunnan, China');
  });

  test('resolves a single location and reverse geocode result', async () => {
    const requestForegroundPermissionsAsync = jest.fn(async () => ({ granted: true }));
    const getCurrentPositionAsync = jest.fn(async () => ({
      coords: {
        latitude: 24.5,
        longitude: 121.2,
        accuracy: 12,
      },
    }));
    const reverseGeocodeAsync = jest.fn(async () => [
      {
        name: 'Trail',
        streetNumber: '12',
        street: 'Butterfly Road',
        district: 'District',
        city: 'City',
        subregion: null,
        region: 'Province',
        country: 'Country',
        postalCode: '12345',
        isoCountryCode: 'CN',
        formattedAddress: null,
      },
    ]);

    const result = await reverseGeocodeCollectionLocationOnce({
      timeoutMs: 1_000,
      requestForegroundPermissionsAsync,
      getCurrentPositionAsync,
      reverseGeocodeAsync,
    });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.coordinates).toEqual({
        latitude: 24.5,
        longitude: 121.2,
        accuracy: 12,
      });
      expect(result.locationText).toContain('Butterfly Road');
    }
    expect(requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(getCurrentPositionAsync).toHaveBeenCalledTimes(1);
    expect(reverseGeocodeAsync).toHaveBeenCalledTimes(1);
  });

  test('returns permission denied when the user refuses access', async () => {
    const requestForegroundPermissionsAsync = jest.fn(async () => ({ granted: false }));

    const result = await reverseGeocodeCollectionLocationOnce({
      timeoutMs: 1_000,
      requestForegroundPermissionsAsync,
      getCurrentPositionAsync: jest.fn(),
      reverseGeocodeAsync: jest.fn(),
    });

    expect(result.status).toBe('permission-denied');
  });
});

