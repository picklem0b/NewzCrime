/**
 * Runs an async loader and reports the four states the app renders.
 *
 * Every request is given an `AbortSignal`, and a result that arrives after the
 * screen changed or unmounted is discarded, so a slow response cannot overwrite
 * newer state.
 *
 * `enabled: false` skips the request entirely and reports `idle`. Screens read
 * their ids from route parameters, and a route can render once before the
 * parameter is available; without this the app would request `/v1/items/` and
 * get a 404 for a screen that is simply not ready yet.
 */

import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';

import type { AsyncState } from '@/types';

export interface UseAsyncOptions {
  /** Skip the request while false. Defaults to true. */
  enabled?: boolean;
}

export interface UseAsyncResult<TData> {
  state: AsyncState<TData>;
  /** Re-runs the loader, for an error state's retry action. */
  reload: () => void;
}

export function useAsync<TData>(
  loader: (signal: AbortSignal) => Promise<TData>,
  deps: DependencyList,
  options: UseAsyncOptions = {}
): UseAsyncResult<TData> {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<AsyncState<TData>>(
    enabled ? { status: 'loading' } : { status: 'idle' }
  );
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return undefined;
    }

    const controller = new AbortController();
    let isActive = true;

    setState({ status: 'loading' });

    loader(controller.signal)
      .then((data) => {
        if (isActive) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (!isActive || controller.signal.aborted) return;
        setState({
          status: 'error',
          error:
            error instanceof Error ? error.message : 'Something went wrong',
        });
      });

    return () => {
      isActive = false;
      controller.abort();
    };
    // `deps` is the caller's dependency list; `nonce` forces a manual reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { state, reload };
}
