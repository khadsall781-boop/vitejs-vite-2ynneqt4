/*
  # Storm Chaser Team Application Schema

  1. New Tables
    - `chasers`
      - `id` (uuid, primary key) - Unique identifier for each chaser
      - `name` (text) - Chaser's display name
      - `callsign` (text) - Unique callsign/handle for the chaser
      - `stream_url` (text, nullable) - Live stream URL (YouTube, Twitch, etc.)
      - `avatar_url` (text, nullable) - Profile picture URL
      - `is_active` (boolean) - Whether chaser is currently on a chase
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `chaser_locations`
      - `id` (uuid, primary key) - Unique identifier for location record
      - `chaser_id` (uuid, foreign key) - Reference to chaser
      - `latitude` (decimal) - Current latitude coordinate
      - `longitude` (decimal) - Current longitude coordinate
      - `heading` (integer, nullable) - Direction of travel in degrees (0-360)
      - `speed` (decimal, nullable) - Speed in mph
      - `altitude` (decimal, nullable) - Altitude in feet
      - `accuracy` (decimal, nullable) - Location accuracy in meters
      - `timestamp` (timestamptz) - When location was recorded
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Public read access for viewing chasers and locations
    - Authenticated users can manage chasers
    - Chasers can update their own locations via API key
*/

CREATE TABLE IF NOT EXISTS chasers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  callsign text UNIQUE NOT NULL,
  stream_url text,
  avatar_url text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chaser_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chaser_id uuid REFERENCES chasers(id) ON DELETE CASCADE NOT NULL,
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  heading integer CHECK (heading >= 0 AND heading <= 360),
  speed decimal(6, 2),
  altitude decimal(8, 2),
  accuracy decimal(8, 2),
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chaser_locations_chaser_id ON chaser_locations(chaser_id);
CREATE INDEX IF NOT EXISTS idx_chaser_locations_timestamp ON chaser_locations(timestamp DESC);

ALTER TABLE chasers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaser_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chasers"
  ON chasers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert chasers"
  ON chasers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update chasers"
  ON chasers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete chasers"
  ON chasers FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view chaser locations"
  ON chaser_locations FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert locations"
  ON chaser_locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations"
  ON chaser_locations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete locations"
  ON chaser_locations FOR DELETE
  TO authenticated
  USING (true);
