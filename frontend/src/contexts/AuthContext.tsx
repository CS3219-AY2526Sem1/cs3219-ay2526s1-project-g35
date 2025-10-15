/**
 * Authentication Context
 * 
 * Global state management for authentication using React Context API.
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '@/services/auth.service';
import { AuthContextType, AuthState, LoginCredentials, RegisterCredentials } from '@/types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.login(credentials);
      
      setAuthState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.register(credentials);
      
      setAuthState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setAuthState((prev: AuthState) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));
      
      await authService.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Even if logout fails on server, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Logout failed',
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
