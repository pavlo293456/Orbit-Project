import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Type definitions for database tables
export type Service = {
  id: string
  name_en: string
  name_uk: string
  description_en: string | null
  description_uk: string | null
  duration_minutes: number
  price: number | null
  active: boolean
  created_at: string
}

export type Appointment = {
  id: string
  service_id: string
  client_name: string
  client_email: string
  client_phone: string
  appointment_date: string
  appointment_time: string
  notes: string | null
  status: 'pending' | 'approved' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

export type BlockedTime = {
  id: string
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
  all_day: boolean
  created_at: string
}

export type WorkingHours = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_open: boolean
}
