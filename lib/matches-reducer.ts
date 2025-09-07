import type { Match } from '@/lib/store';

/**
 * Matches页面的状态类型
 */
export interface MatchesState {
  potentialMatches: Match[];
  currentMatchIndex: number;
  successfulMatches: Match[];
  isLoading: boolean;
  activeTab: string;
  interviewStatus: { [key: number]: 'yes' | 'no' | undefined };
  feedbacks: { [key: number]: string };
  submitted: { [key: number]: boolean };
  showBanner: boolean;
  showGuide: boolean;
  showContactTemplates: boolean;
  selectedMatch: Match | null;
}

/**
 * 初始状态
 */
export const initialMatchesState: MatchesState = {
  potentialMatches: [],
  currentMatchIndex: 0,
  successfulMatches: [],
  isLoading: true,
  activeTab: 'browse',
  interviewStatus: {},
  feedbacks: {},
  submitted: {},
  showBanner: true,
  showGuide: false,
  showContactTemplates: false,
  selectedMatch: null,
};

/**
 * Action类型定义
 */
export type MatchesAction =
  | { type: 'LOAD_MATCHES'; payload: { potentialMatches: Match[]; successfulMatches: Match[] } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_MATCH' }
  | { type: 'SET_TAB'; payload: string }
  | { type: 'SET_INTERVIEW_STATUS'; payload: { matchId: number; status: 'yes' | 'no' } }
  | { type: 'SET_FEEDBACK'; payload: { matchId: number; feedback: string } }
  | { type: 'SUBMIT_FEEDBACK'; payload: number }
  | { type: 'REVERT_FEEDBACK_SUBMISSION'; payload: number }
  | { type: 'TOGGLE_BANNER' }
  | { type: 'TOGGLE_GUIDE' }
  | { type: 'SHOW_CONTACT_TEMPLATES'; payload: Match | null }
  | { type: 'ADD_SUCCESSFUL_MATCH'; payload: Match }
  | { type: 'RESET_MATCHES' };

/**
 * Reducer函数
 */
export function matchesReducer(state: MatchesState, action: MatchesAction): MatchesState {
  switch (action.type) {
    case 'LOAD_MATCHES':
      return {
        ...state,
        potentialMatches: action.payload.potentialMatches,
        successfulMatches: action.payload.successfulMatches,
        currentMatchIndex: 0,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'NEXT_MATCH':
      return {
        ...state,
        currentMatchIndex: state.currentMatchIndex + 1,
      };

    case 'SET_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };

    case 'SET_INTERVIEW_STATUS':
      return {
        ...state,
        interviewStatus: {
          ...state.interviewStatus,
          [action.payload.matchId]: action.payload.status,
        },
      };

    case 'SET_FEEDBACK':
      return {
        ...state,
        feedbacks: {
          ...state.feedbacks,
          [action.payload.matchId]: action.payload.feedback,
        },
      };

    case 'SUBMIT_FEEDBACK':
      return {
        ...state,
        submitted: {
          ...state.submitted,
          [action.payload]: true,
        },
      };

    case 'REVERT_FEEDBACK_SUBMISSION':
      return {
        ...state,
        submitted: {
          ...state.submitted,
          [action.payload]: false,
        },
      };

    case 'TOGGLE_BANNER':
      return {
        ...state,
        showBanner: !state.showBanner,
      };

    case 'TOGGLE_GUIDE':
      return {
        ...state,
        showGuide: !state.showGuide,
      };

    case 'SHOW_CONTACT_TEMPLATES':
      return {
        ...state,
        showContactTemplates: action.payload !== null,
        selectedMatch: action.payload,
      };

    case 'ADD_SUCCESSFUL_MATCH':
      return {
        ...state,
        successfulMatches: [...state.successfulMatches, action.payload],
        currentMatchIndex: state.currentMatchIndex + 1,
      };

    case 'RESET_MATCHES':
      return {
        ...state,
        potentialMatches: [],
        currentMatchIndex: 0,
      };

    default:
      return state;
  }
}