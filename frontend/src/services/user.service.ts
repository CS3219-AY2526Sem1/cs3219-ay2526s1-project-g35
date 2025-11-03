/**
 * User Service
 
 * Handles all user-related API operations including profile management
 */

import apiClient from '@/lib/api/client';
import {
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
  UserProfileResponse,
} from '@/types/user.types';
import { AxiosResponse } from 'axios';

/**
 * Custom error class for user service errors
 */
export class UserServiceError extends Error {
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'UserServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class UserService {
  private readonly USER_BASE_PATH = '/users';

  /**
   * Get current user's profile
   * GET /users/profile
   */
  async getUserProfile(): Promise<UserProfileResponse> {
    try {
      const response: AxiosResponse<UserProfileResponse> = await apiClient.get(
        `${this.USER_BASE_PATH}/profile`,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update user profile by user ID
   * PATCH /users/:id
   */
  async updateUserProfile(
    userId: string,
    payload: UpdateUserProfilePayload,
  ): Promise<UpdateUserProfileResponse> {
    try {
      const response: AxiosResponse<UpdateUserProfileResponse> = await apiClient.patch(
        `${this.USER_BASE_PATH}/${userId}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete own account (authenticated user)
   */
  async deleteOwnAccount(): Promise<{ message: string; data: { message: string } }> {
    try {
      const response: AxiosResponse<{ message: string; data: { message: string } }> =
        await apiClient.delete(`${this.USER_BASE_PATH}/me`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete user account (admin only)
   * DELETE /users/:id
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.USER_BASE_PATH}/${userId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): UserServiceError {
    if (this.isAxiosError(error) && error.response) {
      const message =
        error.response.data?.message || error.response.data?.error || 'An error occurred';
      const statusCode = error.response.status;
      const details = error.response.data?.details as Record<string, unknown> | undefined;
      return new UserServiceError(message, statusCode, details);
    } else if (this.isAxiosError(error) && error.request) {
      return new UserServiceError('No response from server. Please check your connection.');
    } else if (error instanceof Error) {
      return new UserServiceError(error.message);
    } else {
      return new UserServiceError('An unexpected error occurred');
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

const userService = new UserService();
export default userService;
