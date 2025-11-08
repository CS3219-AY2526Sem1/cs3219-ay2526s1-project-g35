/**
 * Authentication Context
 *
 * Global state management for authentication using React Context API.
 */

'use client';

import authService from '@/services/auth.service';
import {
  AuthContextType,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from '@/types/auth.types';
import React, { createContext, useCallback, useContext, useState } from 'react';

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

      // Store user data but don't mark as fully authenticated yet (needs 2FA)
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
   * Initiate registration - Step 1: Send registration data and OTP
   */
  const initiateRegistration = useCallback(async (credentials: RegisterCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));
      const response = await authService.initiateRegistration(credentials);
      return response;
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
   * Complete registration - Step 2: Verify OTP and create account
   */
  const completeRegistration = useCallback(async (email: string, otp: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.completeRegistration(email, otp);

      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        error: null,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Resend registration OTP
   */
  const resendRegistrationOTP = useCallback(async (email: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));
      const response = await authService.resendRegistrationOTP(email);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
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

  const updateUser = useCallback((updatedUser: Partial<AuthState['user']>) => {
    setAuthState((prev: AuthState) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updatedUser } : null,
    }));
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    register,
    clearError,
    verifySession,
    initiateRegistration,
    completeRegistration,
    resendRegistrationOTP,
    updateUser,
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
