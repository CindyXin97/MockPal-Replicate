import { useAtom } from 'jotai';
import { useEffect, useCallback, useRef, useState } from 'react';
import { userProfileAtom } from '@/lib/store';
import { getProfile, saveProfile } from '@/app/actions/profile';
import { ProfileFormData } from '@/lib/profile';

export function useProfile(userId?: number) {
  // 将请求去重Map移到hook内部，避免内存泄漏
  const pendingRequestsRef = useRef(new Map<number, Promise<any>>());
  const [profile, setProfile] = useAtom(userProfileAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  // 加载profile（带简单去重）
  const fetchProfile = useCallback(async (forceRefresh = false) => {
    if (!userId || userId <= 0) return;

    // 如果已有缓存且不强制刷新，直接返回
    if (profile && !forceRefresh) return;
    
    // 如果已经尝试过加载且不强制刷新，避免重复请求
    if (hasAttempted && !forceRefresh) return;

    // 请求去重：如果正在请求中，等待现有请求
    const cacheKey = userId;
    const pendingRequests = pendingRequestsRef.current;
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    setIsLoading(true);
    const request = getProfile(userId).then(result => {
      setIsLoading(false);
      setHasAttempted(true);
      
      if (result.success && 'profile' in result && result.profile) {
        setProfile(result.profile);
      } else {
        // 新用户没有profile数据，设置一个空的profile对象表示已加载
        setProfile(null);
      }
      pendingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      setIsLoading(false);
      setHasAttempted(true);
      pendingRequests.delete(cacheKey);
      throw error;
    });

    pendingRequests.set(cacheKey, request);
    return request;
  }, [userId, profile, hasAttempted, setProfile]);

  // 保存profile（同时更新缓存）
  const updateProfile = useCallback(async (profileData: Partial<ProfileFormData>) => {
    if (!userId) throw new Error('用户未登录');

    const result = await saveProfile(userId, profileData);
    if (result.success) {
      // 立即更新本地缓存
      setProfile(prev => ({ 
        ...prev, 
        userId, 
        ...profileData 
      }));
    }
    return result;
  }, [userId, setProfile]);

  // 清除profile缓存
  const clearProfile = useCallback(() => {
    setProfile(null);
  }, [setProfile]);

  // 检查profile完整性
  const isComplete = profile ? 
    !!(profile.name && profile.jobType && profile.experienceLevel && 
       profile.targetCompany && profile.targetIndustry &&
       (profile.technicalInterview || profile.behavioralInterview || profile.caseAnalysis) &&
       (profile.email || profile.wechat || profile.linkedin)) : false;

  // 自动加载profile
  useEffect(() => {
    if (userId && userId > 0 && !hasAttempted && !isLoading) {
      fetchProfile();
    }
  }, [userId, hasAttempted, isLoading, fetchProfile]);

  // 清理请求Map，防止内存泄漏
  useEffect(() => {
    return () => {
      pendingRequestsRef.current.clear();
    };
  }, []);

  // 当userId变化时重置状态
  useEffect(() => {
    if (userId) {
      setHasAttempted(false);
      setIsLoading(false);
    }
  }, [userId]);

  return {
    profile,
    isLoading,
    isComplete,
    fetchProfile,
    updateProfile,
    clearProfile
  };
}