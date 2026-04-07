-- Database Schema for Ukrainian Translation & Notary Booking System
-- PostgreSQL / Supabase

-- Services Table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_uk TEXT NOT NULL,
  description_en TEXT,
  description_uk TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default services
INSERT INTO services (name_en, name_uk, description_en, description_uk, duration_minutes, price) VALUES
  ('Notary Service', 'Нотаріальні послуги', 'Document notarization and certification', 'Нотаріальне посвідчення та сертифікація документів', 30, 50.00),
  ('Document Translation', 'Переклад документів', 'Professional Ukrainian-English translation', 'Професійний переклад українською-англійською', 60, 100.00),
  ('Consultation', 'Консультація', 'General consultation on documents and services', 'Загальна консультація щодо документів та послуг', 30, 40.00);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  
  -- Client information
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  
  -- Appointment details
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  
  -- Status management
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled', 'completed')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table (for file uploads)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blocked Times Table (for admin to mark unavailability)
CREATE TABLE blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users Table (using Supabase Auth)
-- Note: Supabase handles auth.users automatically
-- We can add a custom admin_profiles table if needed
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Working Hours Table
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_open BOOLEAN DEFAULT true
);

-- Default working hours (Monday-Friday 9am-5pm)
INSERT INTO working_hours (day_of_week, start_time, end_time, is_open) VALUES
  (1, '09:00', '17:00', true), -- Monday
  (2, '09:00', '17:00', true), -- Tuesday
  (3, '09:00', '17:00', true), -- Wednesday
  (4, '09:00', '17:00', true), -- Thursday
  (5, '09:00', '17:00', true), -- Friday
  (0, '09:00', '17:00', false), -- Sunday (closed)
  (6, '09:00', '17:00', false); -- Saturday (closed)

-- Indexes for performance
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_blocked_times_dates ON blocked_times(start_date, end_date);

-- Row Level Security (RLS) Policies for Supabase

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

-- Public can read services and working hours
CREATE POLICY "Public can read services" ON services
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read working hours" ON working_hours
  FOR SELECT USING (true);

-- Public can create appointments
CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "Admins can manage appointments" ON appointments
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage services" ON services
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage blocked times" ON blocked_times
  USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
