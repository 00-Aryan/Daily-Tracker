-- 2. USER PROFILE
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  learning_style TEXT,
  current_goals TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. SUBJECTS
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. SUBTOPICS
CREATE TABLE subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- 5. PLATFORMS
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- 6. PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. TASKS
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('study', 'general')) NOT NULL,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  deadline DATE,
  status TEXT CHECK (status IN ('today', 'done', 'backlog')) DEFAULT 'today',
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  subtopic_id UUID REFERENCES subtopics(id) ON DELETE SET NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
  problem_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  moved_to_backlog_at TIMESTAMP
);

-- 8. DAILY LOGS
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  what_i_did TEXT,
  blockers TEXT,
  tomorrow_intention TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- 9. TOPIC LEVELS
CREATE TABLE topic_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE,
  numerical_score FLOAT DEFAULT 1.0 CHECK (numerical_score BETWEEN 1.0 AND 10.0),
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_attempted TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. STUDY QUESTIONS
CREATE TABLE study_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  subtopic_id UUID REFERENCES subtopics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  generated_by TEXT DEFAULT 'gemini',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. STUDY ATTEMPTS
CREATE TABLE study_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES study_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  gemini_raw_score FLOAT CHECK (gemini_raw_score BETWEEN 0.0 AND 1.0),
  final_score FLOAT,
  feedback TEXT,
  is_correct BOOLEAN,
  scheduled_for DATE,
  attempt_date TIMESTAMP DEFAULT NOW()
);

-- 12. JOB APPLICATIONS
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL,
  jd_link TEXT,
  date_applied DATE NOT NULL,
  platform TEXT,
  resume_version TEXT,
  status TEXT CHECK (status IN ('Applied', 'Screening', 'Interview', 'Offer', 'Rejected')) DEFAULT 'Applied',
  notes TEXT,
  follow_up_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);