/**
 * User Types
 */

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  bio?: string;
  avatar?: string | null;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  profile: UserProfile;
}

export interface UserProfileResponse {
  message: string;
  data: UserData;
}

export interface UpdateUserProfilePayload {
  username?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
  };
}

export interface UpdateUserProfileResponse {
  message: string;
  data: UserData;
}
