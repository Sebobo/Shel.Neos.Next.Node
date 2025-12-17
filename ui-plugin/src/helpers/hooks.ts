import { useRef, useEffect, useCallback } from 'react';

/**
 * A hook that returns a memoized callback which always has the latest version of the handler.
 * This prevents triggering effects or re-renders when the handler changes.
 */
export function useEventCallback<T, K>(handler?: (value: T, event?: K) => void): (value: T, event?: K) => void {
    const callbackRef = useRef(handler);

    useEffect(() => {
        callbackRef.current = handler;
    });

    return useCallback((value: T, event: K) => callbackRef.current && callbackRef.current(value, event), []);
}
