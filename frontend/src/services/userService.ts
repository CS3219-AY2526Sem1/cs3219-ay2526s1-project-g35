/**
 * User Service for User Profile Management
 */

// Type definitions

interface UserProfile {
  id?: string;
  _id?: string;
  username: string;
  email?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
}

interface UserData {
  userId: string;
  username: string;
}

class UserService {
  private userServiceUrl: string;

  constructor() {
    this.userServiceUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Fetch the current user's profile using the access token from cookies
   * @returns User data (userId and username) or null if not authenticated
   */
  async getCurrentUser(): Promise<UserData | null> {
    try {
      console.log('[UserService] Fetching from:', `${this.userServiceUrl}/api/users/profile`);
      
      const response = await fetch(`${this.userServiceUrl}/api/users/profile`, {
        method: 'GET',
        credentials: 'include', // Include cookies (access token)
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('[UserService] Response status:', response.status);
      
      if (!response.ok) {
        console.warn('Failed to fetch user profile:', response.status);
        return null;
      }

      const result = await response.json();
      console.log('[UserService] Response data:', result);
      const userData: UserProfile = result.data; // Extract data from response wrapper
      
      return {
        userId: userData.id || userData._id || '',
        username: userData.username,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  /**
   * Generate random user data as fallback
   * @returns Random user data
   */
  generateRandomUser(): UserData {
    return {
      userId: 'user-' + Math.random().toString(36).substr(2, 9),
      username: 'User' + Math.floor(Math.random() * 1000),
    };
  }

  /**
   * Get user data - fetches from API or generates random data as fallback
   * @returns User data
   */
  async getUserData(): Promise<UserData> {
    const userData = await this.getCurrentUser();
    
    if (userData) {
      return userData;
    }

    // Fallback to random user data if auth fails
    return this.generateRandomUser();
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
