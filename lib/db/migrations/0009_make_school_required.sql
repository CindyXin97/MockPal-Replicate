-- Make school field required by setting default value for existing records
UPDATE user_profiles SET school = '未填写' WHERE school IS NULL;

-- Make school field NOT NULL
ALTER TABLE user_profiles ALTER COLUMN school SET NOT NULL;
