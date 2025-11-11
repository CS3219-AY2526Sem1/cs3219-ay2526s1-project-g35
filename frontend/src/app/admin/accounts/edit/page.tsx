'use client';

import Header from '@/components/ui/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import userService, { UserServiceError } from '@/services/user.service';
import { UserData } from '@/types/user.types';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ValidationErrors = {
  username?: string;
  email?: string;
  password?: string;
};

export default function EditAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [originalUser, setOriginalUser] = useState<UserData | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [showSave, setShowSave] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId) {
      router.push('/admin/accounts');
      return;
    }

    const loadUser = async () => {
      try {
        setLoading(true);
        setGeneralError(null);
        const response = await userService.getUserById(userId);
        const user = response.data;
        setOriginalUser(user);
        setUsername(user.username);
        setEmail(user.email);
        setPassword(''); // Don't pre-fill password
      } catch (err) {
        console.error('Failed to load user:', err);
        const message =
          err instanceof UserServiceError ? err.message : 'Failed to load user details.';
        setGeneralError(message);
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [userId, router]);

  const validateFields = (): boolean => {
    const errors: ValidationErrors = {};

    // Username validation
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    } else if (username.length > 30) {
      errors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      errors.username = 'Username must only contain alphanumeric characters';
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address';
    }

    // Password validation (only if provided)
    if (password.trim()) {
      if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      } else if (password.length > 128) {
        errors.password = 'Password cannot exceed 128 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)) {
        errors.password =
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveClick = () => {
    setGeneralError(null);
    if (validateFields()) {
      setShowSave(true);
    }
  };

  const onSaveConfirm = async () => {
    setShowSave(false);
    setIsSaving(true);
    setGeneralError(null);

    try {
      const payload: { username: string; email: string; password?: string } = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
      };

      if (password.trim()) {
        payload.password = password;
      }

      await userService.updateUserById(userId!, payload);
      setShowSuccess(true);
    } catch (err) {
      console.error('Failed to update user:', err);
      const message = err instanceof UserServiceError ? err.message : 'Failed to update user.';
      setGeneralError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteConfirm = async () => {
    setShowDelete(false);
    setIsDeleting(true);
    setGeneralError(null);

    try {
      await userService.deleteUserById(userId!);
      router.push('/admin/accounts');
    } catch (err) {
      console.error('Failed to delete user:', err);
      const message = err instanceof UserServiceError ? err.message : 'Failed to delete user.';
      setGeneralError(message);
      setIsDeleting(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccess(false);
    router.push('/admin/accounts');
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Header>Edit Account Details</Header>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-center text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!originalUser) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Header>Edit Account Details</Header>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-center text-destructive">
            {generalError || 'User not found or failed to load.'}
          </p>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => router.push('/admin/accounts')}>Back to Accounts</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <Header>Edit Account Details</Header>

      {generalError && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {generalError}
        </div>
      )}

      <form
        className="space-y-6 rounded-lg border bg-card p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveClick();
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Username <span className="text-destructive">*</span>
          </label>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setValidationErrors((prev) => ({ ...prev, username: undefined }));
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter username"
            disabled={isSaving || isDeleting}
          />
          {validationErrors.username && (
            <p className="text-xs text-destructive">{validationErrors.username}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setValidationErrors((prev) => ({ ...prev, email: undefined }));
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter email"
            disabled={isSaving || isDeleting}
          />
          {validationErrors.email && (
            <p className="text-xs text-destructive">{validationErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, password: undefined }));
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Leave blank to keep current password"
            disabled={isSaving || isDeleting}
          />
          {validationErrors.password && (
            <p className="text-xs text-destructive">{validationErrors.password}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Leave blank to keep the current password. If provided, must meet security requirements.
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1" disabled={isSaving || isDeleting}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDelete(true)}
            className="flex-1"
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </form>

      {/* Save Confirmation Modal */}
      <AlertDialog open={showSave} onOpenChange={setShowSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex justify-center">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <AlertDialogTitle className="text-center">Save These Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to save these changes to this account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3 pt-2">
            <AlertDialogCancel className="min-w-[80px]" disabled={isSaving}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={onSaveConfirm} className="min-w-[80px]" disabled={isSaving}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Modal */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <AlertDialogTitle className="text-center">Changes Saved Successfully</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              The account details have been updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center pt-2">
            <AlertDialogAction onClick={handleSuccessOk} className="min-w-[80px]">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Are you sure you want to delete this account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-destructive font-semibold">
              This action is irreversible!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center gap-3 pt-2">
            <AlertDialogCancel className="min-w-[80px]" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild disabled={isDeleting}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Button clicked!');
                  void onDeleteConfirm();
                }}
                className="min-w-[80px] bg-destructive hover:bg-destructive/90"
                disabled={isDeleting}
              >
                Confirm
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
