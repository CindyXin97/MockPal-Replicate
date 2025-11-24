-- Migration: Add preferred_communication_language to user_profiles and user_profile_history
-- Date: 2025-01-XX
-- Description: Add language preference field for matching priority

-- Add column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS preferred_communication_language VARCHAR(50);

-- Add column to user_profile_history table
ALTER TABLE user_profile_history 
ADD COLUMN IF NOT EXISTS preferred_communication_language VARCHAR(50);

-- Add comment to document the field
COMMENT ON COLUMN user_profiles.preferred_communication_language IS '交流语言偏好：不限制/中文/英文';
COMMENT ON COLUMN user_profile_history.preferred_communication_language IS '交流语言偏好：不限制/中文/英文';

