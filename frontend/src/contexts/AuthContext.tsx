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
   * Login handler - sets authentication but doesn't mark as fully authenticated until 2FA
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.login(credentials);

      // Store user data but don't mark as fully authenticated yet (needs 2FA)
      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: false, // Will be set to true after 2FA
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
   * Send OTP for email verification (registration)
   */
  const sendOTP = useCallback(async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));
      await authService.sendOTP();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Verify OTP for email verification (registration)
   */
  const verifyOTP = useCallback(async (otp: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.verifyOTP(otp);

      // Update user with verified status
      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Send login 2FA OTP
   */
  const sendLogin2FA = useCallback(async () => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));
      await authService.sendLogin2FA();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send login code';
      setAuthState((prev: AuthState) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  /**
   * Verify login 2FA OTP and complete authentication
   */
  const verifyLogin2FA = useCallback(async (otp: string) => {
    try {
      setAuthState((prev: AuthState) => ({ ...prev, error: null }));

      const response = await authService.verifyLogin2FA(otp);

      // Now mark as fully authenticated
      setAuthState((prev: AuthState) => ({
        ...prev,
        user: response.data.user,
        isAuthenticated: true,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login verification failed';
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
    sendOTP,
    verifyOTP,
    sendLogin2FA,
    verifyLogin2FA,
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
