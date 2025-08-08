// 共享的emailTokens存储
export const emailTokens = new Map<string, { 
  email: string; 
  expires: number; 
  userId?: number;
}>();