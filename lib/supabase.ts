import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function createSupabaseClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }
  return createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export const supabase = createSupabaseClient()

export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  first_name: string | null
  last_name: string | null
  country: string | null
  contact_address: string | null
  country_code: string | null
  phone_number: string | null
  receive_updates: boolean
}

export interface Shipment {
  id: string
  user_id: string | null
  tracking_number: string
  status: string
  origin: string
  destination: string
  estimated_delivery: string | null
  created_at: string
  updated_at: string
}

export interface TrackingUpdate {
  id: string
  shipment_id: string | null
  location: string
  description: string | null
  status: string
  occurrence_time: string
}

export const SHIPMENT_STATUSES = [
  'Pending',
  'Processing',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'On Hold',
  'Returned',
]
