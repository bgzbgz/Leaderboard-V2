-- Debug Elena login issue
-- Check what's in the database for ELENA001

-- 1. Check if there's a team with ELENA001 access code
SELECT 
    id,
    name,
    access_code,
    status,
    week_number,
    on_time_completed,
    on_time_total,
    quality_scores,
    current_sprint_number,
    current_sprint_name,
    sprint_deadline,
    next_sprint_number,
    next_sprint_name,
    next_sprint_release,
    start_date,
    program_champion,
    current_guru,
    completed_sprints,
    rank,
    country_code,
    associate_id,
    previous_rank,
    created_at
FROM teams 
WHERE access_code = 'ELENA001';

-- 2. Check if there's an associate with ELENA001 access code
SELECT 
    id,
    name,
    access_code,
    created_at
FROM associates 
WHERE access_code = 'ELENA001';

-- 3. Check all associates to see what access codes exist
SELECT 
    id,
    name,
    access_code,
    created_at
FROM associates 
ORDER BY created_at;

-- 4. Check if there are any teams with incomplete data
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
WHERE access_code = 'ELENA001';

-- 5. If there's a problematic team record, delete it
-- DELETE FROM teams WHERE access_code = 'ELENA001';

-- 6. Check if Elena exists as an associate with a different access code
SELECT 
    id,
    name,
    access_code
FROM associates 
WHERE name ILIKE '%elena%' OR name ILIKE '%Elena%';
