import { eq, and, or, inArray } from 'drizzle-orm';
import { matches } from '@/lib/db/schema';

/**
 * 查询两个用户之间的匹配记录（双向查询）
 */
export function matchBetweenUsers(userId1: number, userId2: number) {
  return or(
    and(eq(matches.user1Id, userId1), eq(matches.user2Id, userId2)),
    and(eq(matches.user1Id, userId2), eq(matches.user2Id, userId1))
  );
}

/**
 * 查询某个用户的所有匹配记录
 */
export function matchesForUser(userId: number, status?: 'pending' | 'accepted' | 'rejected') {
  const userCondition = or(
    eq(matches.user1Id, userId),
    eq(matches.user2Id, userId)
  );
  
  return status 
    ? and(userCondition, eq(matches.status, status))
    : userCondition;
}

/**
 * 批量查询用户ID对应的匹配
 */
export function matchesWithUsers(userId: number, userIds: number[], status?: string) {
  const condition = and(
    eq(matches.user2Id, userId),
    inArray(matches.user1Id, userIds)
  );
  
  return status
    ? and(condition, eq(matches.status, status))
    : condition;
}

/**
 * 统一错误响应格式
 */
export function errorResponse(message: string, error?: any) {
  if (error) {
    console.error(message, error);
  }
  return { 
    success: false, 
    message: message || '操作失败，请稍后再试' 
  };
}

/**
 * 统一成功响应格式
 */
export function successResponse<T = any>(data?: T, message?: string) {
  return {
    success: true,
    message,
    ...data
  };
}