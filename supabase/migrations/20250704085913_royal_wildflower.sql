/*
  # Create registered_hackathons table

  1. New Tables
    - `registered_hackathons`
      - `id` (uuid, primary key)
      - `hackathon_name` (text, not null)
      - `user_id` (uuid, foreign key to profiles)
      - `registration_timestamp` (timestamptz, default now)
      - `registration_status` (text, default 'completed')
      - `full_name` (text, not null)
      - `email` (text, not null)
      - `university` (text, not null)
      - `skillset` (text, not null)
      - `experience` (text, not null)
      - `project_interest` (text)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `registered_hackathons` table
    - Add policy for users to insert their own registrations
    - Add policy for users to view their own registrations
    - Add policy for authenticated users to view all registrations (for admin purposes)

  3. Constraints
    - Check constraint for valid registration status
    - Check constraint for non-empty hackathon name
    - Unique constraint on user_id + hackathon_name to prevent duplicate registrations
*/

CREATE TABLE IF NOT EXISTS registered_hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_name text NOT NULL CHECK (length(trim(hackathon_name)) > 0),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  registration_timestamp timestamptz DEFAULT timezone('utc'::text, now()),
  registration_status text DEFAULT 'completed' CHECK (registration_status IN ('pending', 'completed', 'cancelled')),
  full_name text NOT NULL CHECK (length(trim(full_name)) > 0),
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  university text NOT NULL CHECK (length(trim(university)) > 0),
  skillset text NOT NULL CHECK (length(trim(skillset)) > 0),
  experience text NOT NULL CHECK (experience IN ('first-time', 'some', 'many')),
  project_interest text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, hackathon_name)
);

ALTER TABLE registered_hackathons ENABLE ROW LEVEL SECURITY;

-- Users can insert their own registrations
CREATE POLICY "Users can insert their own hackathon registrations"
  ON registered_hackathons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own registrations
CREATE POLICY "Users can view their own hackathon registrations"
  ON registered_hackathons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update their own hackathon registrations"
  ON registered_hackathons
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can view registration counts (for display purposes)
CREATE POLICY "Public can view registration statistics"
  ON registered_hackathons
  FOR SELECT
  TO public
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_registered_hackathons_updated_at
  BEFORE UPDATE ON registered_hackathons
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_registered_hackathons_user_id ON registered_hackathons(user_id);
CREATE INDEX IF NOT EXISTS idx_registered_hackathons_hackathon_name ON registered_hackathons(hackathon_name);
CREATE INDEX IF NOT EXISTS idx_registered_hackathons_timestamp ON registered_hackathons(registration_timestamp);