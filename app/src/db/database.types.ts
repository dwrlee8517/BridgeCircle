export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_role_assignments: {
        Row: {
          granted_at: string
          granted_by: string | null
          organization_id: string
          role: Database['public']['Enums']['admin_role']
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          organization_id: string
          role: Database['public']['Enums']['admin_role']
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          organization_id?: string
          role?: Database['public']['Enums']['admin_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_role_assignments_granted_by_fkey'
            columns: ['granted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'admin_role_assignments_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'admin_role_assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          published_at: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          published_at?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          published_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'announcements_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      ask_threads: {
        Row: {
          ask_id: string
          asker_id: string
          created_at: string
          helper_id: string
          id: string
          last_message_at: string | null
          status: Database['public']['Enums']['ask_thread_status']
        }
        Insert: {
          ask_id: string
          asker_id: string
          created_at?: string
          helper_id: string
          id?: string
          last_message_at?: string | null
          status?: Database['public']['Enums']['ask_thread_status']
        }
        Update: {
          ask_id?: string
          asker_id?: string
          created_at?: string
          helper_id?: string
          id?: string
          last_message_at?: string | null
          status?: Database['public']['Enums']['ask_thread_status']
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_threads_mentee_id_fkey'
            columns: ['asker_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_threads_mentor_id_fkey'
            columns: ['helper_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_threads_request_id_fkey'
            columns: ['ask_id']
            isOneToOne: false
            referencedRelation: 'asks'
            referencedColumns: ['id']
          },
        ]
      }
      asks: {
        Row: {
          ask_type: Database['public']['Enums']['ask_type']
          asker_id: string
          background: string | null
          created_at: string
          help_needed: string | null
          helper_id: string
          id: string
          organization_id: string
          reason: string | null
          responded_at: string | null
          screening_answer: string | null
          status: Database['public']['Enums']['ask_status']
        }
        Insert: {
          ask_type?: Database['public']['Enums']['ask_type']
          asker_id: string
          background?: string | null
          created_at?: string
          help_needed?: string | null
          helper_id: string
          id?: string
          organization_id: string
          reason?: string | null
          responded_at?: string | null
          screening_answer?: string | null
          status?: Database['public']['Enums']['ask_status']
        }
        Update: {
          ask_type?: Database['public']['Enums']['ask_type']
          asker_id?: string
          background?: string | null
          created_at?: string
          help_needed?: string | null
          helper_id?: string
          id?: string
          organization_id?: string
          reason?: string | null
          responded_at?: string | null
          screening_answer?: string | null
          status?: Database['public']['Enums']['ask_status']
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_requests_mentee_id_fkey'
            columns: ['asker_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_requests_mentor_id_fkey'
            columns: ['helper_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'mentorship_requests_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          organization_id: string | null
          payload: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_log_actor_id_fkey'
            columns: ['actor_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_log_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      base_profiles: {
        Row: {
          avatar_url: string | null
          career_history: Json | null
          city: string | null
          created_at: string
          current_employer: string | null
          current_title: string | null
          education_history: Json | null
          headline: string | null
          linkedin_url: string | null
          major: string | null
          name: string | null
          privacy_settings: Json
          skills: string[] | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          career_history?: Json | null
          city?: string | null
          created_at?: string
          current_employer?: string | null
          current_title?: string | null
          education_history?: Json | null
          headline?: string | null
          linkedin_url?: string | null
          major?: string | null
          name?: string | null
          privacy_settings?: Json
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          career_history?: Json | null
          city?: string | null
          created_at?: string
          current_employer?: string | null
          current_title?: string | null
          education_history?: Json | null
          headline?: string | null
          linkedin_url?: string | null
          major?: string | null
          name?: string | null
          privacy_settings?: Json
          skills?: string[] | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'base_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      direct_message_threads: {
        Row: {
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'direct_message_threads_user_a_id_fkey'
            columns: ['user_a_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'direct_message_threads_user_b_id_fkey'
            columns: ['user_b_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      event_rsvps: {
        Row: {
          event_id: string
          responded_at: string
          status: Database['public']['Enums']['event_rsvp_status']
          user_id: string
        }
        Insert: {
          event_id: string
          responded_at?: string
          status: Database['public']['Enums']['event_rsvp_status']
          user_id: string
        }
        Update: {
          event_id?: string
          responded_at?: string
          status?: Database['public']['Enums']['event_rsvp_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_rsvps_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_rsvps_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          organization_id: string
          published_at: string | null
          starts_at: string
          title: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organization_id: string
          published_at?: string | null
          starts_at: string
          title: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          published_at?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: Database['public']['Enums']['friend_request_status']
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database['public']['Enums']['friend_request_status']
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database['public']['Enums']['friend_request_status']
        }
        Relationships: [
          {
            foreignKeyName: 'friend_requests_receiver_id_fkey'
            columns: ['receiver_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'friend_requests_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'friendships_user_a_id_fkey'
            columns: ['user_a_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'friendships_user_b_id_fkey'
            columns: ['user_b_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      helper_preferences: {
        Row: {
          created_at: string
          max_active_mentees: number
          max_pending_requests: number
          open_to_advice: boolean
          open_to_mentorship: boolean
          organization_membership_id: string
          paused_at: string | null
          screening_prompt: string | null
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          max_active_mentees?: number
          max_pending_requests?: number
          open_to_advice?: boolean
          open_to_mentorship?: boolean
          organization_membership_id: string
          paused_at?: string | null
          screening_prompt?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          max_active_mentees?: number
          max_pending_requests?: number
          open_to_advice?: boolean
          open_to_mentorship?: boolean
          organization_membership_id?: string
          paused_at?: string | null
          screening_prompt?: string | null
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_preferences_organization_membership_id_fkey'
            columns: ['organization_membership_id']
            isOneToOne: true
            referencedRelation: 'organization_memberships'
            referencedColumns: ['id']
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string | null
          full_name: string | null
          graduation_year: number | null
          id: string
          organization_id: string
          sent_by: string | null
          status: Database['public']['Enums']['invite_status']
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          organization_id: string
          sent_by?: string | null
          status?: Database['public']['Enums']['invite_status']
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          organization_id?: string
          sent_by?: string | null
          status?: Database['public']['Enums']['invite_status']
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: 'invites_accepted_by_fkey'
            columns: ['accepted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invites_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invites_sent_by_fkey'
            columns: ['sent_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          thread_id: string
          thread_type: Database['public']['Enums']['message_thread_type']
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          thread_id: string
          thread_type: Database['public']['Enums']['message_thread_type']
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
          thread_type?: Database['public']['Enums']['message_thread_type']
        }
        Relationships: [
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          payload: Json | null
          read_at: string | null
          target_id: string | null
          target_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json | null
          read_at?: string | null
          target_id?: string | null
          target_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      organization_memberships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          joined_at: string | null
          organization_id: string
          status: Database['public']['Enums']['membership_status']
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id: string
          status?: Database['public']['Enums']['membership_status']
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
          status?: Database['public']['Enums']['membership_status']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_memberships_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'organization_memberships_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      organization_profiles: {
        Row: {
          bio: string | null
          created_at: string
          graduation_year: number | null
          mentoring_topics: string[] | null
          open_to_mentor: boolean
          organization_membership_id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          graduation_year?: number | null
          mentoring_topics?: string[] | null
          open_to_mentor?: boolean
          organization_membership_id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          graduation_year?: number | null
          mentoring_topics?: string[] | null
          open_to_mentor?: boolean
          organization_membership_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organization_profiles_organization_membership_id_fkey'
            columns: ['organization_membership_id']
            isOneToOne: true
            referencedRelation: 'organization_memberships'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          requires_admin_approval: boolean
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_admin_approval?: boolean
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_admin_approval?: boolean
          slug?: string
        }
        Relationships: []
      }
      profile_refresh_prompts: {
        Row: {
          completed_at: string | null
          created_at: string
          due_at: string
          id: string
          organization_membership_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_at: string
          id?: string
          organization_membership_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_at?: string
          id?: string
          organization_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profile_refresh_prompts_organization_membership_id_fkey'
            columns: ['organization_membership_id']
            isOneToOne: false
            referencedRelation: 'organization_memberships'
            referencedColumns: ['id']
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          notify_cadence: string | null
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          notify_cadence?: string | null
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          notify_cadence?: string | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'saved_searches_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_searches_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          delete_initiated_by_admin: boolean
          delete_reason: string | null
          delete_scheduled_for: string | null
          deleted_at: string | null
          id: string
          last_seen_at: string | null
        }
        Insert: {
          created_at?: string
          delete_initiated_by_admin?: boolean
          delete_reason?: string | null
          delete_scheduled_for?: string | null
          deleted_at?: string | null
          id: string
          last_seen_at?: string | null
        }
        Update: {
          created_at?: string
          delete_initiated_by_admin?: boolean
          delete_reason?: string | null
          delete_scheduled_for?: string | null
          deleted_at?: string | null
          id?: string
          last_seen_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      analytics_active_membership_count: {
        Row: {
          active_members: number | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'organization_memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_invited_to_active: {
        Row: {
          became_active_30d: number | null
          invited_30d: number | null
          organization_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invites_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_mentorship_30d: {
        Row: {
          eligible_for_response_check: number | null
          organization_id: string | null
          responded_within_7d: number | null
          total_requests: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'mentorship_requests_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_profile_freshness: {
        Row: {
          fresh_profiles: number | null
          organization_id: string | null
          total_active: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'organization_memberships_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_upcoming_rsvps: {
        Row: {
          going_count: number | null
          organization_id: string | null
          upcoming_events: number | null
          waitlist_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'events_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      analytics_active_signed_in_count: {
        Args: { _org: string; _within?: string }
        Returns: number
      }
      is_active_member_of: { Args: { org_id: string }; Returns: boolean }
      is_admin_of: { Args: { org_id: string }; Returns: boolean }
      shares_org_with: { Args: { other_user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: 'super_admin' | 'admin' | 'event_moderator' | 'ambassador'
      ask_status: 'pending' | 'accepted' | 'declined' | 'expired'
      ask_thread_status: 'active' | 'archived'
      ask_type: 'advice' | 'mentorship'
      event_rsvp_status: 'going' | 'not_going' | 'waitlisted'
      friend_request_status: 'pending' | 'accepted' | 'declined'
      invite_status: 'pending' | 'accepted' | 'expired' | 'revoked'
      membership_status: 'pending' | 'active' | 'rejected' | 'revoked' | 'self_deactivated'
      message_thread_type: 'ask' | 'direct'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: ['super_admin', 'admin', 'event_moderator', 'ambassador'],
      ask_status: ['pending', 'accepted', 'declined', 'expired'],
      ask_thread_status: ['active', 'archived'],
      ask_type: ['advice', 'mentorship'],
      event_rsvp_status: ['going', 'not_going', 'waitlisted'],
      friend_request_status: ['pending', 'accepted', 'declined'],
      invite_status: ['pending', 'accepted', 'expired', 'revoked'],
      membership_status: ['pending', 'active', 'rejected', 'revoked', 'self_deactivated'],
      message_thread_type: ['ask', 'direct'],
    },
  },
} as const
