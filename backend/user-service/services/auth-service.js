import argon2 from 'argon2';
import { UserRepository } from '../model/user-repository.js';

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email, password) {
  if (!email || !password) {
    throw new Error('MISSING_CREDENTIALS');
  }

  const user = await UserRepository.findByEmail(email.toLowerCase());

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const match = await argon2.verify(user.password, password);

  if (!match) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return user;
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId) {
  return await UserRepository.updateById(userId, {
    lastLogin: new Date(),
  });
}

/**
 * Perform complete login flow
 * Authenticates user and updates last login
 */
export async function performLogin(email, password) {
  const user = await authenticateUser(email, password);
  const updatedUser = await updateLastLogin(user.id);

  return updatedUser || user;
}
