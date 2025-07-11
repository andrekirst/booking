"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { apiClient, ApiClient } from "@/lib/api/client";

const ApiContext = createContext<ApiClient | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiClient => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};