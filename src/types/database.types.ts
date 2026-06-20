export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          buffer_time_minutes: number
          created_at: string | null
          end_time: string
          id: string
          start_time: string
          working_days: number[] | null
        }
        Insert: {
          buffer_time_minutes?: number
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          working_days?: number[] | null
        }
        Update: {
          buffer_time_minutes?: number
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          working_days?: number[] | null
        }
      }
      bookings: {
        Row: {
          created_at: string | null
          end_time: string
          id: string
          service_id: string
          start_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          id?: string
          service_id: string
          start_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          id?: string
          service_id?: string
          start_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | null
          user_id?: string
        }
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
        }
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: 'user' | 'admin' | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          role?: 'user' | 'admin' | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: 'user' | 'admin' | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      user_role: 'user' | 'admin'
    }
  }
}
