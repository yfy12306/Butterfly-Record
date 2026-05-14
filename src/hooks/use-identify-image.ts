import { useEffect, useRef, useState } from 'react';

import { identifyButterflyImage, identifyButterflyImageWithRetry } from '../services/ai';
import type {
  ButterflyIdentifyBatchResult,
  ButterflyIdentifyImageInput,
  ButterflyIdentifyOptions,
  IdentifyResponse,
} from '../services/ai';

type IdentifyState = {
  loading: boolean;
  result: IdentifyResponse | null;
  batchResult: ButterflyIdentifyBatchResult | null;
  error: string | null;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}

export function useIdentifyImage(defaultOptions: ButterflyIdentifyOptions = {}) {
  const mountedRef = useRef(true);
  const [state, setState] = useState<IdentifyState>({
    loading: false,
    result: null,
    batchResult: null,
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
      batchResult: null,
      error: null,
    });
  }

  async function identify(input: ButterflyIdentifyImageInput, options: ButterflyIdentifyOptions = {}): Promise<IdentifyResponse> {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await identifyButterflyImage(input, {
        ...defaultOptions,
        ...options,
      });
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          result,
          error: null,
        }));
      }
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          error: toErrorMessage(error),
        }));
      }
      throw error;
    }
  }

  async function identifyWithRetry(
    input: ButterflyIdentifyImageInput,
    options: ButterflyIdentifyOptions = {},
  ): Promise<ButterflyIdentifyBatchResult> {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const result = await identifyButterflyImageWithRetry(input, {
        ...defaultOptions,
        ...options,
      });
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          batchResult: result,
          result: result.response ?? null,
          error: result.ok ? null : result.error ?? null,
        }));
      }
      return result;
    } catch (error) {
      const failure: ButterflyIdentifyBatchResult = {
        ok: false,
        attempts: 1,
        error: toErrorMessage(error),
      };
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          batchResult: failure,
          error: failure.error ?? null,
        }));
      }
      return failure;
    }
  }

  return {
    loading: state.loading,
    result: state.result,
    batchResult: state.batchResult,
    error: state.error,
    identify,
    identifyWithRetry,
    reset,
  };
}
