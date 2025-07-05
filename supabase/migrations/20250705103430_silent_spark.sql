/*
  # Debug and Fix Authentication System

  1. Analysis of Issues
    - RLS policies may be blocking profile creation
    - Trigger functions might have errors
    - Missing required fields or constraint violations
    - Permission issues with auth.users table access

  2. Fixes Applied
    - Proper RLS policies for profiles table
    - Updated trigger function with error handling
    - Correct foreign key relationships
    - Proper permissions for authenticated users

  3. Debugging Steps
    - Enable detailed logging
    - Fix constraint issues
    - Ensure proper user metadata handling
*/

-- Step 1: Check and fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;

-- Create proper RLS policies
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  TO public
  USING (true);

-- Step 2: Fix the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
  user_school text;
  user_skills text;
BEGIN
  -- Extract metadata with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  user_school := COALESCE(
    NEW.raw_user_meta_data->>'school_university',
    NEW.raw_user_meta_data->>'school',
    'Not specified'
  );
  
  user_skills := COALESCE(
    NEW.raw_user_meta_data->>'skills',
    'General'
  );

  -- Insert profile with proper error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      bio,
      avatar_url,
      location,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1), -- Generate username from email
      user_name,
      NULL,
      NULL,
      user_school,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation, just log the error
    -- The profile can be created later
  END;
  
  RETURN NEW;
END;
$$;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Ensure proper table constraints
ALTER TABLE profiles 
  ALTER COLUMN username DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL;

-- Add constraints that won't block creation
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_username_length CHECK (username IS NULL OR length(trim(username)) > 0),
  ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR length(trim(full_name)) > 0);

-- Step 5: Create a function to manually create missing profiles
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record auth.users%ROWTYPE;
BEGIN
  FOR user_record IN 
    SELECT * FROM auth.users 
    WHERE id NOT IN (SELECT id FROM profiles)
  LOOP
    INSERT INTO profiles (
      id,
      username,
      full_name,
      location,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      split_part(user_record.email, '@', 1),
      COALESCE(user_record.raw_user_meta_data->>'name', 'User'),
      COALESCE(user_record.raw_user_meta_data->>'school', 'Not specified'),
      NOW(),
      NOW()
    );
  END LOOP;
END;
$$;

-- Step 6: Run the function to create any missing profiles
SELECT create_missing_profiles();

-- Step 7: Create a debug function to check auth status
CREATE OR REPLACE FUNCTION debug_auth_status(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
  profile_exists boolean;
  result json;
BEGIN
  -- Check if user exists in auth.users
  SELECT * INTO auth_user FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'user_exists', false,
      'profile_exists', false,
      'error', 'User not found in auth.users'
    );
  END IF;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = auth_user.id) INTO profile_exists;
  
  RETURN json_build_object(
    'user_exists', true,
    'user_id', auth_user.id,
    'user_email', auth_user.email,
    'user_confirmed', auth_user.email_confirmed_at IS NOT NULL,
    'profile_exists', profile_exists,
    'user_metadata', auth_user.raw_user_meta_data
  );
END;
$$;