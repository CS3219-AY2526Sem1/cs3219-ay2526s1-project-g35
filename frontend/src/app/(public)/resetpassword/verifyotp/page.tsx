/*
 * AI Assistance Disclosure:
 * Tool: ChatGPT/Claude
 * Scope: Implementation of frontend elements and api integration with backend services based on author specified behaviors and figma mockups
 * Author review: All behaviours and components to add specified by Arren11111, all behaviors
 *                tested to function as intended by author
 */

'use client';

import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

function OTPInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const length = 6;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const focusAt = useCallback((index: number) => {
    const input = inputsRef.current[index];
    input?.focus();
    input?.select();
  }, []);

  const values = useMemo(() => {
    const chars = value.split('').slice(0, length);
    while (chars.length < length) {
      chars.push('');
    }
    return chars;
  }, [value]);

  const updateValue = (idx: number, nextChar: string) => {
    const chars = [...values];
    chars[idx] = nextChar;
    onChange(chars.join('').slice(0, length));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const raw = event.target.value.replace(/\D/g, '');
    if (!raw) {
      updateValue(idx, '');
      return;
    }

    if (raw.length > 1) {
      // Distribute pasted / multi-entered digits in a single state update
      const chars = [...values];
      raw.split('').forEach((digit, offset) => {
        const target = idx + offset;
        if (target < length) chars[target] = digit;
      });
      onChange(chars.join('').slice(0, length));
      const nextIndex = Math.min(length - 1, idx + raw.length - 1);
      focusAt(nextIndex);
      return;
    }

    updateValue(idx, raw);
    if (idx < length - 1) {
      focusAt(idx + 1);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (event.key === 'Backspace') {
      if (values[idx]) {
        updateValue(idx, '');
      } else if (idx > 0) {
        focusAt(idx - 1);
      }
    } else if (event.key === 'ArrowLeft' && idx > 0) {
      focusAt(idx - 1);
    } else if (event.key === 'ArrowRight' && idx < length - 1) {
      focusAt(idx + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, idx: number) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    const chars = [...values];
    text.split('').forEach((char, offset) => {
      const target = idx + offset;
      if (target < length) chars[target] = char;
    });
    onChange(chars.join('').slice(0, length));
    const nextIndex = Math.min(length - 1, idx + text.length - 1);
    focusAt(nextIndex);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {values.map((digit, idx) => (
        <input
          key={idx}
          ref={(element) => {
            inputsRef.current[idx] = element;
          }}
          inputMode="numeric"
          pattern="[0-9]*"
          // Allow pasting full code into one box so we can distribute
          maxLength={length}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(event, idx)}
          onKeyDown={(event) => handleKeyDown(event, idx)}
          onPaste={(event) => handlePaste(event, idx)}
          className="h-12 w-10 rounded-md border border-input bg-muted/40 text-center text-lg font-semibold focus:border-ring focus:outline-none md:h-14 md:w-12"
        />
      ))}
    </div>
  );
}

function VerifyResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const {
    verifyPasswordResetOTP,
    resendPasswordResetOTP,
    error: authError,
    clearError,
  } = useAuth();

  const [otp, setOtp] = useState('');
  const [formErrors, setFormErrors] = useState<{ otp?: string }>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace('/resetpassword');
    }
  }, [email, router]);

  const handleResend = async () => {
    if (!email) return;
    setStatusMessage(null);
    setFormErrors({});
    clearError();
    try {
      setIsResending(true);
      const response = await resendPasswordResetOTP(email);
      setStatusMessage(response?.message ?? 'A new code has been sent (if the email exists).');
      setOtp('');
    } catch (resendError) {
      const fallback =
        resendError instanceof Error
          ? resendError.message
          : 'Unable to resend code. Please try again.';
      setStatusMessage(fallback);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    const nextErrors: typeof formErrors = {};
    clearError();
    setStatusMessage(null);
    if (otp.length !== 6) {
      nextErrors.otp = 'Enter the 6-digit code.';
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      setIsVerifying(true);
      await verifyPasswordResetOTP(email, otp);
      // Redirect with email & otp so change password page can use it
      router.push(`/resetpassword/changepassword?email=${encodeURIComponent(email)}&otp=${otp}`);
    } catch (err) {
      const fallback = err instanceof Error ? err.message : 'Verification failed.';
      setStatusMessage(fallback);
    } finally {
      setIsVerifying(false);
    }
  };

  const disableActions = isVerifying || isResending;

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-8 shadow-lg">
        <Header className="text-center">Verify OTP &amp; Reset Password</Header>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          We&apos;ve sent a six-digit code to <span className="font-medium">{email}</span>. Enter
          the code and choose a new password for your account.
        </p>

        <form onSubmit={handleVerifySubmit} className="mt-8 space-y-8">
          <div className="space-y-4">
            <OTPInput value={otp} onChange={(next) => setOtp(next)} disabled={disableActions} />
            {formErrors.otp && (
              <p className="text-center text-sm text-destructive">{formErrors.otp}</p>
            )}
            <div className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={disableActions}
                className="underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResending ? 'Sending...' : 'Resend email'}
              </button>
            </div>
          </div>

          {/* Password fields removed: handled in /resetpassword/changepassword after OTP verification */}

          {(authError || statusMessage) && (
            <p className="text-sm text-center text-destructive">{authError || statusMessage}</p>
          )}

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" asChild>
              <Link href="/resetpassword">Use a different email</Link>
            </Button>
            <Button type="submit" disabled={disableActions || otp.length !== 6} className="gap-2">
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isVerifying ? 'Verifying...' : 'Verify Code'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyResetPage() {
  return (
    <Suspense fallback={<div className="min-h-(--hscreen)" />}>
      {' '}
      {/* preserve layout */}
      <VerifyResetContent />
    </Suspense>
  );
}
