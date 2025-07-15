import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { authService } from "@/services/authService";
import { setCurrentUser } from "@/services/apiService";
import { analytics } from "@/services/analytics";
import LocalStorageService from "@/services/localStorageService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

// Create AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Use normal React hooks - the previous safety checks were causing issues
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state with comprehensive persistence
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Get user from localStorage service
        const currentUser =
          LocalStorageService.getUser() || authService.getCurrentUser();
        setUser(currentUser);
        setCurrentUser(currentUser);

        if (currentUser) {
          analytics.setUser(currentUser.id, currentUser.userType, {
            email: currentUser.email,
            name: currentUser.name,
          });

          // Ensure user data is persisted in localStorage
          LocalStorageService.setUser(currentUser);

          console.log("✅ User session restored:", {
            id: currentUser.id,
            email: currentUser.email,
            userType: currentUser.userType,
            companyId: currentUser.companyId,
          });
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.loginWithEmail(email, password);
      if (response.success && response.user) {
        setUser(response.user);
        setCurrentUser(response.user);

        // Persist user data across sessions
        LocalStorageService.setUser(response.user);
        if (response.token) {
          LocalStorageService.setToken(response.token);
        }

        analytics.track("user_login", {
          userType: response.user.userType,
          loginMethod: "email",
        });

        console.log("✅ User logged in and data persisted:", {
          id: response.user.id,
          email: response.user.email,
          userType: response.user.userType,
        });

        return { success: true };
      } else {
        return { success: false, error: response.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear all persisted data
      LocalStorageService.clearAuth();

      await authService.logout();
      setUser(null);
      setCurrentUser(null);

      console.log("✅ User logged out and all data cleared");
    } catch (error) {
      console.error("Logout error:", error);
      // Ensure cleanup even if auth service fails
      LocalStorageService.clearAuth();
      setUser(null);
      setCurrentUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    setCurrentUser(updatedUser);

    // Persist updated user data
    LocalStorageService.setUser(updatedUser);

    console.log("✅ User data updated and persisted:", {
      id: updatedUser.id,
      email: updatedUser.email,
      userType: updatedUser.userType,
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
