/*
  # Add User Roles and Authentication System

  ## Overview
  This migration adds a comprehensive role-based access control (RBAC) system to the storm chaser tracker.
  
  ## New Tables
  
  ### `user_roles`
  Maps users to their roles in the system:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References auth.users
  - `role` (text) - User role: 'chaser', 'viewer', or 'moderator'
  - `chaser_id` (uuid, nullable) - Links to chasers table if role is 'chaser'
  - `created_at` (timestamptz) - When role was assigned
  - `created_by` (uuid, nullable) - Which moderator assigned the role
  
  ## Modified Tables
  
  ### `chasers`
  - Add `user_id` (uuid, nullable) - Links chaser to their auth user account
  
  ### `chaser_locations`
  - No structural changes, but RLS policies updated for role-based access
  
  ## Security & RLS Policies
  
  ### Authentication Requirements
  - Most operations now require authentication
  - Viewers can only read data
  - Chasers can update their own location and profile
  - Moderators have full CRUD access to manage chasers
  
  ### RLS Policies by Table
  
  #### user_roles table:
  1. Users can view their own role
  2. Moderators can view all roles
  3. Moderators can insert new roles
  4. Moderators can update roles
  5. Moderators can delete roles
  
  #### chasers table:
  1. Everyone (including unauthenticated) can view active chasers
  2. Moderators can insert new chasers
  3. Chasers can update their own profile
  4. Moderators can update any chaser
  5. Moderators can delete chasers
  
  #### chaser_locations table:
  1. Everyone can view locations
  2. Chasers can insert their own location
  3. Moderators can insert any location
  4. No updates or deletes (append-only log)
  
  ## Helper Functions
  
  ### `is_moderator()`
  Returns true if the current user has the 'moderator' role
  
  ### `get_user_chaser_id()`
  Returns the chaser_id associated with the current user (if they're a chaser)
  
  ## Important Notes
  
  1. The first user should be manually granted moderator role via SQL
  2. Moderators can then assign roles to other users through the UI
  3. Chaser accounts must be linked to a user_id to share location
  4. Viewer role is the default for new authenticated users
*/

-- Add user_id column to chasers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chasers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE chasers ADD COLUMN user_id uuid REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_chasers_user_id ON chasers(user_id);
  END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('chaser', 'viewer', 'moderator')),
  chaser_id uuid REFERENCES chasers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_chaser_id ON user_roles(chaser_id);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a moderator
CREATE OR REPLACE FUNCTION is_moderator()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'moderator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get chaser_id for current user
CREATE OR REPLACE FUNCTION get_user_chaser_id()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT chaser_id FROM user_roles
    WHERE user_id = auth.uid() AND role = 'chaser'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Moderators can view all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_moderator());

CREATE POLICY "Moderators can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_moderator());

CREATE POLICY "Moderators can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_moderator())
  WITH CHECK (is_moderator());

CREATE POLICY "Moderators can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_moderator());

-- Drop old RLS policies on chasers table
DROP POLICY IF EXISTS "Anyone can view active chasers" ON chasers;
DROP POLICY IF EXISTS "Anyone can view chasers" ON chasers;

-- New RLS policies for chasers table
CREATE POLICY "Everyone can view active chasers"
  ON chasers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Moderators can insert chasers"
  ON chasers FOR INSERT
  TO authenticated
  WITH CHECK (is_moderator());

CREATE POLICY "Chasers can update own profile"
  ON chasers FOR UPDATE
  TO authenticated
  USING (id = get_user_chaser_id())
  WITH CHECK (id = get_user_chaser_id());

CREATE POLICY "Moderators can update any chaser"
  ON chasers FOR UPDATE
  TO authenticated
  USING (is_moderator())
  WITH CHECK (is_moderator());

CREATE POLICY "Moderators can delete chasers"
  ON chasers FOR DELETE
  TO authenticated
  USING (is_moderator());

-- Drop old RLS policies on chaser_locations table
DROP POLICY IF EXISTS "Anyone can view locations" ON chaser_locations;

-- New RLS policies for chaser_locations table
CREATE POLICY "Everyone can view locations"
  ON chaser_locations FOR SELECT
  USING (true);

CREATE POLICY "Chasers can insert own location"
  ON chaser_locations FOR INSERT
  TO authenticated
  WITH CHECK (chaser_id = get_user_chaser_id());

CREATE POLICY "Moderators can insert any location"
  ON chaser_locations FOR INSERT
  TO authenticated
  WITH CHECK (is_moderator());