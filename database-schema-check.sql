-- ============================================================
-- DATABASE SCHEMA CHECK FOR FAST TRACK LEADERBOARD
-- ============================================================
-- PURPOSE: Verify all required fields exist in the teams table
-- RUN THIS IN: Supabase SQL Editor
-- ============================================================

-- 1. CHECK EXISTING COLUMNS IN TEAMS TABLE
-- This shows what fields currently exist
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- Expected output should include:
-- - on_time_completed (integer, default 0, not null)
-- - on_time_total (integer, default 0, not null)
-- - quality_scores (jsonb, default '[]'::jsonb, not null)
-- - completed_sprints (jsonb, default '[]'::jsonb, not null)
-- - rank (integer, nullable)
-- - previous_rank (integer, nullable)

-- ============================================================
-- 2. CHECK CURRENT DATA IN TEAMS TABLE
-- This shows sample data from teams table
-- ============================================================
SELECT 
  id,
  name,
  access_code,
  on_time_completed,
  on_time_total,
  quality_scores,
  completed_sprints,
  rank,
  previous_rank,
  status
FROM teams
ORDER BY rank
LIMIT 10;

-- Expected: Should see data with no errors
-- If you get "column does not exist" error, those fields need to be added!

-- ============================================================
-- 3. CHECK SPECIFIC REQUIRED FIELDS
-- This will ERROR if any required field is missing
-- ============================================================
DO $$
DECLARE
  missing_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for on_time_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'on_time_completed'
  ) THEN
    missing_fields := array_append(missing_fields, 'on_time_completed');
  END IF;
  
  -- Check for on_time_total
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'on_time_total'
  ) THEN
    missing_fields := array_append(missing_fields, 'on_time_total');
  END IF;
  
  -- Check for quality_scores
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'quality_scores'
  ) THEN
    missing_fields := array_append(missing_fields, 'quality_scores');
  END IF;
  
  -- Check for completed_sprints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'completed_sprints'
  ) THEN
    missing_fields := array_append(missing_fields, 'completed_sprints');
  END IF;
  
  -- Check for rank
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'rank'
  ) THEN
    missing_fields := array_append(missing_fields, 'rank');
  END IF;
  
  -- Check for previous_rank
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'teams' AND column_name = 'previous_rank'
  ) THEN
    missing_fields := array_append(missing_fields, 'previous_rank');
  END IF;
  
  -- Report results
  IF array_length(missing_fields, 1) > 0 THEN
    RAISE NOTICE '❌ MISSING FIELDS: %', array_to_string(missing_fields, ', ');
    RAISE NOTICE '⚠️ You need to run the database migration! See database-schema-migration.sql';
  ELSE
    RAISE NOTICE '✅ ALL REQUIRED FIELDS EXIST!';
    RAISE NOTICE '✅ Database schema is correct';
  END IF;
END $$;

-- ============================================================
-- 4. VERIFY DATA TYPES ARE CORRECT
-- ============================================================
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'on_time_completed' AND data_type = 'integer' THEN '✅'
    WHEN column_name = 'on_time_total' AND data_type = 'integer' THEN '✅'
    WHEN column_name = 'quality_scores' AND data_type = 'jsonb' THEN '✅'
    WHEN column_name = 'completed_sprints' AND data_type = 'jsonb' THEN '✅'
    WHEN column_name = 'rank' AND data_type = 'integer' THEN '✅'
    WHEN column_name = 'previous_rank' AND data_type = 'integer' THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.columns
WHERE table_name = 'teams'
AND column_name IN (
  'on_time_completed', 
  'on_time_total', 
  'quality_scores', 
  'completed_sprints', 
  'rank', 
  'previous_rank'
)
ORDER BY column_name;

-- Expected: All should show ✅
-- If any show ❌, the data type is wrong!

-- ============================================================
-- 5. CHECK FOR NULL VALUES (Should be 0 or [] for defaults)
-- ============================================================
SELECT 
  COUNT(*) as total_clients,
  COUNT(CASE WHEN on_time_completed IS NULL THEN 1 END) as null_on_time_completed,
  COUNT(CASE WHEN on_time_total IS NULL THEN 1 END) as null_on_time_total,
  COUNT(CASE WHEN quality_scores IS NULL THEN 1 END) as null_quality_scores,
  COUNT(CASE WHEN completed_sprints IS NULL THEN 1 END) as null_completed_sprints
FROM teams;

-- Expected: All null counts should be 0
-- If any are > 0, you need to set default values

-- ============================================================
-- 6. SAMPLE DATA CHECK - Are scores being recorded?
-- ============================================================
SELECT 
  name,
  on_time_completed,
  on_time_total,
  CASE 
    WHEN on_time_total > 0 
    THEN ROUND((on_time_completed::numeric / on_time_total::numeric) * 100)
    ELSE 0 
  END as on_time_percentage,
  COALESCE(jsonb_array_length(quality_scores), 0) as num_quality_scores,
  CASE 
    WHEN jsonb_array_length(quality_scores) > 0 
    THEN (
      SELECT ROUND(AVG((value::text)::numeric))
      FROM jsonb_array_elements(quality_scores)
    )
    ELSE 0
  END as quality_average,
  rank
FROM teams
ORDER BY rank
LIMIT 10;

-- Expected: Should see data with scores > 0 if any sprints have been completed
-- If all zeros, no score data has been recorded yet!

-- ============================================================
-- NEXT STEPS:
-- ============================================================
-- ✅ If all checks pass: Your database is ready! Test the Score Calculator.
-- ❌ If any fields are missing: Run database-schema-migration.sql
-- ⚠️ If data types are wrong: You may need to recreate the table
-- ============================================================

