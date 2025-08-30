'use server';

import { saveUserProfile, getUserProfile, ProfileFormData } from '@/lib/profile';

// Save profile action
export async function saveProfile(userId: number, profileData: ProfileFormData) {
  console.log('saveProfile action called with:', { userId, profileData });
  
  if (!userId) {
    console.log('Error: No userId provided');
    return { success: false, message: '用户未登录' };
  }

  if (!profileData.jobType || !profileData.experienceLevel) {
    console.log('Error: Missing required fields');
    return { success: false, message: '请填写必填字段' };
  }

  console.log('Calling saveUserProfile...');
  const result = await saveUserProfile(userId, profileData);
  console.log('saveUserProfile result:', result);
  return result;
}

// Get profile action
export async function getProfile(userId: number) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }

  return getUserProfile(userId);
} 