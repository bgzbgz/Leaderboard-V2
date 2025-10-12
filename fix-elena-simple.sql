-- Simple step-by-step fix for Elena login
-- Run these queries one by one in Supabase SQL editor

-- Step 1: Check what's currently in the database
SELECT 'Step 1: Check current state' as step;

-- Check teams table
SELECT 'Teams with ELENA001:' as info;
SELECT * FROM teams WHERE access_code = 'ELENA001';

-- Check associates table  
SELECT 'Associates with Elena:' as info;
SELECT * FROM associates WHERE name ILIKE '%elena%' OR name ILIKE '%Elena%';

-- Step 2: Delete problematic team record (if it exists)
-- Uncomment the next line if there's a team record with ELENA001
-- DELETE FROM teams WHERE access_code = 'ELENA001';

-- Step 3: Create Elena as an associate
-- Uncomment and run this if Elena doesn't exist as an associate
-- INSERT INTO associates (name, access_code) VALUES ('Elena', 'ELENA001');

-- Step 4: Verify the fix
SELECT 'Step 4: Verification' as step;
SELECT 'Elena associate record:' as info;
SELECT * FROM associates WHERE access_code = 'ELENA001';

SELECT 'Teams with ELENA001 (should be empty):' as info;
SELECT * FROM teams WHERE access_code = 'ELENA001';
