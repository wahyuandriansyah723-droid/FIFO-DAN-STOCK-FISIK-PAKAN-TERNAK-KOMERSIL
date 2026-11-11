import { useState, useCallback, useEffect } from 'react';

export function useUndoRedo<T>(initialState: T, maxHistory: number = 30) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialState);
  const [future, setFuture] = useState<T[]>([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const setState = useCallback(
    (newStateOrFn: T | ((prev: T) => T)) => {
      setPresent((currentPresent) => {
        const computedState =
          typeof newStateOrFn === 'function'
            ? (newStateOrFn as (prev: T) => T)(currentPresent)
            : newStateOrFn;

        // Skip pushing to history if state didn't change
        if (JSON.stringify(currentPresent) === JSON.stringify(computedState)) {
          return currentPresent;
        }

        setPast((prevPast) => {
          const updated = [...prevPast, currentPresent];
          if (updated.length > maxHistory) {
            return updated.slice(updated.length - maxHistory);
          }
          return updated;
        });
        setFuture([]);
        return computedState;
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    if (!canUndo) return;

    setPast((prevPast) => {
      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, prevPast.length - 1);

      setFuture((prevFuture) => [present, ...prevFuture]);
      setPresent(previous);

      return newPast;
    });
  }, [canUndo, present]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    setFuture((prevFuture) => {
      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prevPast) => [...prevPast, present]);
      setPresent(next);

      return newFuture;
    });
  }, [canRedo, present]);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount: past.length,
    futureCount: future.length,
  };
}
