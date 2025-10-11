-- Fast Track Leaderboard Database Setup
-- Complete SQL file for Supabase database initialization

-- =============================================
-- PART 1: CREATE TABLES
-- =============================================

-- Create teams table (clients)
CREATE TABLE teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    access_code text UNIQUE NOT NULL,
    week_number integer DEFAULT 1,
    on_time_completed integer DEFAULT 0,
    on_time_total integer DEFAULT 0,
    quality_scores jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'ON_TIME' CHECK (status IN ('ON_TIME', 'DELAYED', 'GRADUATED', 'PROGRESS_MEETING', 'STARTING_SOON')),
    current_sprint_number integer DEFAULT 1,
    current_sprint_name text,
    sprint_deadline date,
    next_sprint_number integer,
    next_sprint_name text,
    next_sprint_release date,
    start_date date,
    graduation_date date,
    days_in_delay integer DEFAULT 0,
    program_champion text,
    current_guru text,
    completed_sprints jsonb DEFAULT '[]'::jsonb,
    rank integer,
    country_code text,
    associate_id uuid,
    previous_rank integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create associates table
CREATE TABLE associates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    access_code text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Create sprints table (master list of 30 sprints)
CREATE TABLE sprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    number integer NOT NULL UNIQUE,
    name text NOT NULL
);

-- Create activity_log table for tracking associate actions
CREATE TABLE activity_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    associate_id uuid REFERENCES associates(id),
    client_name text NOT NULL,
    action text NOT NULL,
    timestamp timestamptz DEFAULT now()
);

-- =============================================
-- PART 2: INSERT ASSOCIATES
-- =============================================

INSERT INTO associates (name, access_code) VALUES
('Elena', 'ELENA001'),
('Vasil', 'VASIL001'),
('Ani', 'ANI001');

-- =============================================
-- PART 3: INSERT 30 SPRINTS
-- =============================================

INSERT INTO sprints (number, name) VALUES
(1, 'Business Model Canvas'),
(2, 'Customer Discovery'),
(3, 'Value Proposition Design'),
(4, 'Market Analysis'),
(5, 'Competitive Landscape'),
(6, 'Product-Market Fit'),
(7, 'Go-to-Market Strategy'),
(8, 'Revenue Model'),
(9, 'Unit Economics'),
(10, 'Financial Projections'),
(11, 'Pitch Deck Development'),
(12, 'Product Portfolio Assessment'),
(13, 'Value Proposition Testing'),
(14, 'Customer Validation'),
(15, 'Sales Strategy'),
(16, 'Marketing Strategy'),
(17, 'Brand Identity'),
(18, 'Digital Marketing'),
(19, 'Growth Hacking'),
(20, 'Metrics & KPIs'),
(21, 'Team Building'),
(22, 'Organizational Design'),
(23, 'Operations Planning'),
(24, 'Legal & Compliance'),
(25, 'Funding Strategy'),
(26, 'Investor Relations'),
(27, 'Scale Strategy'),
(28, 'International Expansion'),
(29, 'Exit Strategy'),
(30, 'Final Presentation');

-- =============================================
-- PART 4: INSERT 19 CLIENTS WITH REALISTIC DATA
-- =============================================

-- Elena's 9 clients
INSERT INTO teams (
    name, access_code, week_number, on_time_completed, on_time_total, 
    quality_scores, status, current_sprint_number, current_sprint_name,
    sprint_deadline, next_sprint_number, next_sprint_name, next_sprint_release,
    start_date, program_champion, current_guru, completed_sprints,
    rank, country_code, associate_id
) VALUES
-- MAX CITY (MU - Mauritius) - Week 15, ON_TIME, 10 on-time of 15, quality avg 82%, Rank 4
('MAX CITY', 'MAXCITY2025', 15, 10, 15, 
 '[85, 78, 82, 88, 79, 81, 84, 80, 83, 87, 79, 85, 82, 80, 78]'::jsonb,
 'ON_TIME', 15, 'Sales Strategy', 
 CURRENT_DATE + INTERVAL '3 days', 16, 'Marketing Strategy', 
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '105 days', 'Jean-Pierre Dubois', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]'::jsonb,
 4, 'MU', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- PHARMACIE NOUVELLE (MU) - Week 12, ON_TIME, 9 of 12, quality 78%, Rank 6
