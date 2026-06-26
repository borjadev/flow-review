import { createContext, useContext } from 'react';

export interface DemoUserContextValue {
  /** Currently selected demo user id, or null when none is selected yet. */
  selectedUserId: string | null;
  setSelectedUserId: (userId: string | null) => void;
}

export const DemoUserContext = createContext<DemoUserContextValue | undefined>(undefined);

export function useDemoUser(): DemoUserContextValue {
  const context = useContext(DemoUserContext);
  if (context === undefined) {
    throw new Error('useDemoUser must be used within a DemoUserProvider');
  }
  return context;
}
