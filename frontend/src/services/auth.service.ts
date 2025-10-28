/**
 * Authentication Service
 */

import apiClient from '@/lib/api/client';
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  SendOTPResponse,
  VerifyTokenResponse,
} from '@/types/auth.types';
import { AxiosResponse } from 'axios';

/**
 * Custom error class for authentication errors
 */
export class AuthError extends Error {
  public readonly isValidationError: boolean;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
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
    } catch (error) {
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
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Initiate registration - Step 1: Send registration data and receive OTP
   */
  async initiateRegistration(credentials: RegisterCredentials): Promise<SendOTPResponse> {
    try {
      const response: AxiosResponse<SendOTPResponse> = await apiClient.post(
        `${this.AUTH_BASE_PATH}/register/initiate`,
        credentials,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete registration - Step 2: Verify OTP and create user account
   */
  async completeRegistration(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post(
        `${this.AUTH_BASE_PATH}/register/complete`,
        { email, otp },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resend registration OTP
   */
  async resendRegistrationOTP(email: string): Promise<SendOTPResponse> {
    try {
      const response: AxiosResponse<SendOTPResponse> = await apiClient.post(
        `${this.AUTH_BASE_PATH}/register/resend-otp`,
        { email },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.AUTH_BASE_PATH}/logout`);
    } catch (error) {
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
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset token TTL to extend user session
   */
  async resetTTL(): Promise<void> {
    try {
      await apiClient.post(`${this.AUTH_BASE_PATH}/reset-ttl`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): AuthError {
    if (this.isAxiosError(error) && error.response) {
      const message =
        error.response.data?.message || error.response.data?.error || 'An error occurred';
      const statusCode = error.response.status;
      const details = error.response.data?.details as Record<string, unknown> | undefined;
      return new AuthError(message, statusCode, details);
    } else if (this.isAxiosError(error) && error.request) {
      return new AuthError('No response from server. Please check your connection.');
    } else if (error instanceof Error) {
      return new AuthError(error.message);
    } else {
      return new AuthError('An unexpected error occurred');
    }
  }

  private isAxiosError(error: unknown): error is {
    response?: { status: number; data?: { message?: string; error?: string; details?: unknown } };
    request?: unknown;
  } {
    return (
      typeof error === 'object' && error !== null && ('response' in error || 'request' in error)
    );
  }
}

const authService = new AuthService();
export default authService;
