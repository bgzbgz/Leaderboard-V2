-- Complete SQL query to insert CLIENT1760256699496 with Elena's associate ID
-- Elena's ID: ea2d6fda-d2e4-4409-9b4d-20c84fb83a12

-- First, let's check if the client already exists
SELECT * FROM teams WHERE access_code = 'CLIENT1760256699496';

-- If the client exists but is incomplete, delete it first
DELETE FROM teams WHERE access_code = 'CLIENT1760256699496';

-- Insert the client with all required fields
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
    'New Client', -- Replace with actual client name if you know it
    'CLIENT1760256699496',
    'US', -- Replace with actual country code if you know it
    'Program Champion', -- Replace with actual program champion name if you know it
    'Elena',
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
    1, -- rank - will be updated below
    'ea2d6fda-d2e4-4409-9b4d-20c84fb83a12', -- Elena's associate ID
    NULL -- previous_rank
);

-- Update the rank for the new client based on total number of clients
UPDATE teams 
SET rank = (
    SELECT COUNT(*) 
    FROM teams t2 
    WHERE t2.id != teams.id
)
WHERE access_code = 'CLIENT1760256699496';

-- Verify the client was created successfully
SELECT 
    id,
    name,
    access_code,
    country_code,
    program_champion,
    current_guru,
    status,
    rank,
    associate_id,
    created_at
FROM teams 
WHERE access_code = 'CLIENT1760256699496';

-- Also verify the client appears in Elena's client list
SELECT 
    t.name,
    t.access_code,
    t.status,
    t.rank,
    a.name as associate_name
FROM teams t
JOIN associates a ON t.associate_id = a.id
WHERE a.name = 'Elena'
ORDER BY t.rank;
