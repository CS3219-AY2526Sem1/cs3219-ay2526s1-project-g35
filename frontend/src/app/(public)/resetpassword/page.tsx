'use client';

import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ChangeEvent, FormEvent } from 'react';
import { Suspense, useCallback, useEffect, useState } from 'react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { initiatePasswordReset, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  const validateEmail = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Email is required.';
    }

    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(trimmed)) {
      return 'Please enter a valid email address.';
    }

    return null;
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const validationError = validateEmail(trimmed);
    setEmailError(validationError);
    setStatusMessage(null);
    clearError();

    if (validationError) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await initiatePasswordReset(trimmed.toLowerCase());

      if (response?.message) {
        setStatusMessage(response.message);
      }

      router.push(`/resetpassword/verifyotp?email=${encodeURIComponent(trimmed.toLowerCase())}`);
    } catch (submissionError) {
      const fallback =
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to send reset code. Please try again.';
      setStatusMessage(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-xl border bg-card p-8 shadow-lg">
        <Header className="text-center">Reset Your Password</Header>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Enter the email associated with your account. We&apos;ll send a one-time code if we find a
          matching account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setEmail(event.target.value);
                setEmailError(null);
                setStatusMessage(null);
                clearError();
              }}
              placeholder="e.g. jane.doe@example.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            {(emailError || error || statusMessage) && (
              <p
                className={`text-sm ${
                  emailError || error
                    ? 'text-destructive'
                    : statusMessage?.toLowerCase().includes('sent')
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive'
                }`}
              >
                {emailError || error || statusMessage}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" asChild className="gap-2">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" /> Back to login
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Sending...' : 'Send OTP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-(--hscreen)" />}>
      {' '}
      {/* Keeps layout stable */}
      <ResetPasswordContent />
    </Suspense>
  );
}
