'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function ChangePasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const otp = searchParams.get('otp');
  const { resetPassword, error: authError, clearError } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ password?: string; confirm?: string }>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!email || !otp) {
      router.replace('/resetpassword');
    }
  }, [email, otp, router]);

  const validatePassword = useCallback((value: string) => {
    if (!value) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters long';
    if (value.length > 128) return 'Password cannot exceed 128 characters';
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(value)) {
      return 'Must include uppercase, lowercase, number, and special character';
    }
    return undefined;
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !otp) return;
    clearError();
    setStatusMessage(null);
    const nextErrors: typeof formErrors = {};
    const pwdErr = validatePassword(newPassword);
    if (pwdErr) nextErrors.password = pwdErr;
    if (!confirmPassword) nextErrors.confirm = 'Please confirm password.';
    else if (confirmPassword !== newPassword) nextErrors.confirm = 'Passwords do not match.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      await resetPassword(email, otp, newPassword);
      setShowSuccess(true);
    } catch (err) {
      const fallback = err instanceof Error ? err.message : 'Failed to reset password.';
      setStatusMessage(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-xl border bg-card p-8 shadow-lg">
        <Header className="text-center">Choose a New Password</Header>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter and confirm a new password for <span className="font-medium">{email}</span>.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setFormErrors((prev) => ({ ...prev, password: undefined }));
                setStatusMessage(null);
                clearError();
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter a strong password"
              disabled={isSubmitting}
            />
            {formErrors.password ? (
              <p className="text-sm text-destructive">{formErrors.password}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                6-128 chars incl. uppercase, lowercase, number & special character.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setFormErrors((prev) => ({ ...prev, confirm: undefined }));
                setStatusMessage(null);
                clearError();
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Re-enter password"
              disabled={isSubmitting}
            />
            {formErrors.confirm && <p className="text-sm text-destructive">{formErrors.confirm}</p>}
          </div>
          {(authError || statusMessage) && (
            <p className="text-sm text-center text-destructive">{authError || statusMessage}</p>
          )}
          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
        <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Password Reset Successful</AlertDialogTitle>
              <AlertDialogDescription>
                Your password has been updated. You can now log in with your new credentials.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  setShowSuccess(false);
                  router.push('/login');
                }}
              >
                Back to Login
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-(--hscreen)" />}>
      {' '}
      {/* preserve layout */}
      <ChangePasswordContent />
    </Suspense>
  );
}
