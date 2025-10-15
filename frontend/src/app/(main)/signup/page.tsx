// ...existing code...
'use client';

import { Button } from '@/components/ui/button';
import LeftAlignHeader from '@/components/ui/Header';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

type SignUpForm = {
  username: string;
  last_name: string;
  first_name: string;
  country_code: string;
  phone_number: string;
  bio: string;
  avatar: string;
  email: string;
  password: string;
};

const initialForm: SignUpForm = {
  username: '',
  last_name: '',
  first_name: '',
  country_code: '',
  phone_number: '',
  bio: '',
  avatar: '',
  email: '',
  password: '',
};

type Errors = Partial<Record<keyof SignUpForm, string>>;

export default function SignUpPage(): React.JSX.Element {
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpForm>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpForm, boolean>>>({});

  const validators: Partial<Record<keyof SignUpForm, (v: string) => string | undefined>> = {
    username: (v) =>
      !v || v.trim().length === 0
        ? 'Username is required'
        : v.length < 3
          ? 'Username must be at least 3 characters'
          : undefined,
    last_name: (v) => (!v || v.trim() ? undefined : 'Last name is required'),
    first_name: (v) => (!v || v.trim() ? undefined : 'First name is required'),
    country_code: (v) =>
      !v || !/^\d{1,4}$/.test(v) ? 'Country code required (e.g. 65)' : undefined,
    phone_number: (v) =>
      !v || !/^\d{6,15}$/.test(v) ? 'Phone number required (digits only, 6-15 chars)' : undefined,
    email: (v) =>
      !v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Valid email is required' : undefined,
    password: (v) => (!v || v.length < 6 ? 'Password must be at least 6 characters' : undefined),
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

  const onSignUp = async (data: SignUpForm) => {
    // final check: ensure no field is null/empty
    if (!validateAll()) return;

    if (typeof window !== 'undefined') {
      const mockUser = {
        email: data.email.toLowerCase(),
        username: data.username || data.email.split('@')[0],
      };
      sessionStorage.setItem('mockUser', JSON.stringify(mockUser));
      window.dispatchEvent(new Event('mockUserChanged'));
    }

    router.push('/login');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSignUp(formData);
  };

  const requiredKeys: Array<keyof SignUpForm> = [
    'username',
    'last_name',
    'first_name',
    'country_code',
    'phone_number',
    'email',
    'password',
  ];

  const isFormValid =
    Object.values(errors).every((v) => !v) &&
    requiredKeys.every((k) => formData[k].trim().length > 0);

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center">
      <div className="w-full max-w-[600px] p-8 bg-(--card) rounded-lg shadow-[0_0_16px_rgba(0,0,0,0.12)]">
        <LeftAlignHeader>Sign Up</LeftAlignHeader>

        <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit} noValidate>
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
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="First name"
              />
              {errors.first_name && (
                <p className="text-destructive text-sm mt-1">{errors.first_name}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Last name</label>
              <input
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="Last name"
              />
              {errors.last_name && (
                <p className="text-destructive text-sm mt-1">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-28">
              <label className="text-sm font-medium">Country</label>
              <input
                name="country_code"
                value={formData.country_code}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="65"
              />
              {errors.country_code && (
                <p className="text-destructive text-sm mt-1">{errors.country_code}</p>
              )}
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Phone</label>
              <input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-border rounded"
                placeholder="12345678"
              />
              {errors.phone_number && (
                <p className="text-destructive text-sm mt-1">{errors.phone_number}</p>
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
              placeholder="At least 6 characters"
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="Short bio"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Avatar URL</label>
            <input
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-3 py-2 border border-border rounded"
              placeholder="https://[avatarname].com"
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
      </div>
    </div>
  );
}
