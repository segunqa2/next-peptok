import { toast } from "sonner";
import { User } from "../types";
// Removed demo users import - will use backend API
import { backendStorage } from "./backendStorage";
import LocalStorageService from "./localStorageService";

// OAuth Configuration
const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "demo-google-client-id",
    redirectUri: `${window.location.origin}/auth/callback/google`,
    scope: "openid email profile",
    responseType: "code",
    authUrl: "https://accounts.google.com/oauth/authorize",
  },
  microsoft: {
    clientId:
      import.meta.env.VITE_MICROSOFT_CLIENT_ID || "demo-microsoft-client-id",
    redirectUri: `${window.location.origin}/auth/callback/microsoft`,
    scope: "openid email profile",
    responseType: "code",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  },
};

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  isNewUser?: boolean;
}

// API Configuration for backend authentication
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3001";

class AuthService {
  private currentUser: User | null = null;

  // Initialize auth service
  constructor() {
    this.loadUserFromStorage();
  }

  // Load user from localStorage (demo mode)
  private async loadUserFromStorage() {
    try {
      console.log("🔄 Loading user from localStorage (demo mode)...");

      const user = LocalStorageService.getUser();
      const token = LocalStorageService.getToken();

      if (user && token) {
        this.currentUser = {
          ...user,
          isAuthenticated: true,
        };

        console.log(
          `✅ User loaded from localStorage (demo mode): ${this.currentUser.email} (${this.currentUser.userType})`,
        );
      } else {
        console.log("ℹ️ No valid auth session found in localStorage");
      }
    } catch (error) {
      console.error("❌ Failed to load user from localStorage:", error);
      this.clearAuth();
    }
  }

  // Save user to localStorage (demo mode)
  private async saveUserToStorage(user: User, token: string) {
    try {
      console.log(
        `💾 Saving user to localStorage (demo mode): ${user.email} (${user.userType})`,
      );

      // Store using localStorage service
      LocalStorageService.setUser(user);
      LocalStorageService.setToken(token);

      this.currentUser = user;
      console.log(`✅ User saved successfully to localStorage (demo mode)`);
    } catch (error) {
      console.error("❌ Failed to save user to localStorage:", error);
      throw error;
    }
  }

  // Clear authentication data from backend database
  private async clearAuth() {
    try {
      LocalStorageService.clearAuth();
      this.currentUser = null;
      console.log("🧹 Authentication data cleared from backend database");
    } catch (error) {
      console.error("❌ Failed to clear auth from backend database:", error);
      this.currentUser = null;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Debug utility to check available demo accounts
  getAvailableDemoAccounts(): Array<{ email: string; userType: string }> {
    console.warn("Demo accounts disabled - use backend authentication instead");
    return [];
  }

  // Test specific demo account
  async testDemoLogin(email: string = "demo@platform.com"): Promise<void> {
    console.log("🧪 Testing demo login...");
    console.log("📋 Available accounts:", this.getAvailableDemoAccounts());

    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
    console.log(`🔍 Account lookup for ${email}:`, user);

    if (user) {
      console.log("✅ Demo account found:", {
        id: user.id,
        email: user.email,
        userType: user.userType,
        name: user.name,
      });
    } else {
      console.error(`❌ Demo account ${email} not found!`);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    if (this.currentUser !== null) {
      // Double-check with backend database
      const session = await backendStorage.getUserSession(this.currentUser.id);
      return session !== null;
    }
    return false;
  }

  // Email/Password Login
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log(`🔐 Login attempt for email: ${email}`);

      // Try backend authentication first
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          const user: User = {
            ...data.user,
            isAuthenticated: true,
            token: data.access_token,
          };

          console.log(
            `✅ Backend login successful for "${email}", user type: ${user.userType}`,
          );

          // Save authentication
          await this.saveUserToStorage(user, data.access_token);

          return {
            success: true,
            user,
            token: data.access_token,
          };
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Login failed" }));
          console.log(
            `❌ Backend login failed for "${email}": ${errorData.message}`,
          );

          // Fall back to demo mode
          console.log("🔄 Falling back to demo mode...");
        }
      } catch (error) {
        console.warn("Backend not available, using demo mode:", error);
      }

      // Fallback to demo mode for development/demo purposes
      console.log(
        `🧪 Demo mode login for:`,
        mockUsers.map((u) => ({
          email: u.email,
          id: u.id,
          userType: u.userType,
        })),
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Normalize email for comparison
      const normalizedEmail = email.toLowerCase().trim();
      console.log(`🔄 Normalized email: "${normalizedEmail}"`);

      // Find user with exact email match
      const user = mockUsers.find(
        (u) => u.email.toLowerCase().trim() === normalizedEmail,
      );

      if (!user) {
        console.error(`❌ No user found for email: "${normalizedEmail}"`);
        return {
          success: false,
          error: `No account found with email "${email}". Available demo accounts: ${mockUsers.map((u) => u.email).join(", ")}`,
        };
      }

      // For demo accounts, accept any password with length >= 1
      const isDemoAccount = user.email.includes("demo@");
      const minPasswordLength = isDemoAccount ? 1 : 6;

      if (password.length < minPasswordLength) {
        return {
          success: false,
          error: `Password must be at least ${minPasswordLength} characters long.`,
        };
      }

      // Generate mock token
      const token = `demo_token_${Date.now()}_${user.id}`;
      console.log(
        `✅ Demo login successful for "${email}", user type: ${user.userType}`,
      );

      // Save authentication
      await this.saveUserToStorage(user, token);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      console.error(`💥 Login error for ${email}:`, error);
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    }
  }

