/**
 * Custom hook for managing user profile operations
 */

import userService, { UserServiceError } from '@/services/user.service';
import { UpdateUserProfilePayload, UserData } from '@/types/user.types';
import { useCallback, useEffect, useState } from 'react';

interface UseUserProfileReturn {
  profile: UserData | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (userId: string, payload: UpdateUserProfilePayload) => Promise<void>;
  clearMessages: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();
      const response = await userService.getUserProfile();
      setProfile(response.data);
    } catch (err) {
      const errorMessage = err instanceof UserServiceError ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  const updateProfile = useCallback(
    async (userId: string, payload: UpdateUserProfilePayload) => {
      try {
        setLoading(true);
        clearMessages();
        const response = await userService.updateUserProfile(userId, payload);
        setProfile(response.data);
        setSuccessMessage('Profile updated successfully!');
      } catch (err) {
        const errorMessage =
          err instanceof UserServiceError ? err.message : 'Failed to update profile';
        setError(errorMessage);
        throw err; // Re-throw to allow component to handle if needed
      } finally {
        setLoading(false);
      }
    },
    [clearMessages],
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    successMessage,
    fetchProfile,
    updateProfile,
    clearMessages,
  };
}
