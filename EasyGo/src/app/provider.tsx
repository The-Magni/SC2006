'use client'

import React, { createContext, useContext, useState } from 'react';
import { ItineraryFilter } from '@/components/app-sidebar-routes';

interface SelectedItineraryContextValue {
  itinerary: ItineraryFilter | null;
  setItinerary: (i: ItineraryFilter | null) => void;
}

const SelectedItineraryContext = createContext<SelectedItineraryContextValue | undefined>(undefined);

export const SelectedItineraryProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [itinerary, setItinerary] = useState<ItineraryFilter | null>(null);

  return (
    <SelectedItineraryContext.Provider value={{ itinerary, setItinerary }}>
      {children}
    </SelectedItineraryContext.Provider>
  );
};

export const useSelectedItinerary = () => {
  const context = useContext(SelectedItineraryContext);
  if (!context) throw new Error('useSelectedItinerary must be used within SelectedItineraryProvider');
  return context;
};
