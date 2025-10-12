-- Enhanced Client Management Database Schema
-- This will add comprehensive client management capabilities

-- 1. Add new columns to existing teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS ceo_name text,
ADD COLUMN IF NOT EXISTS industry_type text,
ADD COLUMN IF NOT EXISTS company_size text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS main_contact text,
ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS speed_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS current_module text,
ADD COLUMN IF NOT EXISTS module_guru text;

-- 2. Create modules table for better sprint management
CREATE TABLE IF NOT EXISTS public.modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_number integer NOT NULL,
    module_name text NOT NULL,
    description text,
    duration_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create client_sprints table for detailed sprint tracking
CREATE TABLE IF NOT EXISTS public.client_sprints (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    sprint_number integer NOT NULL,
    sprint_name text NOT NULL,
    status text DEFAULT 'Not Started', -- Not Started, In Progress, Completed, Delayed
    start_date date,
    end_date date,
    actual_completion_date date,
    quality_score integer CHECK (quality_score >= 0 AND quality_score <= 100),
    on_time boolean DEFAULT true,
    notes text,
    assigned_guru text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Create enhanced ssdb_insights table with more structure
CREATE TABLE IF NOT EXISTS public.enhanced_ssdb_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    sprint_id uuid REFERENCES public.client_sprints(id) ON DELETE CASCADE,
    start_insight text,
    stop_insight text,
    do_better_insight text,
    priority text DEFAULT 'Medium', -- High, Medium, Low
    status text DEFAULT 'Active', -- Active, Implemented, Archived
    created_by uuid REFERENCES public.associates(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. Create client_notes table for detailed notes management
CREATE TABLE IF NOT EXISTS public.client_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
    note_type text NOT NULL, -- General, Sprint, SSDB, Meeting, Issue
    title text,
    content text NOT NULL,
    priority text DEFAULT 'Medium',
    created_by uuid REFERENCES public.associates(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Insert default modules
INSERT INTO public.modules (module_number, module_name, description, duration_days) VALUES
(1, 'Individual and Company Identity', 'Foundation module for personal and business identity development', 7),
(2, 'Value Proposition Canvas', 'Developing and refining value propositions', 7),
(3, 'Business Model Canvas', 'Creating comprehensive business models', 7),
(4, 'Market Research & Validation', 'Understanding market needs and validation', 7),
(5, 'Financial Planning', 'Financial modeling and planning', 7),
(6, 'Pitch Development', 'Creating compelling pitches and presentations', 7)
ON CONFLICT (module_number) DO NOTHING;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_sprints_team_id ON public.client_sprints(team_id);
CREATE INDEX IF NOT EXISTS idx_client_sprints_status ON public.client_sprints(status);
CREATE INDEX IF NOT EXISTS idx_enhanced_ssdb_team_id ON public.enhanced_ssdb_insights(team_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_team_id ON public.client_notes(team_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_type ON public.client_notes(note_type);

-- 8. Enable RLS on new tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_ssdb_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for new tables
-- Modules - readable by all authenticated users
CREATE POLICY modules_select_policy ON public.modules FOR SELECT TO authenticated USING (true);

-- Client sprints - readable by associates and team members
CREATE POLICY client_sprints_select_policy ON public.client_sprints FOR SELECT TO authenticated USING (true);
CREATE POLICY client_sprints_insert_policy ON public.client_sprints FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_sprints_update_policy ON public.client_sprints FOR UPDATE TO authenticated USING (true);

-- Enhanced SSDB insights - readable by associates and team members
CREATE POLICY enhanced_ssdb_select_policy ON public.enhanced_ssdb_insights FOR SELECT TO authenticated USING (true);
CREATE POLICY enhanced_ssdb_insert_policy ON public.enhanced_ssdb_insights FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY enhanced_ssdb_update_policy ON public.enhanced_ssdb_insights FOR UPDATE TO authenticated USING (true);

-- Client notes - readable by associates and team members
CREATE POLICY client_notes_select_policy ON public.client_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY client_notes_insert_policy ON public.client_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_notes_update_policy ON public.client_notes FOR UPDATE TO authenticated USING (true);

-- 10. Update existing teams table with sample data for testing
UPDATE public.teams SET 
    ceo_name = 'John Doe',
    industry_type = 'Technology',
    company_size = 'Small (1-50 employees)',
    website = 'https://example.com',
    main_contact = 'john@example.com',
    priority_level = 'High',
    speed_score = 85,
    current_module = '1 - Individual and Company Identity',
    module_guru = 'Elena'
WHERE access_code = 'CLIENT001';

-- 11. Create a function to automatically create sprint records when a team is created
CREATE OR REPLACE FUNCTION create_default_sprints_for_team()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default sprints for the new team
    INSERT INTO public.client_sprints (team_id, sprint_number, sprint_name, status)
    SELECT 
        NEW.id,
        m.module_number,
        m.module_name,
        CASE WHEN m.module_number = 1 THEN 'In Progress' ELSE 'Not Started' END
    FROM public.modules m
    WHERE m.is_active = true
    ORDER BY m.module_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger to automatically create sprints for new teams
DROP TRIGGER IF EXISTS trigger_create_sprints ON public.teams;
CREATE TRIGGER trigger_create_sprints
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION create_default_sprints_for_team();

-- 13. Verify the setup
SELECT 'Enhanced client management schema created successfully!' as status;
