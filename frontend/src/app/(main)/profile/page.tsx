'use client';

import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import userService, { UserServiceError } from '@/services/user.service';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

type ProfileFormData = {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  avatar: string | null;
};

export default function ProfilePage(): React.ReactElement {
  const { user, logout, updateUser, initiatePasswordReset, resetPassword } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileFormData>({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    avatar: null,
  });
  const [originalData, setOriginalData] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Inline password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendOtpMessage, setSendOtpMessage] = useState<string | null>(null);
  const [changePwdMessage, setChangePwdMessage] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState<number>(0);
  const [otpIntervalId, setOtpIntervalId] = useState<NodeJS.Timeout | null>(null);

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
        avatar: userData.profile?.avatar || null,
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

  // Cleanup cooldown interval on unmount
  useEffect(() => {
    return () => {
      if (otpIntervalId) clearInterval(otpIntervalId);
    };
  }, [otpIntervalId]);

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
        avatar: response.data.profile?.avatar || null,
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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, JPG, and PNG images are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      const response = await userService.uploadAvatar(file);

      // Update local state with new avatar
      setData((prev) => ({ ...prev, avatar: response.data.avatar }));
      setOriginalData((prev) => (prev ? { ...prev, avatar: response.data.avatar } : null));

      // Update auth context with new avatar
      updateUser({
        profile: {
          ...user?.profile,
          avatar: response.data.avatar,
          firstName: user?.profile?.firstName || '',
          lastName: user?.profile?.lastName || '',
          fullName: user?.profile?.fullName || '',
          bio: user?.profile?.bio || '',
        },
      });

      setSuccessMessage('Profile picture uploaded successfully!');
    } catch (err) {
      const errorMessage =
        err instanceof UserServiceError ? err.message : 'Failed to upload profile picture';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteAccount() {
    try {
      setDeleting(true);
      setError(null);

      await userService.deleteOwnAccount();

      // Account deleted and user logged out by backend
      // Call logout to clear frontend auth state
      logout();

      // Redirect to login page
      router.push('/login?deleted=true');
    } catch (err) {
      const errorMessage =
        err instanceof UserServiceError ? err.message : 'Failed to delete account';
      setError(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
              <div className="relative w-40 h-40 rounded-full bg-muted/40 flex items-center justify-center overflow-hidden group">
                {data.avatar ? (
                  <Image
                    src={data.avatar}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                    {data.firstName?.[0]?.toUpperCase() || data.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-sm font-medium">
                    {uploading ? 'Uploading...' : 'Change Photo'}
                  </span>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Click to upload (Max 5MB)
              </p>
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

            {/* Inline Change Password Section */}
            <div className="mt-6">
              <label className="text-sm font-medium">Change your password</label>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwdError(null);
                      setSendOtpMessage(null);
                      setChangePwdMessage(null);
                    }}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="New password"
                  />
                  {pwdError ? (
                    <p className="text-xs text-destructive">{pwdError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      6-128 chars incl. uppercase, lowercase, number & special character.
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="sr-only" htmlFor="confirm-password">
                    Confirm your new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmError(null);
                      setSendOtpMessage(null);
                      setChangePwdMessage(null);
                    }}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Confirm your new password"
                  />
                  {confirmError && <p className="text-xs text-destructive">{confirmError}</p>}
                </div>
              </div>

              <div className="mt-3">
                <label className="text-sm font-medium" htmlFor="otp-input">
                  OTP verification
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setOtpError(null);
                      setChangePwdMessage(null);
                    }}
                    className="flex-1 px-3 py-2 border rounded"
                    placeholder="Enter 6-digit code"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSendingOtp || otpCooldown > 0}
                    onClick={async () => {
                      // Validate passwords before sending OTP
                      const validatePassword = (value: string) => {
                        if (!value) return 'Password is required.';
                        if (value.length < 6) return 'Password must be at least 6 characters long';
                        if (value.length > 128) return 'Password cannot exceed 128 characters';
                        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(value)) {
                          return 'Must include uppercase, lowercase, number & special character';
                        }
                        return null;
                      };

                      const pErr = validatePassword(newPassword);
                      const cErr = !confirmPassword
                        ? 'Please confirm your new password.'
                        : confirmPassword !== newPassword
                          ? 'Passwords do not match.'
                          : null;

                      setPwdError(pErr);
                      setConfirmError(cErr);
                      setSendOtpMessage(null);

                      if (pErr || cErr) return;

                      try {
                        setIsSendingOtp(true);
                        // Send OTP to user's email
                        const resp = await initiatePasswordReset(data.email);
                        setSendOtpMessage(resp.message || 'OTP sent to your email.');
                        // Start 60s UI cooldown
                        setOtpCooldown(60);
                        const id = setInterval(() => {
                          setOtpCooldown((s) => {
                            if (s <= 1) {
                              clearInterval(id);
                              return 0;
                            }
                            return s - 1;
                          });
                        }, 1000);
                        setOtpIntervalId(id);
                      } catch (err: unknown) {
                        // Fallback and attempt to parse remaining seconds if present
                        const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
                        setSendOtpMessage(msg);
                        const m = msg.match(/(\d+)\s*seconds?/i);
                        if (m && m[1]) {
                          const secs = parseInt(m[1], 10);
                          if (!Number.isNaN(secs) && secs > 0) {
                            setOtpCooldown(secs);
                            const id = setInterval(() => {
                              setOtpCooldown((s) => {
                                if (s <= 1) {
                                  clearInterval(id);
                                  return 0;
                                }
                                return s - 1;
                              });
                            }, 1000);
                            setOtpIntervalId(id);
                          }
                        }
                      } finally {
                        setIsSendingOtp(false);
                      }
                    }}
                  >
                    {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? 'Wait' : 'Send OTP'}
                  </Button>
                </div>
                {otpCooldown > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    You can request another OTP in {otpCooldown} seconds
                  </p>
                )}
                {sendOtpMessage && (
                  <p
                    className={`mt-1 text-sm ${
                      /sent|success/i.test(sendOtpMessage) ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {sendOtpMessage}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="attention"
                  disabled={isChangingPwd || !otp}
                  onClick={async () => {
                    setChangePwdMessage(null);
                    setOtpError(null);

                    if (!otp || otp.length !== 6) {
                      setOtpError('Please enter the 6-digit code.');
                      return;
                    }
                    // Ensure password still valid
                    const invalid =
                      !newPassword || !confirmPassword || newPassword !== confirmPassword;
                    if (invalid) {
                      setChangePwdMessage('Please ensure passwords are valid and matching.');
                      return;
                    }

                    try {
                      setIsChangingPwd(true);
                      await resetPassword(data.email, otp, newPassword);
                      setChangePwdMessage('Password changed successfully.');
                      router.push('/login');
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Failed to change password.';
                      setChangePwdMessage(msg);
                    } finally {
                      setIsChangingPwd(false);
                    }
                  }}
                  className="gap-2"
                >
                  {isChangingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isChangingPwd ? 'Changing...' : 'Change Password'}
                </Button>
                <p className={`ml-4 text-sm text-muted-foreground inline-block`}>
                  Note: You will be logged out once you successfully change your password
                </p>
                {otpError && <p className="mt-1 text-sm text-destructive">{otpError}</p>}
                {changePwdMessage && (
                  <p
                    className={`mt-1 text-sm ${
                      /success/i.test(changePwdMessage) ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {changePwdMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-md font-bold text-destructive">Danger Zone</div>
              <div className="mt-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                >
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

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <h2 className="text-xl font-bold text-destructive mb-4">Confirm Account Deletion</h2>
              <p className="text-sm text-foreground mb-6">
                Are you absolutely sure you want to delete your account? This action cannot be
                undone. All your data will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
