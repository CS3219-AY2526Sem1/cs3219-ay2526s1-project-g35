/**
 * Authentication Service
 */

import apiClient from '@/lib/api/client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  VerifyTokenResponse,
} from '@/types/auth.types';
import { AxiosResponse } from 'axios';

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  public readonly isValidationError: boolean;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.details = details;
    this.isValidationError = statusCode === 400;
  }
}

class AuthService {
  private readonly AUTH_BASE_PATH = '/auth';

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post(
        `${this.AUTH_BASE_PATH}/login`,
        credentials,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post(
        `${this.AUTH_BASE_PATH}/register`,
        credentials,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.AUTH_BASE_PATH}/logout`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify the current session by checking if the accessToken cookie is valid
   */
  async verifySession(): Promise<VerifyTokenResponse> {
    try {
      const response: AxiosResponse<VerifyTokenResponse> = await apiClient.get(
        `${this.AUTH_BASE_PATH}/verify-token`,
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): AuthError {
    if (error.response) {
      const message =
        error.response.data?.message || error.response.data?.error || 'An error occurred';
      const statusCode = error.response.status;
      const details = error.response.data?.details;
      return new AuthError(message, statusCode, details);
    } else if (error.request) {
      return new AuthError('No response from server. Please check your connection.');
    } else {
      return new AuthError(error.message || 'An unexpected error occurred');
    }
  }
}

export default new AuthService();
