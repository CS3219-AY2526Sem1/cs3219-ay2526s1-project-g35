'use client';

import VerificationTemplate from '@/components/ui/VerificationTemplate';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function VerifyEmailPage(): React.ReactElement {
  const router = useRouter();

  const handleSubmit = (code: string) => {
    // simple mock: accept any 6-digit code and route to /home
    if (code.length === 6) {
      // in a real app, verify with server
      router.push('/home');
    }
  };

  const handleResend = () => {
    // TODO: call resend API
    // For now, just console.log
    console.log('Resend code requested');
  };

  return (
    <VerificationTemplate
      title="Verify Your Email"
      explanation={`A 6-digit code has been sent to your registered email. Please key in the code below.`}
      onSubmit={handleSubmit}
      onResend={handleResend}
    />
  );
}
