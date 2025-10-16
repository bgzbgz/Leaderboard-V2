-- ============================================================
-- DATABASE SCHEMA MIGRATION FOR FAST TRACK LEADERBOARD
-- ============================================================
-- PURPOSE: Add missing fields to teams table for scoring system
-- RUN THIS IF: database-schema-check.sql shows missing fields
-- WHEN: After identifying database fields are missing
-- WHERE: Supabase SQL Editor
-- ============================================================

-- IMPORTANT: This script is SAFE to run multiple times
-- It uses "IF NOT EXISTS" so won't error if columns already exist
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ADD ON-TIME DELIVERY TRACKING COLUMNS
-- ============================================================

-- Add on_time_completed (count of sprints completed on-time)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS on_time_completed INTEGER DEFAULT 0 NOT NULL;

-- Add on_time_total (total count of all sprint submissions)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS on_time_total INTEGER DEFAULT 0 NOT NULL;

RAISE NOTICE '✅ Added on-time delivery tracking columns';

-- ============================================================
-- 2. ADD QUALITY SCORING COLUMNS
-- ============================================================

-- Add quality_scores (array of quality scores 0-100 for each sprint)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS quality_scores JSONB DEFAULT '[]'::jsonb NOT NULL;

-- Add completed_sprints (array of completed sprint numbers)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS completed_sprints JSONB DEFAULT '[]'::jsonb NOT NULL;

RAISE NOTICE '✅ Added quality scoring columns';

-- ============================================================
-- 3. ADD RANKING COLUMNS
-- ============================================================

-- Add rank (current leaderboard position)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS rank INTEGER;

-- Add previous_rank (for rank change arrows ↑↓→)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS previous_rank INTEGER;

RAISE NOTICE '✅ Added ranking columns';

-- ============================================================
-- 4. SET DEFAULT VALUES FOR EXISTING ROWS
-- ============================================================

-- Ensure all existing rows have default values
UPDATE teams 
SET 
  on_time_completed = COALESCE(on_time_completed, 0),
  on_time_total = COALESCE(on_time_total, 0),
  quality_scores = COALESCE(quality_scores, '[]'::jsonb),
  completed_sprints = COALESCE(completed_sprints, '[]'::jsonb)
WHERE 
  on_time_completed IS NULL 
  OR on_time_total IS NULL 
  OR quality_scores IS NULL 
  OR completed_sprints IS NULL;

RAISE NOTICE '✅ Set default values for existing rows';

-- ============================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Index on rank for faster leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_teams_rank ON teams(rank);

-- Index on access_code for faster client login
CREATE INDEX IF NOT EXISTS idx_teams_access_code ON teams(access_code);

RAISE NOTICE '✅ Created performance indexes';

COMMIT;

-- ============================================================
-- 6. VERIFY THE MIGRATION
-- ============================================================

SELECT 
  '✅ MIGRATION COMPLETE' as status,
  COUNT(*) as total_teams,
  COUNT(CASE WHEN on_time_completed >= 0 THEN 1 END) as teams_with_on_time_data,
  COUNT(CASE WHEN quality_scores IS NOT NULL THEN 1 END) as teams_with_quality_data
FROM teams;

-- Show sample data to confirm
SELECT 
  id,
  name,
  on_time_completed,
  on_time_total,
  quality_scores,
  completed_sprints,
  rank,
  previous_rank
FROM teams
LIMIT 5;

-- ============================================================
-- TROUBLESHOOTING:
-- ============================================================
-- If you get errors:
-- 1. "column already exists" - This is SAFE, ignore it
-- 2. "permission denied" - Contact your Supabase admin
-- 3. "table does not exist" - Run your base schema setup first
-- ============================================================

-- ============================================================
-- NEXT STEPS AFTER MIGRATION:
-- ============================================================
-- 1. ✅ Verify migration: Run database-schema-check.sql again
-- 2. ✅ Test Score Calculator: Submit a score in the app
-- 3. ✅ Check Client View: Verify numbers update
-- 4. ✅ Fix rankings: Click "Fix All Ranks Now" button
-- ============================================================

RAISE NOTICE '====================================';
RAISE NOTICE '✅ DATABASE MIGRATION COMPLETE!';
RAISE NOTICE '====================================';
RAISE NOTICE 'Next: Test the Score Calculator in your app';

