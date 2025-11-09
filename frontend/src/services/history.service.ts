/**
 * History Service
 *
 * Handles all history-related API operations
 */

import apiClient from '@/lib/api/client';
import { AxiosResponse } from 'axios';

export interface HistoryEntry {
  id: string;
  user_id: string;
  session_id?: string;
  question_title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  created_at: string;
}

export interface GetHistoryResponse {
  success: boolean;
  count: number;
  data: HistoryEntry[];
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface CreateHistoryPayload {
  user_id: string;
  question_title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  session_id?: string;
}

export interface CreateHistoryResponse {
  success: boolean;
  message: string;
  data: HistoryEntry;
}

/**
 * Custom error class for history service errors
 */
export class HistoryServiceError extends Error {
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'HistoryServiceError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

class HistoryService {
  private readonly HISTORY_BASE_PATH = '/history';
  private readonly HISTORY_SERVICE_URL =
    process.env.NEXT_PUBLIC_API_HISTORY_URL || 'http://localhost:8004';

  /**
   * Get user's history
   * GET /history?user_id={userId}&limit={limit}&offset={offset}
   */
  async getUserHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<GetHistoryResponse> {
    try {
      const response: AxiosResponse<GetHistoryResponse> = await apiClient.get(
        `${this.HISTORY_SERVICE_URL}${this.HISTORY_BASE_PATH}`,
        {
          params: {
            user_id: userId,
            limit,
            offset,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new history entry
   * POST /history
   */
  async createHistoryEntry(payload: CreateHistoryPayload): Promise<CreateHistoryResponse> {
    try {
      const response: AxiosResponse<CreateHistoryResponse> = await apiClient.post(
        `${this.HISTORY_SERVICE_URL}${this.HISTORY_BASE_PATH}`,
        payload,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): HistoryServiceError {
    if (this.isAxiosError(error) && error.response) {
      const message =
        error.response.data?.message || error.response.data?.error || 'An error occurred';
      const statusCode = error.response.status;
      const details = error.response.data?.details as Record<string, unknown> | undefined;
      return new HistoryServiceError(message, statusCode, details);
    } else if (this.isAxiosError(error) && error.request) {
      return new HistoryServiceError('No response from server. Please check your connection.');
    } else if (error instanceof Error) {
      return new HistoryServiceError(error.message);
    } else {
      return new HistoryServiceError('An unexpected error occurred');
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

const historyService = new HistoryService();
export default historyService;
