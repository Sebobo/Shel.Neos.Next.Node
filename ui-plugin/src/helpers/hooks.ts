import { useCallback, useEffect, useRef } from 'react';

/**
 * A hook that returns a memoized callback which always has the latest version of the handler.
 * This prevents triggering effects or re-renders when the handler changes.
 */
const useEventCallback = <T, K>(handler?: (value: T, event?: K) => void): (value: T, event?: K) => void => {
    const callbackRef = useRef(handler);

    useEffect(() => {
        callbackRef.current = handler;
    });

    return useCallback((value: T, event: K) => callbackRef.current && callbackRef.current(value, event), []);
};

export { useEventCallback };
