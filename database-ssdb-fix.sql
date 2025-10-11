-- SSDB (Start, Stop, Do Better) Insights Database Table - FIXED VERSION
-- This script fixes the team_id lookup issues

-- First, let's check what teams exist and get their IDs
-- Run this query first to see what teams are available:
-- SELECT id, name, access_code FROM teams ORDER BY name;

-- Create the SSDB insights table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.ssdb_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    start_insight text,
    stop_insight text,
    do_better_insight text,
    created_by uuid REFERENCES public.associates(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_ssdb_insights_team_id ON public.ssdb_insights(team_id);
CREATE INDEX IF NOT EXISTS idx_ssdb_insights_created_by ON public.ssdb_insights(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ssdb_insights ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to SSDB insights" ON public.ssdb_insights;
DROP POLICY IF EXISTS "Allow associates to insert SSDB insights" ON public.ssdb_insights;
DROP POLICY IF EXISTS "Allow associates to update their SSDB insights" ON public.ssdb_insights;
DROP POLICY IF EXISTS "Allow associates to delete their SSDB insights" ON public.ssdb_insights;

-- Create new policies
CREATE POLICY "Allow public read access to SSDB insights" 
ON public.ssdb_insights FOR SELECT 
USING (true);

CREATE POLICY "Allow associates to insert SSDB insights" 
ON public.ssdb_insights FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow associates to update their SSDB insights" 
ON public.ssdb_insights FOR UPDATE 
USING (true);

CREATE POLICY "Allow associates to delete their SSDB insights" 
ON public.ssdb_insights FOR DELETE 
USING (true);

-- Clear existing SSDB insights to start fresh
DELETE FROM public.ssdb_insights;

-- Insert sample SSDB insights with proper team_id lookups
-- We'll use a safer approach by getting the actual team IDs first
INSERT INTO public.ssdb_insights (team_id, start_insight, stop_insight, do_better_insight, created_by) 
SELECT 
    t.id as team_id,
    'Implement daily standup meetings to improve team communication' as start_insight,
    'Stop working in silos without regular team check-ins' as stop_insight,
    'Better documentation of sprint progress and blockers' as do_better_insight,
    a.id as created_by
FROM public.teams t, public.associates a 
WHERE t.access_code = 'CFL2025' 
AND a.access_code = 'ELENA001'
LIMIT 1;

INSERT INTO public.ssdb_insights (team_id, start_insight, stop_insight, do_better_insight, created_by) 
SELECT 
    t.id as team_id,
    'Start using project management tools for better task tracking' as start_insight,
    'Stop missing deadlines due to poor time estimation' as stop_insight,
    'Improve client communication with weekly progress reports' as do_better_insight,
    a.id as created_by
FROM public.teams t, public.associates a 
WHERE t.access_code = 'MAXCITY2025' 
AND a.access_code = 'VASIL001'
LIMIT 1;

INSERT INTO public.ssdb_insights (team_id, start_insight, stop_insight, do_better_insight, created_by) 
SELECT 
    t.id as team_id,
    'Begin implementing automated testing for better code quality' as start_insight,
    'Stop deploying code without proper testing procedures' as stop_insight,
    'Better code review process with mandatory peer reviews' as do_better_insight,
    a.id as created_by
FROM public.teams t, public.associates a 
WHERE t.access_code = 'TECHFLOW2025' 
AND a.access_code = 'ANI001'
LIMIT 1;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ssdb_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_ssdb_insights_updated_at ON public.ssdb_insights;
CREATE TRIGGER update_ssdb_insights_updated_at
    BEFORE UPDATE ON public.ssdb_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_ssdb_insights_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.ssdb_insights IS 'Stores SSDB (Start, Stop, Do Better) insights and feedback for teams';
COMMENT ON COLUMN public.ssdb_insights.team_id IS 'Reference to the team this insight is for';
COMMENT ON COLUMN public.ssdb_insights.start_insight IS 'What the team should start doing';
COMMENT ON COLUMN public.ssdb_insights.stop_insight IS 'What the team should stop doing';
COMMENT ON COLUMN public.ssdb_insights.do_better_insight IS 'What the team should do better';
COMMENT ON COLUMN public.ssdb_insights.created_by IS 'Associate who created this insight';
COMMENT ON COLUMN public.ssdb_insights.created_at IS 'When this insight was created';
COMMENT ON COLUMN public.ssdb_insights.updated_at IS 'When this insight was last updated';

-- Verify the setup worked
SELECT 
    si.id,
    t.name as team_name,
    t.access_code,
    a.name as associate_name,
    si.start_insight,
    si.stop_insight,
    si.do_better_insight
FROM public.ssdb_insights si
JOIN public.teams t ON si.team_id = t.id
JOIN public.associates a ON si.created_by = a.id
ORDER BY t.name;
