"use client";

import * as React from "react";

interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProvider: string;
  setSelectedProvider: (provider: string) => void;
}

const SearchContext = React.createContext<SearchContextValue>({
  searchQuery: "",
  setSearchQuery: () => {},
  selectedProvider: "",
  setSelectedProvider: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState("");

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        selectedProvider,
        setSelectedProvider,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return React.useContext(SearchContext);
}
