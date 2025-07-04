/*
  # User Authentication and Profile System

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `school` (text)
      - `skills` (text array)
      - `total_earnings` (decimal, default 0)
      - `competitions_won` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `competitions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text)
      - `prize_amount` (decimal)
      - `status` (text)
      - `start_date` (timestamp)
      - `end_date` (timestamp)
      - `max_participants` (integer)
      - `created_at` (timestamp)
    
    - `competition_participants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `competition_id` (uuid, references competitions)
      - `joined_at` (timestamp)
      - `submission_url` (text, optional)
      - `rank` (integer, optional)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to competitions
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  school text,
  skills text[],
  total_earnings decimal DEFAULT 0,
  competitions_won integer DEFAULT 0,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create competitions table
CREATE TABLE IF NOT EXISTS competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  prize_amount decimal NOT NULL,
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  max_participants integer,
  participant_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create competition participants table
CREATE TABLE IF NOT EXISTS competition_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  competition_id uuid REFERENCES competitions(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  submission_url text,
  rank integer,
  UNIQUE(user_id, competition_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Competitions policies
CREATE POLICY "Anyone can view competitions"
  ON competitions
  FOR SELECT
  TO authenticated
  USING (true);

-- Competition participants policies
CREATE POLICY "Users can view own participations"
  ON competition_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join competitions"
  ON competition_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participations"
  ON competition_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample competitions
INSERT INTO competitions (title, description, category, prize_amount, status, start_date, end_date, max_participants) VALUES
('Full Stack Challenge', 'Build a complete web application in 48 hours', 'coding', 25000, 'live', now() - interval '1 day', now() + interval '1 day', 1000),
('UI/UX Innovation', 'Design the future of mobile interfaces', 'design', 15000, 'upcoming', now() + interval '5 days', now() + interval '12 days', 500),
('Tech Article Contest', 'Write engaging tech articles for the community', 'writing', 10000, 'live', now() - interval '2 days', now() + interval '5 days', 300),
('Algorithm Olympics', 'Solve complex mathematical problems', 'math', 30000, 'live', now() - interval '1 day', now() + interval '2 days', 2000);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, school, skills)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'school', ''),
    CASE 
      WHEN new.raw_user_meta_data->>'skills' IS NOT NULL 
      THEN string_to_array(new.raw_user_meta_data->>'skills', ',')
      ELSE ARRAY[]::text[]
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();