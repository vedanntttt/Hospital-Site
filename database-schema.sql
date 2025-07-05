-- Run this SQL in your Supabase SQL editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create patients table (simplified - matches Dashboard form)
CREATE TABLE patients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  gender VARCHAR(10),
  contact VARCHAR(20),
  date DATE,
  doctor VARCHAR(255)
);

-- Create schedule_slots table (matches exactly what's shown on schedule page)
CREATE TABLE schedule_slots (
  id BIGSERIAL PRIMARY KEY,
  slot_time VARCHAR(50) NOT NULL,
  patient_name VARCHAR(255),
  patient_phone VARCHAR(20),
  date DATE NOT NULL,
  doctor_name VARCHAR(255) NOT NULL
);

-- Create user_profiles table for additional user data
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255),
  role VARCHAR(50),
  full_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_date ON patients(date);
CREATE INDEX idx_patients_doctor ON patients(doctor);
CREATE INDEX idx_schedule_doctor_date ON schedule_slots(doctor_name, date);
CREATE INDEX idx_schedule_date ON schedule_slots(date);

-- Row Level Security Policies
-- Patients table policies
CREATE POLICY "Users can view all patients" ON patients
  FOR SELECT USING (true);

CREATE POLICY "Users can insert patients" ON patients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update patients" ON patients
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete patients" ON patients
  FOR DELETE USING (true);

-- Schedule slots policies
CREATE POLICY "Users can view all schedule slots" ON schedule_slots
  FOR SELECT USING (true);

CREATE POLICY "Users can insert schedule slots" ON schedule_slots
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update schedule slots" ON schedule_slots
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete schedule slots" ON schedule_slots
  FOR DELETE USING (true);

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
