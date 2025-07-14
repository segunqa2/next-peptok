import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface SafeQueryProviderProps {
  children: React.ReactNode;
  client: QueryClient;
}

export const SafeQueryProvider: React.FC<SafeQueryProviderProps> = ({
  children,
  client,
}) => {
  const [isQueryReady, setIsQueryReady] = useState(false);

  useEffect(() => {
    // Ensure React is ready before initializing QueryClient
    const initializeQuery = () => {
      try {
        // Verify React hooks are available
        if (React.useState && React.useEffect && React.useContext) {
          setIsQueryReady(true);
        } else {
          setTimeout(initializeQuery, 50);
        }
      } catch (error) {
        setTimeout(initializeQuery, 50);
      }
    };

    const timer = setTimeout(initializeQuery, 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isQueryReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
