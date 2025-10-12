-- Fix for manually creating client CLIENT1760256699496
-- This SQL query will properly insert the client with all required fields

-- First, let's check if the client already exists
SELECT * FROM teams WHERE access_code = 'CLIENT1760256699496';

-- If the client doesn't exist or is incomplete, insert it properly
-- You'll need to replace 'Elena' with the actual associate name and get the associate_id

-- Get the associate information first
SELECT id, name FROM associates WHERE name = 'Elena' LIMIT 1;

-- Insert the client with all required fields
-- Replace 'YOUR_ASSOCIATE_ID_HERE' with the actual associate ID from the query above
INSERT INTO teams (
    name,
    access_code,
    country_code,
    program_champion,
    current_guru,
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
    graduation_date,
    days_in_delay,
    completed_sprints,
    rank,
    associate_id,
    previous_rank
) VALUES (
    'New Client', -- Replace with actual client name
    'CLIENT1760256699496',
    'US', -- Replace with actual country code
    'Program Champion Name', -- Replace with actual program champion
    'Elena', -- Replace with actual associate name
    'STARTING_SOON',
    1,
    0,
    0,
    '[]'::jsonb,
    1,
    'Business Model Canvas',
    CURRENT_DATE + INTERVAL '7 days', -- Sprint deadline 7 days from now
    2,
    'Value Proposition Canvas',
    CURRENT_DATE + INTERVAL '14 days', -- Next sprint release 14 days from now
    CURRENT_DATE,
    NULL, -- graduation_date
    0,
    '[]'::jsonb,
    1, -- rank - will be updated by trigger
    'YOUR_ASSOCIATE_ID_HERE', -- Replace with actual associate ID
    NULL -- previous_rank
);

-- Update the rank for the new client
-- This will set the rank based on the total number of clients
UPDATE teams 
SET rank = (
    SELECT COUNT(*) + 1 
    FROM teams t2 
    WHERE t2.id != teams.id
)
WHERE access_code = 'CLIENT1760256699496';

-- Verify the client was created successfully
SELECT * FROM teams WHERE access_code = 'CLIENT1760256699496';
