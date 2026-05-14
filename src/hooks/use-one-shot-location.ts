import { useEffect, useRef, useState } from 'react';

import { reverseGeocodeCollectionLocationOnce, reverseGeocodeCollectionLocationWithRetry } from '../services/location';
import type {
  CollectionLocationResult,
  OneShotCollectionLocationOptions,
} from '../services/location';

type LocationState = {
  loading: boolean;
  result: CollectionLocationResult | null;
  error: string | null;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}

export function useOneShotLocation(defaultOptions: OneShotCollectionLocationOptions = {}) {
  const mountedRef = useRef(true);
  const [state, setState] = useState<LocationState>({
    loading: false,
    result: null,
    error: null,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function reset(): void {
    setState({
      loading: false,
      result: null,
      error: null,
    });
  }

  async function resolveOnce(options: OneShotCollectionLocationOptions = {}): Promise<CollectionLocationResult> {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await reverseGeocodeCollectionLocationOnce({
        ...defaultOptions,
        ...options,
      });
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          result,
          error: result.status === 'error' ? result.message : null,
        }));
      }
      return result;
    } catch (error) {
      const failure: CollectionLocationResult = {
        status: 'error',
        message: toErrorMessage(error),
        cause: error,
      };
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          result: failure,
          error: failure.message,
        }));
      }
      return failure;
    }
  }

  async function resolveWithRetry(
    options: OneShotCollectionLocationOptions & { retries?: number; retryDelayMs?: number } = {},
  ): Promise<CollectionLocationResult> {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await reverseGeocodeCollectionLocationWithRetry({
        ...defaultOptions,
        ...options,
      });
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          result,
          error: result.status === 'error' ? result.message : null,
        }));
      }
      return result;
    } catch (error) {
      const failure: CollectionLocationResult = {
        status: 'error',
        message: toErrorMessage(error),
        cause: error,
      };
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          result: failure,
          error: failure.message,
        }));
      }
      return failure;
    }
  }

  return {
    loading: state.loading,
    result: state.result,
    error: state.error,
    resolveOnce,
    resolveWithRetry,
    reset,
  };
}
