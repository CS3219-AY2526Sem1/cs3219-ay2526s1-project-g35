'use client';

import VerificationTemplate from '@/components/ui/VerificationTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeRegistration, resendRegistrationOTP } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [verificationError, setVerificationError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Get email from query params
    const emailParam = searchParams.get('email');
    if (!emailParam) {
      // No email provided, redirect to signup
      router.push('/signup');
      return;
    }
    setEmail(emailParam);
  }, [searchParams, router]);

  const handleVerificationSubmit = async (code: string) => {
    if (!email) return;

    setIsVerifying(true);
    setVerificationError('');

    try {
      await completeRegistration(email, code);
      // Verification successful, redirect to home
      router.push('/home');
    } catch (err) {
      setIsVerifying(false);
      const errorMessage =
        err instanceof Error ? err.message : 'Invalid verification code. Please try again.';
      setVerificationError(errorMessage);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return;

    setVerificationError('');

    try {
      await resendRegistrationOTP(email);
      setVerificationError('Verification code resent successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setVerificationError(''), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to resend verification code. Please try again.';
      setVerificationError(errorMessage);
    }
  };

  if (!email) {
    return (
      <div className="min-h-(--hscreen) flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-(--hscreen) flex flex-col items-center justify-center">
      <VerificationTemplate
        title="Verify Your Email"
        explanation={`We've sent a 6-digit verification code to ${email}. Please enter the code below to complete your registration.`}
        onSubmit={handleVerificationSubmit}
        onResend={handleResendOTP}
        initialCountdown={60}
      />
      {verificationError && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-3 text-sm rounded-md max-w-md ${
            verificationError.includes('success')
              ? 'text-green-600 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'text-red-600 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}
        >
          {verificationError}
        </div>
      )}
      {isVerifying && <div className="mt-4 text-sm text-muted-foreground">Verifying code...</div>}
    </div>
  );
}

export default function VerifyEmailPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="min-h-(--hscreen) flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
