/*
  # Fix RLS policies for profiles table

  1. Security Updates
    - Drop existing problematic INSERT policies
    - Create proper INSERT policy for authenticated users
    - Ensure policies use correct auth.uid() function
    - Maintain existing SELECT and UPDATE policies that work correctly

  2. Changes
    - Remove duplicate and incorrect INSERT policies
    - Add single, correct INSERT policy for authenticated users
    - Keep existing working policies intact
*/

-- Drop the existing problematic INSERT policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;

-- Create a proper INSERT policy for authenticated users
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure the existing SELECT and UPDATE policies are correct
-- (These appear to be working based on the schema, but let's make sure they use auth.uid())

-- Drop and recreate the UPDATE policy to ensure it uses auth.uid()
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- The SELECT policies look correct, but let's ensure the authenticated user one uses auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);