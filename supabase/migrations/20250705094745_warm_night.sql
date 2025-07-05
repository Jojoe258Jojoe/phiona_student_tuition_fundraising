/*
  # Fix profiles table RLS policy

  1. Security Updates
    - Drop existing INSERT policy that's causing issues
    - Create new INSERT policy with proper conditions for authenticated users
    - Ensure users can only insert their own profile data

  2. Policy Changes
    - Allow authenticated users to insert profiles where the profile ID matches their auth ID
    - This resolves the "new row violates row-level security policy" error
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a new INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the SELECT policy for own profile is properly configured
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure the UPDATE policy is properly configured
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);