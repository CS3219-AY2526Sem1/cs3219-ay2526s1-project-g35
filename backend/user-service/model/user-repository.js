import 'dotenv/config';
import mongoose from 'mongoose';
import userModel from './user-model.js';

/**
 * Database Connection
 */
export async function connectToDB() {
  let mongoDBUri = process.env.ENV === 'PROD' ? process.env.DB_CLOUD_URI : process.env.DB_LOCAL_URI;

  await mongoose.connect(mongoDBUri);
}

export class UserRepository {
  /**
   *  Create a new user
   */

  static async createUser(userData) {
    try {
      const user = new userModel(userData);
      return await user.save();
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await userModel.findById(id).select('-password');
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by ID including password
   */
  static async findByIdWithPassword(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      return await userModel.findById(id);
    } catch (error) {
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      return await userModel.findOne({
        email: email.toLowerCase(),
      });
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    try {
      return await userModel.findOne({ username }).select('-password');
    } catch (error) {
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  /**
   * Find user by username or email
   */
  static async findByUsernameOrEmail(username, email) {
    try {
      return await userModel.findOne({
        $or: [{ username }, { email: email?.toLowerCase() }],
      });
    } catch (error) {
      throw new Error(`Failed to find user by username or email: ${error.message}`);
    }
  }

  /**
   * Search users with pagination support (admin only)
   */
  static async searchUsers({ searchTerm = '', page = 1, pageSize = 10, role = 'all' }) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
      const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;

      const filter = {};
      if (searchTerm.trim().length > 0) {
        filter.$or = [
          { username: { $regex: searchTerm.trim(), $options: 'i' } },
          { email: { $regex: searchTerm.trim(), $options: 'i' } },
        ];
      }

      const normalizedRole = typeof role === 'string' ? role.toLowerCase() : 'all';
      if (normalizedRole === 'admin') {
        filter.isAdmin = true;
      } else if (normalizedRole === 'user') {
        filter.isAdmin = false;
      }

      const total = await userModel.countDocuments(filter);
      const totalPages = Math.max(1, Math.ceil(total / safePageSize));
      const currentPage = Math.min(safePage, totalPages);
      const skip = (currentPage - 1) * safePageSize;

      const users = await userModel
        .find(filter)
        .select('-password')
        .sort({ updatedAt: -1, _id: 1 })
        .skip(skip)
        .limit(safePageSize);

      return {
        users,
        total,
        page: currentPage,
        pageSize: safePageSize,
        totalPages,
      };
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(id, hashedPassword) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const user = await userModel
        .findByIdAndUpdate(id, { $set: { password: hashedPassword } }, { new: true })
        .select('-password');

      return user;
    } catch (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Update user privilege
   */
  static async updatePrivilege(id, isAdmin) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const user = await userModel
        .findByIdAndUpdate(id, { $set: { isAdmin } }, { new: true })
        .select('-password');

      return user;
    } catch (error) {
      throw new Error(`Failed to update user privilege: ${error.message}`);
    }
  }

  /**
   * Delete user by ID (Hard delete)
   */
  static async deleteById(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const user = await userModel.findByIdAndDelete(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Check if user exists by email
   */
  static async existsByEmail(email) {
    try {
      const user = await userModel.findOne({ email: email.toLowerCase() });
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check if user exists: ${error.message}`);
    }
  }

  /**
   * Check if user exists by username
   */
  static async existsByUsername(username) {
    try {
      const user = await userModel.findOne({ username });
      return !!user;
    } catch (error) {
      throw new Error(`Failed to check if user exists: ${error.message}`);
    }
  }

  /**
   * Soft delete user (mark as inactive instead of deleting)
   */
  static async softDelete(id) {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      const user = await userModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              isActive: false,
              deletedAt: new Date(),
            },
          },
          { new: true },
        )
        .select('-password');

      return user;
    } catch (error) {
      throw new Error(`Failed to soft delete user: ${error.message}`);
    }
  }

  /**
   * Update user by ID with provided data
   */
  static async updateById(id, updateData) {
    try {
      console.log(`Updating user ${id} with data:`, updateData);

      const user = await userModel
        .findByIdAndUpdate(
          id,
          { ...updateData, updatedAt: new Date() },
          { new: true, runValidators: true },
        )
        .select('-password');

      console.log(
        `Update result for user ${id}:`,
        user ? `Success - isVerified: ${user.isVerified}` : 'User not found',
      );
      return user;
    } catch (error) {
      console.error(`Error in updateById for user ${id}:`, error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }
}
