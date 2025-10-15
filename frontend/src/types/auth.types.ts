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
  lastLogin: string;
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
}
