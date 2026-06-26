import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  DemoUserContext,
  type DemoUserContextValue,
} from '../../shared/hooks/demo-user-context';

const STORAGE_KEY = 'flow-review:selected-user-id';

function readStoredUserId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface DemoUserProviderProps {
  children: ReactNode;
}

export function DemoUserProvider({ children }: DemoUserProviderProps) {
  const [selectedUserId, setSelectedUserIdState] = useState<string | null>(readStoredUserId);

  const setSelectedUserId = useCallback((userId: string | null) => {
    setSelectedUserIdState(userId);
    try {
      if (userId) {
        window.localStorage.setItem(STORAGE_KEY, userId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures (e.g. private mode); state still updates.
    }
  }, []);

  const value = useMemo<DemoUserContextValue>(
    () => ({ selectedUserId, setSelectedUserId }),
    [selectedUserId, setSelectedUserId],
  );

  return <DemoUserContext.Provider value={value}>{children}</DemoUserContext.Provider>;
}
