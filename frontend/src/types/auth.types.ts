/**
 * Authentication Types
 */

export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  profile: {
    firstName: string;
    lastName: string;
    fullName: string;
    bio: string;
    avatar: string | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio?: string;
  };
}

export interface AuthResponse {
  message: string;
  data: {
    expiresIn: number;
    tokenReused: boolean;
    user: User;
  };
}

export interface SendOTPResponse {
  message: string;
  data: {
    email: string;
    expiryMinutes: number;
  };
}

export interface VerifyTokenResponse {
  message: string;
  data: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  clearError: () => void;
  verifySession: () => Promise<boolean>;
  initiateRegistration: (credentials: RegisterCredentials) => Promise<SendOTPResponse>;
  completeRegistration: (email: string, otp: string) => Promise<AuthResponse>;
  resendRegistrationOTP: (email: string) => Promise<SendOTPResponse>;
  updateUser: (updatedUser: Partial<User>) => void;
  initiatePasswordReset: (email: string) => Promise<SendOTPResponse>;
  verifyPasswordResetOTP: (email: string, otp: string) => Promise<SendOTPResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<AuthResponse>;
  resendPasswordResetOTP: (email: string) => Promise<SendOTPResponse>;
}
