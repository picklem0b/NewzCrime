/**
 * Runs an async loader and reports the four states the app renders.
 *
 * Every request is given an `AbortSignal`, and a result that arrives after the
 * screen changed or unmounted is discarded, so a slow response cannot overwrite
 * newer state.
 */

import { useCallback, useEffect, useState } from 'react';
import type { DependencyList } from 'react';

import type { AsyncState } from '@/types';

export interface UseAsyncResult<TData> {
  state: AsyncState<TData>;
  reload: () => void;
}

export function useAsync<TData>(
  loader: (signal: AbortSignal) => Promise<TData>,
  deps: DependencyList
): UseAsyncResult<TData> {
  const [state, setState] = useState<AsyncState<TData>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
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
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { state, reload };
}
