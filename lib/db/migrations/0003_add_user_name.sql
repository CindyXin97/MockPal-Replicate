-- Add user_id column
ALTER TABLE users ADD COLUMN user_id SERIAL NOT NULL UNIQUE;

-- Add user_name column
ALTER TABLE users ADD COLUMN user_name VARCHAR(255);

-- Update existing records to set user_id equal to id
UPDATE users SET user_id = id; 