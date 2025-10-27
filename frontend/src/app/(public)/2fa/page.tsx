'use client';

import VerificationTemplate from '@/components/ui/VerificationTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function TwoFactorPage(): React.ReactElement {
  const router = useRouter();
  const { sendOTP, verifyOTP, clearError, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Send OTP when page loads
  useEffect(() => {
    const sendCode = async () => {
      // Check if user has logged in (has user data but not authenticated yet)
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        await sendOTP();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
        setError(errorMessage);
      }
    };

    sendCode();
  }, [sendOTP, router, user]);

  const handleSubmit = async (code: string) => {
    if (code.length !== 6) {
      return;
    }

    setError(null);
    clearError();

    try {
      await verifyOTP(code);
      // Redirect to home on success
      router.push('/home');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    }
  };

  const handleResend = async () => {
    setError(null);
    clearError();

    try {
      await sendOTP();
      setError('Code resent successfully');
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    }
  };

  return (
    <div>
      {error && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-md shadow-lg z-50 ${
            error.includes('success')
              ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          }`}
        >
          {error}
        </div>
      )}
      <VerificationTemplate
        title="Two-Factor Authentication"
        explanation={`A 6-digit code has been sent to your registered email. Please key in the code below.`}
        onSubmit={handleSubmit}
        onResend={handleResend}
      />
    </div>
  );
}
