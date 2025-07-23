"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { apiClient } from "@/lib/api/factory";
import { ApiClient } from "@/lib/api/client";

interface ApiContextType {
  apiClient: ApiClient;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <ApiContext.Provider value={{ apiClient }}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};