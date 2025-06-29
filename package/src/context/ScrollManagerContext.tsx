import React, { createContext, useContext, ReactNode } from 'react';

interface ScrollManagerContextValue {
  gotoSection: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;
}

const ScrollManagerContext = createContext<ScrollManagerContextValue | undefined>(undefined);

export const ScrollManagerProvider: React.FC<{ 
  children: ReactNode; 
  value: ScrollManagerContextValue 
}> = ({ children, value }) => {
  return (
    <ScrollManagerContext.Provider value={value}>
      {children}
    </ScrollManagerContext.Provider>
  );
};

export const useScrollManagerActions = (): ScrollManagerContextValue => {
  const context = useContext(ScrollManagerContext);
  
  if (context === undefined) {
    throw new Error('useScrollManagerActions must be used within a ScrollManagerProvider');
  }
  
  return context;
};