  // Email/Password Signup
  async signupWithEmail(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    company?: string;
    role?: string;
    userType: "company_admin" | "coach";
    businessDetails?: {
      companyName: string;
      industry: string;
      employeeCount: number;
      website?: string;
      phone?: string;
    };
  }): Promise<AuthResponse> {
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if user already exists
      const existingUser = mockUsers.find(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase(),
      );

      if (existingUser) {
        return {
          success: false,
          error:
            "An account with this email already exists. Please sign in instead.",
        };
      }

      // Validate password
      if (userData.password.length < 8) {
        return {
          success: false,
          error: "Password must be at least 8 characters long.",
        };
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        firstName: userData.firstName,
        lastName: userData.lastName,
        provider: "email",
        userType: userData.userType,
        isNewUser: true,
        businessDetails: userData.businessDetails,
      };

      // Save business details to backend database for onboarding reuse
      if (userData.businessDetails) {
        await backendStorage.setItem(
          "peptok_business_details",
          userData.businessDetails,
          { userId: newUser.id },
        );
      }

      // Save to mock database
      mockUsers.push(newUser);

      // Generate token
      const token = `mock_token_${Date.now()}_${newUser.id}`;

      // Save authentication
      this.saveUserToStorage(newUser, token);

      return {
        success: true,
        user: newUser,
        token,
        isNewUser: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "Signup failed. Please try again.",
      };
    }
  }

  // Google OAuth Login
  async loginWithGoogle(): Promise<void> {
    try {
      // In a real implementation, you would use Google's OAuth library
      // For demo purposes, we'll simulate the OAuth flow

      const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.google.clientId,
        redirect_uri: OAUTH_CONFIG.google.redirectUri,
        scope: OAUTH_CONFIG.google.scope,
        response_type: OAUTH_CONFIG.google.responseType,
        state: this.generateState(),
      });

      // Store state for validation in backend database
      await backendStorage.setItem("oauth_state", params.get("state") || "", {
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

      // In development, simulate OAuth response
      if (import.meta.env.DEV) {
        this.simulateOAuthResponse("google");
        return;
      }

      // In production, redirect to Google OAuth
      window.location.href = `${OAUTH_CONFIG.google.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error("Google OAuth error:", error);
      toast.error("Failed to connect with Google. Please try again.");
    }
  }

  // Microsoft OAuth Login
  async loginWithMicrosoft(): Promise<void> {
    try {
      const params = new URLSearchParams({
        client_id: OAUTH_CONFIG.microsoft.clientId,
        redirect_uri: OAUTH_CONFIG.microsoft.redirectUri,
        scope: OAUTH_CONFIG.microsoft.scope,
        response_type: OAUTH_CONFIG.microsoft.responseType,
        state: this.generateState(),
      });

      await backendStorage.setItem("oauth_state", params.get("state") || "", {
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      });

      // In development, simulate OAuth response
      if (import.meta.env.DEV) {
        this.simulateOAuthResponse("microsoft");
        return;
      }

      // In production, redirect to Microsoft OAuth
      window.location.href = `${OAUTH_CONFIG.microsoft.authUrl}?${params.toString()}`;
    } catch (error) {
      console.error("Microsoft OAuth error:", error);
      toast.error("Failed to connect with Microsoft. Please try again.");
    }
  }

  // Simulate OAuth response for development
  private async simulateOAuthResponse(provider: "google" | "microsoft") {
    try {
      // Show loading state
      toast.loading(
        `Connecting with ${provider === "google" ? "Google" : "Microsoft"}...`,
      );

      // Simulate OAuth flow delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock OAuth user data
      const oauthUser = {
        google: {
          id: "google_123456",
          email: "user@gmail.com",
          name: "Google User",
          firstName: "Google",
          lastName: "User",
          picture: "https://lh3.googleusercontent.com/a/default-user",
          provider: "google" as const,
        },
        microsoft: {
          id: "microsoft_789012",
          email: "user@outlook.com",
          name: "Microsoft User",
          firstName: "Microsoft",
          lastName: "User",
          picture: "https://graph.microsoft.com/v1.0/me/photo/$value",
          provider: "microsoft" as const,
        },
      };

      const userData = oauthUser[provider];

      // Check if user exists or create new one
      let user = mockUsers.find((u) => u.email === userData.email);
      let isNewUser = false;

      if (!user) {
        // Create new user from OAuth data
        user = {
          ...userData,
          userType: "company_admin", // Default to company admin, can be changed later
          isNewUser: true,
        };
        mockUsers.push(user);
        isNewUser = true;
      }

      // Generate token
      const token = `mock_token_${Date.now()}_${user.id}`;

      // Save authentication
      this.saveUserToStorage(user, token);

      // Clear loading toast
      toast.dismiss();

      // Success message
      toast.success(
        `Successfully signed in with ${provider === "google" ? "Google" : "Microsoft"}!`,
      );

      // Trigger page reload to update UI
      setTimeout(() => {
        if (isNewUser) {
          window.location.href = "/onboarding";
        } else {
          // Route to appropriate dashboard based on user type
          switch (user?.userType) {
            case "platform_admin":
              window.location.href = "/platform-admin";
              break;
            case "coach":
              window.location.href = "/coach/dashboard";
              break;
            case "company_admin":
            default:
              window.location.href = "/dashboard";
              break;
          }
        }
      }, 1000);
    } catch (error) {
      toast.dismiss();
      toast.error(
        `Failed to connect with ${provider === "google" ? "Google" : "Microsoft"}. Please try again.`,
      );
    }
  }

  // Handle OAuth callback (for production)
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string,
  ): Promise<AuthResponse> {
    try {
      // Validate state parameter from backend database
      const storedState = await backendStorage.getItem("oauth_state");
      if (state !== storedState) {
        throw new Error("Invalid state parameter");
      }

      // Clean up state after validation
      await backendStorage.removeItem("oauth_state");

      // In a real app, exchange code for token with your backend
      // const response = await fetch('/api/auth/oauth/callback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ provider, code, state })
      // });

      // For demo, return mock success
      return {
        success: true,
        user: {
          id: `oauth_${Date.now()}`,
          email: "oauth@example.com",
          name: "OAuth User",
          provider: provider as "google" | "microsoft",
          userType: "enterprise",
        },
        token: `oauth_token_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: "OAuth callback failed",
      };
    }
  }

  // Generate random state for OAuth
  private generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // In a real app, you might want to invalidate the token on the server
      // await fetch('/api/auth/logout', { method: 'POST' });

      this.clearAuth();
      toast.success("Successfully signed out");

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local auth even if server call fails
      this.clearAuth();
      window.location.href = "/";
    }
  }

  // Get saved business details for onboarding from backend database
  async getSavedBusinessDetails() {
    try {
      const businessDetails = await backendStorage.getItem(
        "peptok_business_details",
        {
          userId: this.currentUser?.id,
        },
      );
      return businessDetails ? JSON.parse(businessDetails) : null;
    } catch (error) {
      console.error(
        "Failed to load business details from backend database:",
        error,
      );
      return null;
    }
  }

  // Clear saved business details after onboarding from backend database
  async clearSavedBusinessDetails() {
    await backendStorage.removeItem("peptok_business_details", {
      userId: this.currentUser?.id,
    });
  }

  // Password reset (email)
  async resetPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      );

      if (!user) {
        return {
          success: false,
          message: "No account found with this email address.",
        };
      }

      // In a real app, send password reset email
      return {
        success: true,
        message: "Password reset instructions sent to your email.",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to send password reset email. Please try again.",
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export utility functions
export const isAuthenticated = () => authService.isAuthenticated();
export const getCurrentUser = () => authService.getCurrentUser();
export const logout = () => authService.logout();
