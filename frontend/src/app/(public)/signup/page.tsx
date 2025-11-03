'use client';

import { Button } from '@/components/ui/button';
import LeftAlignHeader from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import { AuthError } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type SignUpForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  bio: string;
};

const initialForm: SignUpForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  bio: '',
};

type Errors = Partial<Record<keyof SignUpForm, string>>;

export default function SignUpPage(): React.JSX.Element {
  const router = useRouter();
  const { initiateRegistration, error: authError, clearError } = useAuth();
  const [formData, setFormData] = useState<SignUpForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpForm, boolean>>>({});
  const [backendErrors, setBackendErrors] = useState<Array<{ field: string; message: string }>>([]);

  // Password constraint checks
  const passwordConstraints = {
    minLength: formData.password.length >= 6,
    maxLength: formData.password.length <= 128,
    hasUppercase: /[A-Z]/.test(formData.password),
    hasLowercase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
  };

  const validators: Partial<Record<keyof SignUpForm, (v: string) => string | undefined>> = {
    username: (v) => {
      if (!v || v.trim().length === 0) return 'Username is required';
      if (v.length < 3) return 'Username must be at least 3 characters long';
      if (v.length > 30) return 'Username cannot exceed 30 characters';
      if (!/^[a-zA-Z0-9]+$/.test(v)) return 'Username must only contain alphanumeric characters';
      return undefined;
    },
    firstName: (v) => {
      if (!v || v.trim().length === 0) return 'First name is required';
      if (v.length > 50) return 'First name cannot exceed 50 characters';
      return undefined;
    },
    lastName: (v) => {
      if (!v || v.trim().length === 0) return 'Last name is required';
      if (v.length > 50) return 'Last name cannot exceed 50 characters';
      return undefined;
    },
    email: (v) => {
      if (!v) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please provide a valid email address';
      return undefined;
    },
    password: (v) => {
      if (!v) return 'Password is required';
      if (v.length < 6) return 'Password must be at least 6 characters long';
      if (v.length > 128) return 'Password cannot exceed 128 characters';
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(v)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
      }
      return undefined;
    },
    confirmPassword: (v) => {
      if (!v) return 'Please confirm your password';
      if (v !== formData.password) return 'Passwords do not match';
      return undefined;
    },
    bio: (v) => {
      if (v && v.length > 500) return 'Bio cannot exceed 500 characters';
      return undefined;
    },
  };

  const validateField = (name: keyof SignUpForm, value: string) => {
    const validator = validators[name];
    const message = validator ? validator(value) : undefined;
    setErrors((prev) => ({ ...prev, [name]: message }));
    return message;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    if (touched[name as keyof SignUpForm]) {
      validateField(name as keyof SignUpForm, value);
    }
    // Also revalidate confirmPassword if password changes
    if (name === 'password' && touched.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
    if (authError) clearError();
    if (backendErrors.length > 0) {
      setBackendErrors([]);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    validateField(name as keyof SignUpForm, value);
  };

  const validateAll = (): boolean => {
    const nextErrors: Errors = {};
    (Object.keys(formData) as Array<keyof SignUpForm>).forEach((k) => {
      const msg = validateField(k, formData[k]);
      if (msg) nextErrors[k] = msg;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAll()) return;
    clearError();
    setBackendErrors([]);

    try {
      // Transform form data to match API payload structure
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          ...(formData.bio.trim() && { bio: formData.bio }),
        },
      };

      // Initiate registration - this will send OTP but not create user yet
      await initiateRegistration(payload);

      // Redirect to verification page with email as query param
      router.push(`/verifyemail?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      // Handle backend validation errors
      if (err instanceof AuthError && err.isValidationError) {
        // Extract field-specific errors from backend
        if (err.details && Array.isArray(err.details)) {
          setBackendErrors(err.details);

          // Map backend errors to form field errors
          const fieldErrors: Errors = {};
          err.details.forEach((detail: { field: string; message: string }) => {
            // Map nested field paths like 'profile.firstName' to 'firstName'
            const fieldName = detail.field.includes('.')
              ? detail.field.split('.').pop()
              : detail.field;

            if (fieldName && fieldName in formData) {
              fieldErrors[fieldName as keyof SignUpForm] = detail.message;
            }
          });
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }
      // Error is already handled and displayed in the UI
    }
  };

  const requiredKeys: Array<keyof SignUpForm> = [
    'username',
    'email',
    'password',
    'confirmPassword',
    'firstName',
    'lastName',
  ];

  const isFormValid =
    Object.values(errors).every((v) => !v) &&
    requiredKeys.every((k) => formData[k].trim().length > 0);

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center">
      <div className="w-full max-w-[600px] p-8 bg-(--card) rounded-lg shadow-[0_0_16px_rgba(0,0,0,0.12)]">
        <LeftAlignHeader>Sign Up</LeftAlignHeader>

        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit} noValidate>
          {authError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              {authError}
            </div>
          )}

          {backendErrors.length > 0 && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              <p className="font-semibold mb-2">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {backendErrors.map((error, idx) => (
                  <li key={idx}>{error.message}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="Username"
            />
            {errors.username && <p className="text-destructive text-sm mt-1">{errors.username}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium">First name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="First name"
              />
              {errors.firstName && (
                <p className="text-destructive text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Last name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="Last name"
              />
              {errors.lastName && (
                <p className="text-destructive text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="peerprepforlife@example.com"
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="Enter a strong password"
            />

            {(touched.password || formData.password.length > 0) && (
              <div className="mt-2 space-y-1">
                <div
                  className={`text-xs ${passwordConstraints.minLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  At least 6 characters
                </div>
                <div
                  className={`text-xs ${passwordConstraints.maxLength ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  Maximum 128 characters
                </div>
                <div
                  className={`text-xs ${passwordConstraints.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  One uppercase letter (A-Z)
                </div>
                <div
                  className={`text-xs ${passwordConstraints.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  One lowercase letter (a-z)
                </div>
                <div
                  className={`text-xs ${passwordConstraints.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  One number (0-9)
                </div>
                <div
                  className={`text-xs ${passwordConstraints.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  One special character (!@#$%^&*-_+=...)
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="Re-enter your password"
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Bio (Optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded resize-none"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <Button
              className="text-md"
              type="submit"
              variant="attention"
              size="lg"
              disabled={!isFormValid}
            >
              Sign Up
            </Button>
          </div>
        </form>

        <div className="mt-8 text-left">
          <span className="text-sm">
            Already have an account?
            <button
              type="button"
              className="bg-transparent border-0 text-sm text-attention underline p-0 ml-1 cursor-pointer hover:text-attention/90 disabled:opacity-50"
              onClick={() => router.push('/login')}
            >
              Login here
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
