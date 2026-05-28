-- ProductivOS — Row Level Security (RLS) Policies
-- This file defines the isolation policies for all primary tables.

-- 1. Enable RLS on all tables
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- 2. Define standard isolation policies for Authenticated Users
-- Requirement: Authenticated users can only see and manage their own records.

CREATE POLICY "Users can manage their own user_profile" ON user_profile FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own subjects" ON subjects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own subtopics" ON subtopics FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own platforms" ON platforms FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own tasks" ON tasks FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own daily_logs" ON daily_logs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own topic_levels" ON topic_levels FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own study_questions" ON study_questions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own study_attempts" ON study_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can manage their own job_applications" ON job_applications FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Define temporary policies for Anonymous/Development Fallback
-- Requirement: The DUMMY_USER_ID ('00000000-0000-0000-0000-000000000000') 
-- must remain accessible until final cutover.

CREATE POLICY "Anonymous access to dummy user_profile" ON user_profile FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy subjects" ON subjects FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy subtopics" ON subtopics FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy platforms" ON platforms FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy projects" ON projects FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy tasks" ON tasks FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy daily_logs" ON daily_logs FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy topic_levels" ON topic_levels FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy study_questions" ON study_questions FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy study_attempts" ON study_attempts FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
CREATE POLICY "Anonymous access to dummy job_applications" ON job_applications FOR ALL TO anon, authenticated USING (user_id = '00000000-0000-0000-0000-000000000000') WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000');
