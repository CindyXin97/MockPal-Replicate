'use server';

import { getPotentialMatches, createMatch, rejectMatch, getSuccessfulMatches, saveFeedback } from '@/lib/matching';

// Get potential matches action
export async function fetchPotentialMatches(userId: number) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }

  return getPotentialMatches(userId);
}

// Like a user action
export async function likeUser(userId: number, targetUserId: number) {
  if (!userId || !targetUserId) {
    return { success: false, message: '无效的用户信息' };
  }

  return createMatch(userId, targetUserId);
}

// Dislike a user action
export async function dislikeUser(userId: number, targetUserId: number) {
  if (!userId || !targetUserId) {
    return { success: false, message: '无效的用户信息' };
  }

  return rejectMatch(userId, targetUserId);
}

// Get successful matches action
export async function fetchSuccessfulMatches(userId: number) {
  if (!userId) {
    return { success: false, message: '用户未登录' };
  }

  return getSuccessfulMatches(userId);
}

// 保存面试反馈 action
export async function saveFeedbackAction({ matchId, userId, contactStatus, interviewStatus, content }: { matchId: number, userId: number, contactStatus?: string, interviewStatus: string, content?: string }) {
  if (!matchId || !userId || !interviewStatus) {
    return { success: false, message: '参数不完整' };
  }
  return saveFeedback({ matchId, userId, contactStatus, interviewStatus, content });
} 