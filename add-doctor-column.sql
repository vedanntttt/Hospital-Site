-- Migration script to add doctor_name column to schedule_slots table
-- Run this in your Supabase SQL Editor

-- Add doctor_name column to schedule_slots table
ALTER TABLE schedule_slots 
ADD COLUMN doctor_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Doctor';

-- Update the index to include doctor_name for better performance
DROP INDEX IF EXISTS idx_schedule_doctor_date;
CREATE INDEX idx_schedule_doctor_date ON schedule_slots(doctor_name, date);

-- Optional: Update existing records with a default doctor name
-- You can customize this based on your existing data
UPDATE schedule_slots 
SET doctor_name = 'Aditi Mam' 
WHERE doctor_name = 'Unknown Doctor';

-- Remove the default constraint after updating existing records
ALTER TABLE schedule_slots 
ALTER COLUMN doctor_name DROP DEFAULT;
