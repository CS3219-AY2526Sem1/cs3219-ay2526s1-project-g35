'use client';

import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const { login, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
      // Don't manually navigate - let the layout handle it when isAuthenticated changes
    } catch (err) {
      // Error is already set in AuthContext and displayed in the UI
    }
  };

  const onSignUp = () => {
    router.push('/signup');
  };

  const onResetPassword = () => {
    router.push('/resetpassword');
  };

  return (
    <div className="min-h-(--hscreen) flex items-center justify-center">
      <div className="w-full max-w-[500px] p-10 bg-(--card) rounded-lg shadow-[0_0_16px_rgba(0,0,0,0.12)]">
        <Header>Login</Header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-left">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="eg. peerprepforlife@gmail.com"
              className="py-3 px-4 border rounded-md text-base placeholder-muted-foreground transition-colors duration-200 focus:outline-none focus:border-attention"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-left">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="py-3 px-4 border rounded-md text-base placeholder-muted-foreground transition-colors duration-200 focus:outline-none focus:border-attention"
              required
            />
          </div>

          <div className="flex items-center justify-between mt-2.5">
            <Button className="text-md" type="submit" variant="attention" size="lg">
              Login
            </Button>
            <button
              type="button"
              className="bg-transparent border-0 text-sm underline p-0 cursor-pointer hover:text-attention disabled:opacity-50"
              onClick={onResetPassword}
            >
              Reset your password
            </button>
          </div>
        </form>

        <div className="mt-8 text-left">
          <span className="text-sm">
            Don&apos;t have an account?
            <button
              type="button"
              className="bg-transparent border-0 text-sm text-attention underline p-0 ml-1 cursor-pointer hover:text-attention/90 disabled:opacity-50"
              onClick={onSignUp}
            >
              Sign up here now!
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
