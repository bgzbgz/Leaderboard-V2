-- SSDB (Start, Stop, Do Better) Insights Database Table
-- This table stores insights and feedback for teams in the Fast Track program

-- Create the SSDB insights table
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

-- Create indexes for better performance
CREATE INDEX idx_ssdb_insights_team_id ON public.ssdb_insights(team_id);
CREATE INDEX idx_ssdb_insights_created_by ON public.ssdb_insights(created_by);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ssdb_insights ENABLE ROW LEVEL SECURITY;

-- Allow public read access to SSDB insights
CREATE POLICY "Allow public read access to SSDB insights" 
ON public.ssdb_insights FOR SELECT 
USING (true);

-- Allow associates to insert SSDB insights
CREATE POLICY "Allow associates to insert SSDB insights" 
ON public.ssdb_insights FOR INSERT 
WITH CHECK (true);

-- Allow associates to update SSDB insights
CREATE POLICY "Allow associates to update their SSDB insights" 
ON public.ssdb_insights FOR UPDATE 
USING (true);

-- Allow associates to delete SSDB insights
CREATE POLICY "Allow associates to delete their SSDB insights" 
ON public.ssdb_insights FOR DELETE 
USING (true);

-- Add some sample SSDB insights for testing
INSERT INTO public.ssdb_insights (team_id, start_insight, stop_insight, do_better_insight, created_by) VALUES
-- Sample insights for CFL (team_id from teams table)
((SELECT id FROM public.teams WHERE access_code = 'CFL2025' LIMIT 1), 
 'Implement daily standup meetings to improve team communication', 
 'Stop working in silos without regular team check-ins', 
 'Better documentation of sprint progress and blockers',
 (SELECT id FROM public.associates WHERE access_code = 'ELENA001' LIMIT 1)),

-- Sample insights for MaxCity (team_id from teams table)
((SELECT id FROM public.teams WHERE access_code = 'MAXCITY2025' LIMIT 1), 
 'Start using project management tools for better task tracking', 
 'Stop missing deadlines due to poor time estimation', 
 'Improve client communication with weekly progress reports',
 (SELECT id FROM public.associates WHERE access_code = 'VASIL001' LIMIT 1)),

-- Sample insights for TechFlow (team_id from teams table)
((SELECT id FROM public.teams WHERE access_code = 'TECHFLOW2025' LIMIT 1), 
 'Begin implementing automated testing for better code quality', 
 'Stop deploying code without proper testing procedures', 
 'Better code review process with mandatory peer reviews',
 (SELECT id FROM public.associates WHERE access_code = 'ANI001' LIMIT 1));

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_ssdb_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
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
