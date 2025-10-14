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

    // 如果强制刷新，清除缓存状态
    if (forceRefresh) {
      console.log('🔄 强制刷新 profile，清除缓存');
      setHasAttempted(false);
    }

    // 如果已有缓存且不强制刷新，直接返回
    if (profile && !forceRefresh) {
      console.log('📦 使用缓存的 profile');
      return;
    }
    
    // 如果已经尝试过加载且不强制刷新，避免重复请求
    if (hasAttempted && !forceRefresh) {
      console.log('⏭️ 已尝试加载，跳过');
      return;
    }

    // 请求去重：如果正在请求中，等待现有请求
    const cacheKey = userId;
    const pendingRequests = pendingRequestsRef.current;
    if (pendingRequests.has(cacheKey) && !forceRefresh) {
      console.log('⏳ 等待现有请求');
      return pendingRequests.get(cacheKey);
    }

    console.log('🌐 开始从服务器加载 profile');
    setIsLoading(true);
    const request = getProfile(userId).then(result => {
      setIsLoading(false);
      setHasAttempted(true);
      
      if (result.success && 'profile' in result && result.profile) {
        console.log('✅ Profile 加载成功');
        setProfile(result.profile);
      } else {
        console.log('❌ Profile 加载失败或不存在');
        // 新用户没有profile数据，设置一个空的profile对象表示已加载
        setProfile(null);
      }
      pendingRequests.delete(cacheKey);
      return result;
    }).catch(error => {
      console.error('❌ Profile 加载错误:', error);
      setIsLoading(false);
      setHasAttempted(true);
      pendingRequests.delete(cacheKey);
      throw error;
    });

    pendingRequests.set(cacheKey, request);
    return request;
  }, [userId, profile, hasAttempted, setProfile]);

  // 保存profile（保存后重新加载以确保数据一致性）
  const updateProfile = useCallback(async (profileData: Partial<ProfileFormData>) => {
    if (!userId) throw new Error('用户未登录');

    const result = await saveProfile(userId, profileData);
    if (result.success) {
      // 保存成功后，重新从数据库加载最新数据，确保数据一致性
      console.log('✅ Profile 保存成功，重新加载数据...');
      const refreshResult = await getProfile(userId);
      if (refreshResult.success && 'profile' in refreshResult && refreshResult.profile) {
        console.log('📥 重新加载的 profile:', refreshResult.profile);
        setProfile(refreshResult.profile);
      }
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
      // 检查缓存的 profile 是否属于当前用户
      if (profile && profile.userId !== userId) {
        console.log('⚠️ 检测到用户切换，清除旧用户的缓存数据');
        setProfile(null);
        setHasAttempted(false);
      }
      fetchProfile();
    }
  }, [userId, hasAttempted, isLoading, fetchProfile, profile, setProfile]);

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