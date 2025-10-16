import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Types
export type User = {
  id: number;
  username: string;
};

export type UserProfile = {
  id?: number;
  userId: number;
  name?: string;
  jobType?: 'DA' | 'DS' | 'DE' | 'BA';
  experienceLevel?: '实习' | '应届' | '1-3年' | '3-5年' | '5年以上';
  targetCompany?: string;
  targetIndustry?: string;
  otherCompanyName?: string;
  technicalInterview?: boolean;
  behavioralInterview?: boolean;
  caseAnalysis?: boolean;
  statsQuestions?: boolean;
  email?: string;
  wechat?: string;
  linkedin?: string;
  bio?: string;
  school?: string; // 学校信息
  skills?: string[]; // 技能列表
  createdAt?: Date;
  updatedAt?: Date;
};

export type Match = {
  id: number;
  matchId?: number; // 匹配记录ID，用于状态更新
  username: string | null;
  jobType?: string | null;
  experienceLevel?: string | null;
  targetCompany?: string | null;
  targetIndustry?: string | null;
  practicePreferences?: {
    technicalInterview?: boolean | null;
    behavioralInterview?: boolean | null;
    caseAnalysis?: boolean | null;
    statsQuestions?: boolean | null;
  };
  contactInfo?: {
    email?: string | null;
    wechat?: string | null;
    linkedin?: string | null;
  };
  bio?: string | null;
  skills?: string[] | null; // 技能列表
  // 新增状态跟踪字段
  contactStatus?: string | null;
  contactUpdatedAt?: string | null;
  createdAt?: string | null;
  // 反馈信息
  feedback?: {
    interviewStatus: string;
    content: string | null;
    createdAt: string;
  } | null;
};

// Auth state
export const isAuthenticatedAtom = atomWithStorage('isAuthenticated', false);
export const userAtom = atomWithStorage<User | null>('user', null);

// Profile state - 添加持久化的profile缓存
export const userProfileAtom = atomWithStorage<UserProfile | null>('userProfile', null);
export const hasProfileAtom = atom(false);

// Matching state
export const potentialMatchesAtom = atom<Match[]>([]);
export const currentMatchIndexAtom = atom(0);
export const successfulMatchesAtom = atom<Match[]>([]);

// UI state
export const isLoadingAtom = atom(false);
export const toastMessageAtom = atom<{ type: 'success' | 'error'; message: string } | null>(null);