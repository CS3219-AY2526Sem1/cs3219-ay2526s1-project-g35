"use client";

import VerificationTemplate from "@/components/ui/VerificationTemplate";
import { useRouter } from "next/navigation";
import React from "react";

export default function TwoFactorPage(): React.ReactElement {
  const router = useRouter();

  const handleSubmit = (code: string) => {
    if (code.length === 6) {
      // mock success
      router.push("/home");
    }
  };

  const handleResend = () => {
    console.log("Resend 2FA code requested");
  };

  return (
    <VerificationTemplate
      title="Two-Factor Authentication"
      explanation={`A 6-digit code has been sent to your registered email. Please key in the code below.`}
      onSubmit={handleSubmit}
      onResend={handleResend}
    />
  );
}
