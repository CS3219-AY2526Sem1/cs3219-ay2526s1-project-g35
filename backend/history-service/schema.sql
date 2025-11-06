-- History Service Database Schema
-- PostgreSQL 14+
-- Database: historydb

-- ============================================
-- Create histories table
-- ============================================

CREATE TABLE IF NOT EXISTS histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    question_title VARCHAR(500) NOT NULL,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_id ON histories(user_id);
CREATE INDEX IF NOT EXISTS idx_difficulty ON histories(difficulty);
CREATE INDEX IF NOT EXISTS idx_category ON histories(category);
CREATE INDEX IF NOT EXISTS idx_created_at ON histories(created_at);
CREATE INDEX IF NOT EXISTS idx_user_created ON histories(user_id, created_at);

-- ============================================
-- Verify table creation
-- ============================================

-- Check table structure
\d histories

-- Display indexes
\di

-- Sample query to verify
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_name = 'histories';

-- Display table info
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'histories'
ORDER BY ordinal_position;
