/**
 * Authentication Context for LINC Frontend
 * Handles cross-domain authentication between Vercel (frontend) and Render (backend)
 * 
 * Security Strategy:
 * - Access tokens stored in memory (most secure)
 * - Refresh tokens in httpOnly cookies with SameSite=None for cross-domain
 * - Automatic token refresh
 * - Proper logout and session management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS, setAuthToken } from '../config/api';

// Types
interface User {
  id: string;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
  });

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      const refreshInterval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000); // Refresh every 14 minutes
      return () => clearInterval(refreshInterval);
    }
  }, [authState.isAuthenticated, authState.accessToken]);

  /**
   * Initialize authentication state
   * Attempts to refresh token to restore session
   */
  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
        });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
      });
    }
  };

  /**
   * Login user with credentials
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch(`${API_ENDPOINTS.auth}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }

      const loginData = await response.json();
      const { access_token, user } = loginData;

      // Set auth token in memory for API calls
      setAuthToken(access_token);

      setAuthState({
        user: {
          ...user,
          roles: user.roles || [],
          permissions: user.permissions || [],
        },
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        user: null,
        isAuthenticated: false,
        accessToken: null,
      }));
      throw error;
    }
  };

  /**
   * Logout user and clear session
   */
  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate server-side session
      if (authState.accessToken) {
        await fetch(`${API_ENDPOINTS.auth}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.accessToken}`,
          },
          credentials: 'include',
        }).catch(() => {
          // Ignore logout API errors - still clear local state
        });
      }
    } finally {
      // Clear auth token from memory
      setAuthToken(null);

      // Always clear local auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
      });

      // Clear any other stored data
      localStorage.removeItem('user_preferences');
      sessionStorage.clear();
    }
  };

  /**
   * Refresh access token using httpOnly refresh token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.auth}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) return false;

      const tokenData = await response.json();
      const { access_token } = tokenData;

      // Get updated user info with new token
      const userResponse = await fetch(`${API_ENDPOINTS.auth}/me`, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
        credentials: 'include',
      });

      if (!userResponse.ok) return false;

      const userData = await userResponse.json();

      // Set auth token in memory for API calls
      setAuthToken(access_token);

      // Update auth state with new token and user data
      setAuthState({
        user: {
          ...userData,
          roles: userData.roles || [],
          permissions: userData.permissions || [],
        },
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
      });

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.is_superuser) return true;
    return authState.user.permissions.includes(permission);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    if (!authState.user) return false;
    if (authState.user.is_superuser) return true;
    return authState.user.roles.includes(role);
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook for protected components
 */
export const useRequireAuth = (requiredPermission?: string, requiredRole?: string) => {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  // Check permissions/roles
  const hasAccess = React.useMemo(() => {
    if (!auth.isAuthenticated) return false;
    if (requiredPermission && !auth.hasPermission(requiredPermission)) return false;
    if (requiredRole && !auth.hasRole(requiredRole)) return false;
    return true;
  }, [auth, requiredPermission, requiredRole]);

  return {
    ...auth,
    hasAccess,
  };
}; 