('PHARMACIE NOUVELLE', 'PHARMACIE2025', 12, 9, 12,
 '[80, 75, 82, 78, 79, 77, 81, 76, 80, 79, 78, 77]'::jsonb,
 'ON_TIME', 12, 'Product Portfolio Assessment',
 CURRENT_DATE + INTERVAL '3 days', 13, 'Value Proposition Testing',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '84 days', 'Marie-Claire Laurent', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10,11,12]'::jsonb,
 6, 'MU', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- LEAL GROUP (MU) - Week 18, DELAYED, 12 of 18, quality 71%, Rank 9
('LEAL GROUP', 'LEAL2025', 18, 12, 18,
 '[75, 70, 68, 72, 69, 71, 73, 70, 68, 72, 69, 71, 70, 68, 72, 69, 71, 70]'::jsonb,
 'DELAYED', 18, 'Digital Marketing',
 CURRENT_DATE - INTERVAL '2 days', 19, 'Growth Hacking',
 CURRENT_DATE + INTERVAL '5 days',
 CURRENT_DATE - INTERVAL '126 days', 'Robert Leal', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]'::jsonb,
 9, 'MU', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- APF (LV - Latvia) - Week 8, ON_TIME, 7 of 8, quality 88%, Rank 2
('APF', 'APF2025', 8, 7, 8,
 '[90, 85, 88, 87, 89, 86, 88, 87]'::jsonb,
 'ON_TIME', 8, 'Revenue Model',
 CURRENT_DATE + INTERVAL '3 days', 9, 'Unit Economics',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '56 days', 'Andris Berzins', 'Elena',
 '[1,2,3,4,5,6,7,8]'::jsonb,
 2, 'LV', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- CFL (KE - Kenya) - Week 5, ON_TIME, 5 of 5, quality 91%, Rank 1
('CFL', 'CFL2025', 5, 5, 5,
 '[92, 89, 93, 90, 91]'::jsonb,
 'ON_TIME', 5, 'Competitive Landscape',
 CURRENT_DATE + INTERVAL '3 days', 6, 'Product-Market Fit',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '35 days', 'James Mwangi', 'Elena',
 '[1,2,3,4,5]'::jsonb,
 1, 'KE', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- VIZULO (LV) - Week 14, ON_TIME, 11 of 14, quality 79%, Rank 5
('VIZULO', 'VIZULO2025', 14, 11, 14,
 '[82, 77, 80, 78, 81, 79, 80, 78, 82, 77, 80, 78, 81, 79]'::jsonb,
 'ON_TIME', 14, 'Customer Validation',
 CURRENT_DATE + INTERVAL '3 days', 15, 'Sales Strategy',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '98 days', 'Janis Ozols', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14]'::jsonb,
 5, 'LV', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- GRUPO PDC (GT - Guatemala) - Week 10, DELAYED, 7 of 10, quality 68%, Rank 11
('GRUPO PDC', 'GRUPOPDC2025', 10, 7, 10,
 '[70, 65, 68, 66, 69, 67, 68, 66, 69, 67]'::jsonb,
 'DELAYED', 10, 'Financial Projections',
 CURRENT_DATE - INTERVAL '2 days', 11, 'Pitch Deck Development',
 CURRENT_DATE + INTERVAL '5 days',
 CURRENT_DATE - INTERVAL '70 days', 'Carlos Rodriguez', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10]'::jsonb,
 11, 'GT', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- Chromavis (IT - Italy) - Week 20, ON_TIME, 16 of 20, quality 85%, Rank 3
('Chromavis', 'CHROMAVIS2025', 20, 16, 20,
 '[87, 83, 86, 84, 85, 83, 86, 84, 87, 83, 86, 84, 85, 83, 86, 84, 87, 83, 86, 84]'::jsonb,
 'ON_TIME', 20, 'Metrics & KPIs',
 CURRENT_DATE + INTERVAL '3 days', 21, 'Team Building',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '140 days', 'Marco Rossi', 'Elena',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]'::jsonb,
 3, 'IT', (SELECT id FROM associates WHERE access_code = 'ELENA001')),

-- Industra Bank (EE - Estonia) - Week 7, ON_TIME, 6 of 7, quality 76%, Rank 7
('Industra Bank', 'INDUSTRA2025', 7, 6, 7,
 '[78, 74, 76, 75, 77, 75, 76]'::jsonb,
 'ON_TIME', 7, 'Go-to-Market Strategy',
 CURRENT_DATE + INTERVAL '3 days', 8, 'Revenue Model',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '49 days', 'Erik Tamm', 'Elena',
 '[1,2,3,4,5,6,7]'::jsonb,
 7, 'EE', (SELECT id FROM associates WHERE access_code = 'ELENA001'));

-- Vasil's 2 clients
INSERT INTO teams (
    name, access_code, week_number, on_time_completed, on_time_total,
    quality_scores, status, current_sprint_number, current_sprint_name,
    sprint_deadline, next_sprint_number, next_sprint_name, next_sprint_release,
    start_date, program_champion, current_guru, completed_sprints,
    rank, country_code, associate_id
) VALUES
-- Capital Alliance (LK - Sri Lanka) - Week 3, STARTING_SOON, 0 of 3, quality 0%, Rank 18
('Capital Alliance', 'CAPITAL2025', 3, 0, 3,
 '[]'::jsonb,
 'STARTING_SOON', 3, 'Value Proposition Design',
 CURRENT_DATE + INTERVAL '3 days', 4, 'Market Analysis',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '21 days', 'Rajesh Perera', 'Vasil',
 '[]'::jsonb,
 18, 'LK', (SELECT id FROM associates WHERE access_code = 'VASIL001')),

-- Rockland (LK) - Week 6, ON_TIME, 5 of 6, quality 74%, Rank 8
('Rockland', 'ROCKLAND2025', 6, 5, 6,
 '[75, 72, 74, 73, 75, 72]'::jsonb,
 'ON_TIME', 6, 'Product-Market Fit',
 CURRENT_DATE + INTERVAL '3 days', 7, 'Go-to-Market Strategy',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '42 days', 'Nimal Fernando', 'Vasil',
 '[1,2,3,4,5,6]'::jsonb,
 8, 'LK', (SELECT id FROM associates WHERE access_code = 'VASIL001'));

-- Ani's 8 clients
INSERT INTO teams (
    name, access_code, week_number, on_time_completed, on_time_total,
    quality_scores, status, current_sprint_number, current_sprint_name,
    sprint_deadline, next_sprint_number, next_sprint_name, next_sprint_release,
    start_date, program_champion, current_guru, completed_sprints,
    rank, country_code, associate_id
) VALUES
-- Hemas (LK) - Week 16, DELAYED, 11 of 16, quality 69%, Rank 10
('Hemas', 'HEMAS2025', 16, 11, 16,
 '[72, 68, 70, 69, 71, 68, 70, 69, 72, 68, 70, 69, 71, 68, 70, 69]'::jsonb,
 'DELAYED', 16, 'Marketing Strategy',
 CURRENT_DATE - INTERVAL '2 days', 17, 'Brand Identity',
 CURRENT_DATE + INTERVAL '5 days',
 CURRENT_DATE - INTERVAL '112 days', 'Kushil Perera', 'Ani',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]'::jsonb,
 10, 'LK', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- ENSON (PL - Poland) - Week 11, ON_TIME, 9 of 11, quality 81%, Rank 5
('ENSON', 'ENSON2025', 11, 9, 11,
 '[83, 79, 82, 80, 81, 79, 82, 80, 83, 79, 82]'::jsonb,
 'ON_TIME', 11, 'Pitch Deck Development',
 CURRENT_DATE + INTERVAL '3 days', 12, 'Product Portfolio Assessment',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '77 days', 'Piotr Kowalski', 'Ani',
 '[1,2,3,4,5,6,7,8,9,10,11]'::jsonb,
 5, 'PL', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- PGO (PL) - Week 9, ON_TIME, 8 of 9, quality 77%, Rank 7
('PGO', 'PGO2025', 9, 8, 9,
 '[79, 75, 78, 76, 77, 75, 78, 76, 77]'::jsonb,
 'ON_TIME', 9, 'Unit Economics',
 CURRENT_DATE + INTERVAL '3 days', 10, 'Financial Projections',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '63 days', 'Anna Nowak', 'Ani',
 '[1,2,3,4,5,6,7,8,9]'::jsonb,
 7, 'PL', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- FORMIKA (PL) - Week 13, DELAYED, 9 of 13, quality 66%, Rank 12
('FORMIKA', 'FORMIKA2025', 13, 9, 13,
 '[68, 64, 66, 65, 67, 64, 66, 65, 68, 64, 66, 65, 67]'::jsonb,
 'DELAYED', 13, 'Value Proposition Testing',
 CURRENT_DATE - INTERVAL '2 days', 14, 'Customer Validation',
 CURRENT_DATE + INTERVAL '5 days',
 CURRENT_DATE - INTERVAL '91 days', 'Marcin Wozniak', 'Ani',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13]'::jsonb,
 12, 'PL', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- Plazteca (MX - Mexico) - Week 4, ON_TIME, 4 of 4, quality 89%, Rank 2
('Plazteca', 'PLAZTECA2025', 4, 4, 4,
 '[90, 88, 89, 87]'::jsonb,
 'ON_TIME', 4, 'Market Analysis',
 CURRENT_DATE + INTERVAL '3 days', 5, 'Competitive Landscape',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '28 days', 'Alejandro Martinez', 'Ani',
 '[1,2,3,4]'::jsonb,
 2, 'MX', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- AMEX (AT - Austria) - Week 19, ON_TIME, 15 of 19, quality 83%, Rank 4
('AMEX', 'AMEX2025', 19, 15, 19,
 '[85, 81, 84, 82, 83, 81, 84, 82, 85, 81, 84, 82, 83, 81, 84, 82, 85, 81, 84]'::jsonb,
 'ON_TIME', 19, 'Growth Hacking',
 CURRENT_DATE + INTERVAL '3 days', 20, 'Metrics & KPIs',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '133 days', 'Franz Mueller', 'Ani',
 '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]'::jsonb,
 4, 'AT', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- MOBO (MX) - Week 2, STARTING_SOON, 0 of 2, quality 0%, Rank 19
('MOBO', 'MOBO2025', 2, 0, 2,
 '[]'::jsonb,
 'STARTING_SOON', 2, 'Customer Discovery',
 CURRENT_DATE + INTERVAL '3 days', 3, 'Value Proposition Design',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '14 days', 'Isabella Garcia', 'Ani',
 '[]'::jsonb,
 19, 'MX', (SELECT id FROM associates WHERE access_code = 'ANI001')),

-- CRAFT (MX) - Week 8, ON_TIME, 7 of 8, quality 80%, Rank 6
('CRAFT', 'CRAFT2025', 8, 7, 8,
 '[82, 78, 81, 79, 80, 78, 81, 79]'::jsonb,
 'ON_TIME', 8, 'Revenue Model',
 CURRENT_DATE + INTERVAL '3 days', 9, 'Unit Economics',
 CURRENT_DATE + INTERVAL '10 days',
 CURRENT_DATE - INTERVAL '56 days', 'Diego Herrera', 'Ani',
 '[1,2,3,4,5,6,7,8]'::jsonb,
 6, 'MX', (SELECT id FROM associates WHERE access_code = 'ANI001'));

-- =============================================
-- PART 5: CREATE INDEXES
-- =============================================

CREATE INDEX idx_teams_access_code ON teams(access_code);
CREATE INDEX idx_teams_rank ON teams(rank);
CREATE INDEX idx_associates_access_code ON associates(access_code);
CREATE INDEX idx_teams_associate_id ON teams(associate_id);
CREATE INDEX idx_teams_status ON teams(status);

-- =============================================
-- PART 6: ENABLE RLS AND CREATE POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;

-- Allow public read access for teams (for leaderboard functionality)
CREATE POLICY "Allow public read access for teams" ON teams
    FOR SELECT USING (true);

-- Allow public read access for associates (for login functionality)
CREATE POLICY "Allow public read access for associates" ON associates
    FOR SELECT USING (true);

-- Allow public read access for sprints (for sprint information)
CREATE POLICY "Allow public read access for sprints" ON sprints
    FOR SELECT USING (true);

-- Allow public insert for teams (for registration if needed)
CREATE POLICY "Allow public insert for teams" ON teams
    FOR INSERT WITH CHECK (true);

-- Allow public insert for associates (for registration if needed)
CREATE POLICY "Allow public insert for associates" ON associates
    FOR INSERT WITH CHECK (true);

-- =============================================
-- PART 7: UPDATE RANK CALCULATIONS
-- =============================================

-- Update ranks based on performance (quality average * on-time percentage)
UPDATE teams SET rank = subquery.new_rank
FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
               ORDER BY 
                   (CASE WHEN on_time_total > 0 THEN (on_time_completed::float / on_time_total) * 100 ELSE 0 END) * 0.6 +
                   (CASE WHEN jsonb_array_length(quality_scores) > 0 THEN 
                       (SELECT AVG(value::float) FROM jsonb_array_elements(quality_scores)) 
                   ELSE 0 END) * 0.4
               DESC
           ) as new_rank
    FROM teams
) subquery
WHERE teams.id = subquery.id;

-- =============================================
-- COMPLETE SETUP FINISHED
-- =============================================

-- Display summary
SELECT 
    'Database setup complete!' as status,
    (SELECT COUNT(*) FROM teams) as total_teams,
    (SELECT COUNT(*) FROM associates) as total_associates,
    (SELECT COUNT(*) FROM sprints) as total_sprints;
