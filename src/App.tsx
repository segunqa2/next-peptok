import * as React from "react";
import { useState, useEffect, useContext, createContext } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FullApp } from "@/components/core/FullApp";
import { AuthProvider } from "@/contexts/AuthContext";
import LocalStorageService from "@/services/localStorageService";
// Demo data seeder removed - using backend API only
// Removed unused safety wrapper imports
// Alternative implementations available but not used:
// import { ReactReadyWrapper } from "@/components/core/ReactReadyWrapper"; // Using UltraRobustWrapper instead
// import { SafeAuthProvider } from "@/contexts/SafeAuthProvider";
// import FinalWorkingApp from "@/components/core/FinalWorkingApp";
// import { StandaloneApp } from "@/components/core/StandaloneApp";
// import { MinimalApp } from "@/components/core/MinimalApp";

// Debug utilities in development
if (import.meta.env.DEV) {
  import("./utils/debug");
  import("./utils/emailDemo");
}

// Removed: localStorage elimination service (deleted)

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FullApp />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
