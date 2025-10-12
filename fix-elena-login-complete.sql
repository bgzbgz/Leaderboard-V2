-- Complete fix for Elena login issue
-- This will clean up the database and ensure Elena can log in properly

-- Step 1: Check current state
SELECT 'Current state check:' as step;

-- Check if there's a problematic team record with ELENA001
SELECT 'Teams with ELENA001:' as info;
SELECT id, name, access_code, status, created_at 
FROM teams 
WHERE access_code = 'ELENA001';

-- Check if Elena exists as an associate
SELECT 'Associates with Elena:' as info;
SELECT id, name, access_code, created_at 
FROM associates 
WHERE name ILIKE '%elena%' OR name ILIKE '%Elena%';

-- Check all associates to see what access codes exist
SELECT 'All associates:' as info;
SELECT id, name, access_code, created_at 
FROM associates 
ORDER BY created_at;

-- Step 2: Clean up problematic data
SELECT 'Cleaning up problematic data...' as step;

-- Delete any team record with ELENA001 (this should be an associate, not a team)
DELETE FROM teams WHERE access_code = 'ELENA001';

-- Step 3: Ensure Elena exists as an associate
SELECT 'Creating/updating Elena associate record...' as step;

-- Check if Elena already exists as an associate
DO $$
DECLARE
    elena_exists boolean;
    elena_id uuid;
BEGIN
    -- Check if Elena exists
    SELECT EXISTS(SELECT 1 FROM associates WHERE name ILIKE '%elena%' OR name ILIKE '%Elena%') INTO elena_exists;
    
    IF elena_exists THEN
        -- Update existing Elena record to have ELENA001 access code
        UPDATE associates 
        SET access_code = 'ELENA001' 
        WHERE name ILIKE '%elena%' OR name ILIKE '%Elena%';
        
        SELECT id INTO elena_id FROM associates WHERE access_code = 'ELENA001';
        RAISE NOTICE 'Updated Elena associate record with ID: %', elena_id;
    ELSE
        -- Create new Elena associate record
        INSERT INTO associates (name, access_code) 
        VALUES ('Elena', 'ELENA001') 
        RETURNING id INTO elena_id;
        
        RAISE NOTICE 'Created new Elena associate record with ID: %', elena_id;
    END IF;
END $$;

-- Step 4: Verify the fix
SELECT 'Verification:' as step;

-- Check Elena's associate record
SELECT 'Elena associate record:' as info;
SELECT id, name, access_code, created_at 
FROM associates 
WHERE access_code = 'ELENA001';

-- Check that no team record exists with ELENA001
SELECT 'Teams with ELENA001 (should be empty):' as info;
SELECT COUNT(*) as count 
FROM teams 
WHERE access_code = 'ELENA001';

-- Step 5: Test data integrity
SELECT 'Testing data integrity...' as step;

-- Check if there are any other problematic team records
SELECT 'Teams with missing required fields:' as info;
SELECT 
    access_code,
    name,
    CASE 
        WHEN sprint_deadline IS NULL THEN 'Missing sprint_deadline'
        WHEN next_sprint_number IS NULL THEN 'Missing next_sprint_number'
        WHEN next_sprint_name IS NULL THEN 'Missing next_sprint_name'
        WHEN next_sprint_release IS NULL THEN 'Missing next_sprint_release'
        WHEN program_champion IS NULL THEN 'Missing program_champion'
        WHEN current_guru IS NULL THEN 'Missing current_guru'
        WHEN completed_sprints IS NULL THEN 'Missing completed_sprints'
        WHEN rank IS NULL THEN 'Missing rank'
        WHEN country_code IS NULL THEN 'Missing country_code'
        WHEN associate_id IS NULL THEN 'Missing associate_id'
        ELSE 'Complete'
    END as data_status
FROM teams 
WHERE 
    sprint_deadline IS NULL OR
    next_sprint_number IS NULL OR
    next_sprint_name IS NULL OR
    next_sprint_release IS NULL OR
    program_champion IS NULL OR
    current_guru IS NULL OR
    completed_sprints IS NULL OR
    rank IS NULL OR
    country_code IS NULL OR
    associate_id IS NULL;

-- Final verification
SELECT 'Final verification - Elena should be able to log in with ELENA001' as result;
