import { useEffect, useRef, useState } from 'react';

import { aiSettingsStore, normalizeAiSettingsInput, testAiSettingsConnection } from '../services/settings';
import type { AiConnectionTestResult, AiSettings, AiSettingsInput, AiSettingsValidationIssue } from '../services/settings';

type AiSettingsLoadState = {
  settings: AiSettings;
  loading: boolean;
  saving: boolean;
  testing: boolean;
  issues: AiSettingsValidationIssue[];
  error: string | null;
  lastConnectionTest: AiConnectionTestResult | null;
};

const EMPTY_SETTINGS: AiSettings = {
  apiUrl: '',
  model: '',
  apiKey: '',
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected error.';
}

export function useAiSettings() {
  const mountedRef = useRef(true);
  const [state, setState] = useState<AiSettingsLoadState>({
    settings: EMPTY_SETTINGS,
    loading: true,
    saving: false,
    testing: false,
    issues: [],
    error: null,
    lastConnectionTest: null,
  });

  useEffect(() => {
    mountedRef.current = true;

    void (async () => {
      try {
        const settings = await aiSettingsStore.load();
        if (!mountedRef.current) {
          return;
        }
        setState((current) => ({
          ...current,
          settings,
          loading: false,
          issues: [],
          error: null,
        }));
      } catch (error) {
        if (!mountedRef.current) {
          return;
        }
        setState((current) => ({
          ...current,
          loading: false,
          error: toErrorMessage(error),
        }));
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function reload(): Promise<void> {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const settings = await aiSettingsStore.load();
      if (!mountedRef.current) {
        return;
      }
      setState((current) => ({
        ...current,
        settings,
        loading: false,
        error: null,
      }));
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      setState((current) => ({
        ...current,
        loading: false,
        error: toErrorMessage(error),
      }));
    }
  }

  async function save(nextSettings: AiSettingsInput): Promise<AiSettings> {
    setState((current) => ({ ...current, saving: true, error: null }));
    try {
      const merged = normalizeAiSettingsInput({
        apiUrl: nextSettings.apiUrl ?? state.settings.apiUrl,
        model: nextSettings.model ?? state.settings.model,
        apiKey: nextSettings.apiKey ?? state.settings.apiKey,
      });
      const saved = await aiSettingsStore.save(merged);
      if (!mountedRef.current) {
        return saved;
      }
      setState((current) => ({
        ...current,
        settings: saved,
        saving: false,
        error: null,
      }));
      return saved;
    } catch (error) {
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          saving: false,
          error: toErrorMessage(error),
        }));
      }
      throw error;
    }
  }

  async function clear(): Promise<void> {
    setState((current) => ({ ...current, saving: true, error: null }));
    try {
      await aiSettingsStore.clear();
      if (!mountedRef.current) {
        return;
      }
      setState((current) => ({
        ...current,
        settings: EMPTY_SETTINGS,
        saving: false,
        issues: [],
        error: null,
        lastConnectionTest: null,
      }));
    } catch (error) {
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          saving: false,
          error: toErrorMessage(error),
        }));
      }
      throw error;
    }
  }

  async function testConnection(): Promise<AiConnectionTestResult> {
    setState((current) => ({ ...current, testing: true, error: null }));
    try {
      const result = await testAiSettingsConnection({ settings: state.settings });
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          testing: false,
          issues: result.ok ? [] : current.issues,
          lastConnectionTest: result,
          error: result.ok ? null : result.message,
        }));
      }
      return result;
    } catch (error) {
      const failure: AiConnectionTestResult = {
        ok: false,
        message: toErrorMessage(error),
        retried: 0,
      };
      if (mountedRef.current) {
        setState((current) => ({
          ...current,
          testing: false,
          lastConnectionTest: failure,
          error: failure.message,
        }));
      }
      return failure;
    }
  }

  return {
    settings: state.settings,
    loading: state.loading,
    saving: state.saving,
    testing: state.testing,
    issues: state.issues,
    error: state.error,
    lastConnectionTest: state.lastConnectionTest,
    reload,
    save,
    clear,
    testConnection,
  };
}

