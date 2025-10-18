/**
 * Authentication Context
 *
 * Global state management for authentication using React Context API.
 */

'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import authService from '@/services/auth.service';
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from '@/types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  /**
   * Manual session verification (can be called by layouts)
   */
  const verifySession = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      const response = await authService.verifySession();
      setAuthState({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return false;
    }
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.login(credentials);

      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.register(credentials);

      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setAuthState((prev: AuthState) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    clearError,
    verifySession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
