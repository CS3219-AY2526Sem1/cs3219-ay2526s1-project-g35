'use client';

import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import userService, { UserServiceError } from '@/services/user.service';
import { UserData } from '@/types/user.types';
import React, { useCallback, useEffect, useState } from 'react';

type ProfileFormData = {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
};

export default function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileFormData>({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
  });
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user profile on mount
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUserProfile();
      const userData = response.data;

      const formData: ProfileFormData = {
        username: userData.username,
        firstName: userData.profile?.firstName || '',
        lastName: userData.profile?.lastName || '',
        bio: userData.profile?.bio || '',
        email: userData.email,
      };

      setData(formData);
      setOriginalData(formData);
    } catch (err) {
      const errorMessage = err instanceof UserServiceError ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleChange<K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    // Clear messages when user starts editing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!user?.id) {
      setError('User ID not found. Please log in again.');
      return;
    }

    // Check if anything changed
    if (originalData && JSON.stringify(data) === JSON.stringify(originalData)) {
      setSuccessMessage('No changes to save');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload: {
        username?: string;
        profile?: {
          firstName?: string;
          lastName?: string;
          bio?: string;
          avatar?: string | null;
        };
      } = {
        username: data.username !== originalData?.username ? data.username : undefined,
      };

      // Build profile updates only if there are changes
      const profileChanges: {
        firstName?: string;
        lastName?: string;
        bio?: string;
      } = {};

      if (data.firstName !== originalData?.firstName) {
        profileChanges.firstName = data.firstName;
      }
      if (data.lastName !== originalData?.lastName) {
        profileChanges.lastName = data.lastName;
      }
      if (data.bio !== originalData?.bio) {
        profileChanges.bio = data.bio;
      }

      // Only add profile to payload if there are changes
      if (Object.keys(profileChanges).length > 0) {
        payload.profile = profileChanges;
      }

      const response = await userService.updateUserProfile(user.id, payload);

      // Update local state with server response
      const updatedData: ProfileFormData = {
        username: response.data.username,
        firstName: response.data.profile?.firstName || '',
        lastName: response.data.profile?.lastName || '',
        bio: response.data.profile?.bio || '',
        email: response.data.email,
      };

      setData(updatedData);
      setOriginalData(updatedData);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      const errorMessage =
        err instanceof UserServiceError ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center p-8 bg-background">
      <div className="w-full max-w-4xl">
        <Header className="text-center">Manage Your Profile</Header>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6">
          {/* Top area: avatar at left, username + name fields at right */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2 flex-shrink-0 flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-muted/40 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                  {data.firstName?.[0]?.toUpperCase() || data.username?.[0]?.toUpperCase() || '?'}
                </div>
              </div>
            </div>

            <div className="col-span-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={data.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded"
                  placeholder="Enter username"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    value={data.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border rounded mt-1"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    value={data.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border rounded mt-1"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full-width fields below */}
          <div className="mt-6">
            <div className="mt-4">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={data.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full px-3 py-2 border rounded mt-1 h-24"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">
                Email <span className="text-xs text-muted-foreground">(cannot be changed)</span>
              </label>
              <input
                type="email"
                value={data.email}
                disabled
                className="w-full px-3 py-2 border rounded mt-1 bg-muted cursor-not-allowed opacity-60"
              />
            </div>

            <div className="mt-6">
              <div className="text-md font-bold text-destructive">Danger Zone</div>
              <div className="mt-3">
                <Button type="button" variant="destructive">
                  Delete My Account
                </Button>
              </div>
              <p className="text-sm text-destructive mt-3">
                <b>Warning:</b> This action is permanent and irreversible!
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <Button type="submit" variant="attention" size="lg" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
