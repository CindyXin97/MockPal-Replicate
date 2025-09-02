'use server';

import { saveUserProfile, getUserProfile, ProfileFormData } from '@/lib/profile';

// Save profile action
export async function saveProfile(userId: number, profileData: Partial<ProfileFormData>) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }

  return saveUserProfile(userId, profileData);
}

// Get profile action
export async function getProfile(userId: number) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }

  return getUserProfile(userId);
} 