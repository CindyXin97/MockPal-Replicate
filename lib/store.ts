import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Types
export type User = {
  id: number;
  username: string;
};

export type Match = {
  id: number;
  username: string;
  jobType?: string | null;
  experienceLevel?: string | null;
  targetCompany?: string | null;
  targetIndustry?: string | null;
  practicePreferences?: {
    technicalInterview?: boolean | null;
    behavioralInterview?: boolean | null;
    caseAnalysis?: boolean | null;
  };
  contactInfo?: {
    email?: string | null;
    wechat?: string | null;
    linkedin?: string | null;
  };
  bio?: string | null;
};

// Auth state
export const isAuthenticatedAtom = atomWithStorage('isAuthenticated', false);
export const userAtom = atomWithStorage<User | null>('user', null);

// Profile state
export const hasProfileAtom = atom(false);

// Matching state
export const potentialMatchesAtom = atom<Match[]>([]);
export const currentMatchIndexAtom = atom(0);
export const successfulMatchesAtom = atom<Match[]>([]);

// UI state
export const isLoadingAtom = atom(false);
export const toastMessageAtom = atom<{ type: 'success' | 'error'; message: string } | null>(null); 