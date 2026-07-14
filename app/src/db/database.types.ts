export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { p_token: string }
        Returns: {
          membership_id: string
          membership_status: string
          result_code: string
        }[]
      }
      block_member: { Args: { p_blocked_user_id: string }; Returns: undefined }
      claim_outbox_jobs: {
        Args: { p_limit?: number; p_worker_id: string }
        Returns: {
          attempts: number
          available_at: string
          id: number
          job_type: string
          locked_at: string
          locked_by: string
          max_attempts: number
          payload: Json
        }[]
      }
      complete_onboarding: {
        Args: { p_membership_id: string }
        Returns: {
          completed_at: string
          result_code: string
        }[]
      }
      complete_outbox_job: {
        Args: { p_job_id: number; p_worker_id: string }
        Returns: string
      }
      create_circle_ask: {
        Args: {
          p_anonymous_until_accepted: boolean
          p_asker_membership_id: string
          p_client_request_id: string
          p_question: string
          p_reach: string
        }
        Returns: string
      }
      create_direct_ask: {
        Args: {
          p_asker_membership_id: string
          p_client_request_id: string
          p_question: string
          p_recipient_membership_id: string
          p_request_message: string
        }
        Returns: string
      }
      decide_membership: {
        Args: { p_decision: string; p_membership_id: string }
        Returns: {
          membership_status: string
          result_code: string
        }[]
      }
      decide_offer: {
        Args: {
          p_client_nonce?: string
          p_decision: string
          p_decline_note?: string
          p_decline_reason_code?: string
          p_offer_id: string
          p_opening_message?: string
        }
        Returns: string
      }
      disconnect: { Args: { p_other_user_id: string }; Returns: undefined }
      fail_outbox_job: {
        Args: { p_error: string; p_job_id: number; p_worker_id: string }
        Returns: string
      }
      get_ask_detail: {
        Args: { p_ask_id: string }
        Returns: {
          accepted_at: string
          anonymous_until_accepted: boolean
          ask_id: string
          asker_user_id: string
          closure_reason: string
          created_at: string
          decline_note: string
          decline_reason_code: string
          ended_at: string
          expires_at: string
          kind: string
          organization_id: string
          outcome_note: string
          question: string
          reach: string
          recipient_user_id: string
          request_message: string
          status: string
        }[]
      }
      get_conversation_detail: {
        Args: { p_conversation_id: string }
        Returns: {
          ask_id: string
          can_send: boolean
          conversation_id: string
          counterpart_avatar_path: string
          counterpart_display_name: string
          counterpart_graduation_year: number
          counterpart_last_read_at: string
          counterpart_last_read_message_id: number
          counterpart_user_id: string
          created_at: string
          kind: string
          last_message_at: string
          latest_message_id: number
          organization_id: string
          viewer_last_read_at: string
          viewer_last_read_message_id: number
        }[]
      }
      get_my_member_context: {
        Args: { p_preferred_membership_id?: string }
        Returns: {
          account_state: string
          delete_initiated_by_admin: boolean
          delete_scheduled_for: string
          deleted_at: string
          memberships: Json
          onboarding_completed_at: string
          requires_circle_choice: boolean
          selected_membership_id: string
          unread_notification_count: number
        }[]
      }
      get_my_profile: {
        Args: { p_membership_id: string }
        Returns: {
          profile: Json
          result_code: string
        }[]
      }
      get_or_create_direct_conversation: {
        Args: { p_other_user_id: string }
        Returns: {
          conversation_id: string
          result_code: string
        }[]
      }
      list_conversation_messages_after: {
        Args: {
          p_after_id?: number
          p_conversation_id: string
          p_limit?: number
        }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          id: number
          kind: string
          sender_user_id: string
          system_actor_user_id: string
          system_event_type: string
        }[]
      }
      list_conversation_messages_before: {
        Args: {
          p_before_id?: number
          p_conversation_id: string
          p_limit?: number
        }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          id: number
          kind: string
          sender_user_id: string
          system_actor_user_id: string
          system_event_type: string
        }[]
      }
      list_give_help: {
        Args: { p_before?: string; p_limit?: number }
        Returns: {
          anonymous_until_accepted: boolean
          ask_id: string
          asker_user_id: string
          created_at: string
          kind: string
          match_reason: string
          organization_id: string
          question: string
          reach: string
        }[]
      }
      list_help_matches: {
        Args: { p_ask_id: string }
        Returns: {
          display_name: string
          headline: string
          helper_membership_id: string
          helper_user_id: string
          rank: number
          reason: string
          score: number
        }[]
      }
      mark_conversation_read: {
        Args: { p_conversation_id: string; p_message_id: number }
        Returns: {
          last_read_at: string
          last_read_message_id: number
          result_code: string
        }[]
      }
      mark_notifications_read: {
        Args: { p_notification_ids: number[] }
        Returns: number
      }
      offer_to_help: {
        Args: {
          p_ask_id: string
          p_client_request_id: string
          p_helper_membership_id: string
          p_offer_note: string
        }
        Returns: string
      }
      publish_conversation_typing: {
        Args: { p_conversation_id: string; p_is_typing: boolean }
        Returns: {
          expires_at: string
          result_code: string
        }[]
      }
      resolve_ask: {
        Args: { p_ask_id: string; p_outcome_note?: string }
        Returns: undefined
      }
      respond_to_connection_request: {
        Args: { p_decision: string; p_request_id: string }
        Returns: string
      }
      respond_to_direct_ask: {
        Args: {
          p_ask_id: string
          p_client_nonce?: string
          p_decision: string
          p_decline_note?: string
          p_decline_reason_code?: string
          p_opening_message?: string
        }
        Returns: string
      }
      retract_ask: { Args: { p_ask_id: string }; Returns: undefined }
      retry_outbox_job: {
        Args: {
          p_available_at: string
          p_error: string
          p_job_id: number
          p_worker_id: string
        }
        Returns: string
      }
      save_profile_current: {
        Args: {
          p_city: string
          p_current_employer: string
          p_current_title: string
          p_headline: string
          p_linkedin_url: string
          p_membership_id: string
        }
        Returns: string
      }
      save_profile_education: {
        Args: {
          p_education: Json
          p_major: string
          p_membership_id: string
          p_university: string
        }
        Returns: string
      }
      save_profile_history: {
        Args: {
          p_experiences: Json
          p_membership_id: string
          p_skills: string[]
        }
        Returns: string
      }
      save_profile_identity: {
        Args: {
          p_display_name: string
          p_graduation_year: number
          p_membership_id: string
          p_name_other: string
          p_preferred_name: string
        }
        Returns: string
      }
      save_profile_preferences: {
        Args: {
          p_bio: string
          p_freshness_consent: boolean
          p_linkedin_url: string
          p_membership_id: string
          p_open_to_help: boolean
          p_refresh_interval: string
          p_refresh_policy: string
          p_topics: string[]
        }
        Returns: string
      }
      send_connection_request: {
        Args: {
          p_client_request_id: string
          p_intro_message: string
          p_origin_organization_id: string
          p_recipient_user_id: string
        }
        Returns: string
      }
      send_message: {
        Args: {
          p_body: string
          p_client_nonce: string
          p_conversation_id: string
        }
        Returns: {
          created_at: string
          message_id: number
          result_code: string
        }[]
      }
      set_event_rsvp: {
        Args: { p_event_id: string; p_membership_id: string; p_status: string }
        Returns: string
      }
      set_my_avatar_path: {
        Args: { p_avatar_path: string; p_membership_id: string }
        Returns: string
      }
      submit_report: {
        Args: {
          p_note?: string
          p_reason: string
          p_target_id: string
          p_target_type: string
        }
        Returns: string
      }
      unblock_member: {
        Args: { p_blocked_user_id: string }
        Returns: undefined
      }
      verify_invite: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          full_name: string
          graduation_year: number
          invite_id: string
          organization_id: string
          organization_name: string
          organization_slug: string
          result_code: string
        }[]
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
          granted_by_membership_id: string | null
          id: string
          organization_id: string
          organization_membership_id: string
          role: string
        }
        Insert: {
          granted_at?: string
          granted_by_membership_id?: string | null
          id?: string
          organization_id: string
          organization_membership_id: string
          role: string
        }
        Update: {
          granted_at?: string
          granted_by_membership_id?: string | null
          id?: string
          organization_id?: string
          organization_membership_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_assignments_granter_fk"
            columns: ["organization_id", "granted_by_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "admin_role_assignments_member_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "admin_role_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author_membership_id: string | null
          body: string
          created_at: string
          id: string
          organization_id: string
          pinned: boolean
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_membership_id?: string | null
          body: string
          created_at?: string
          id?: string
          organization_id: string
          pinned?: boolean
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_membership_id?: string | null
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          pinned?: boolean
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_fk"
            columns: ["organization_id", "author_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ask_offers: {
        Row: {
          ask_id: string
          client_request_id: string
          closed_at: string | null
          closure_reason: string | null
          created_at: string
          decline_note: string | null
          decline_reason_code: string | null
          helper_membership_id: string
          id: string
          offer_note: string
          organization_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ask_id: string
          client_request_id: string
          closed_at?: string | null
          closure_reason?: string | null
          created_at?: string
          decline_note?: string | null
          decline_reason_code?: string | null
          helper_membership_id: string
          id?: string
          offer_note: string
          organization_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ask_id?: string
          client_request_id?: string
          closed_at?: string | null
          closure_reason?: string | null
          created_at?: string
          decline_note?: string | null
          decline_reason_code?: string | null
          helper_membership_id?: string
          id?: string
          offer_note?: string
          organization_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ask_offers_ask_id_fkey"
            columns: ["ask_id"]
            isOneToOne: false
            referencedRelation: "asks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ask_offers_helper_membership_fk"
            columns: ["organization_id", "helper_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "ask_offers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      asks: {
        Row: {
          accepted_at: string | null
          anonymous_until_accepted: boolean
          asker_membership_id: string
          client_request_id: string
          closure_reason: string | null
          created_at: string
          decline_note: string | null
          decline_reason_code: string | null
          ended_at: string | null
          expires_at: string
          id: string
          kind: string
          organization_id: string
          outcome_note: string | null
          question: string
          reach: string | null
          recipient_membership_id: string | null
          reminder_sent_at: string | null
          reopened_from_ask_id: string | null
          request_message: string | null
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          anonymous_until_accepted?: boolean
          asker_membership_id: string
          client_request_id: string
          closure_reason?: string | null
          created_at?: string
          decline_note?: string | null
          decline_reason_code?: string | null
          ended_at?: string | null
          expires_at?: string
          id?: string
          kind: string
          organization_id: string
          outcome_note?: string | null
          question: string
          reach?: string | null
          recipient_membership_id?: string | null
          reminder_sent_at?: string | null
          reopened_from_ask_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          anonymous_until_accepted?: boolean
          asker_membership_id?: string
          client_request_id?: string
          closure_reason?: string | null
          created_at?: string
          decline_note?: string | null
          decline_reason_code?: string | null
          ended_at?: string | null
          expires_at?: string
          id?: string
          kind?: string
          organization_id?: string
          outcome_note?: string | null
          question?: string
          reach?: string | null
          recipient_membership_id?: string | null
          reminder_sent_at?: string | null
          reopened_from_ask_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asks_asker_membership_fk"
            columns: ["organization_id", "asker_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "asks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asks_recipient_membership_fk"
            columns: ["organization_id", "recipient_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "asks_reopened_from_ask_id_fkey"
            columns: ["reopened_from_ask_id"]
            isOneToOne: false
            referencedRelation: "asks"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_requests: {
        Row: {
          client_request_id: string
          created_at: string
          id: string
          intro_message: string | null
          origin_organization_id: string | null
          recipient_user_id: string
          requester_user_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_request_id: string
          created_at?: string
          id?: string
          intro_message?: string | null
          origin_organization_id?: string | null
          recipient_user_id: string
          requester_user_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_request_id?: string
          created_at?: string
          id?: string
          intro_message?: string | null
          origin_organization_id?: string | null
          recipient_user_id?: string
          requester_user_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_origin_organization_id_fkey"
            columns: ["origin_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_requester_user_id_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          connection_request_id: string | null
          created_at: string
          id: string
          origin_organization_id: string | null
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          connection_request_id?: string | null
          created_at?: string
          id?: string
          origin_organization_id?: string | null
          user_a_id: string
          user_b_id: string
        }
        Update: {
          connection_request_id?: string | null
          created_at?: string
          id?: string
          origin_organization_id?: string | null
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_connection_request_id_fkey"
            columns: ["connection_request_id"]
            isOneToOne: true
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_origin_organization_id_fkey"
            columns: ["origin_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          last_read_message_id: number | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          last_read_message_id?: number | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          last_read_message_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reads_message_fk"
            columns: ["conversation_id", "last_read_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["conversation_id", "id"]
          },
          {
            foreignKeyName: "conversation_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ask_id: string | null
          created_at: string
          id: string
          kind: string
          last_message_at: string | null
          organization_id: string | null
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          ask_id?: string | null
          created_at?: string
          id?: string
          kind: string
          last_message_at?: string | null
          organization_id?: string | null
          user_a_id: string
          user_b_id: string
        }
        Update: {
          ask_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          last_message_at?: string | null
          organization_id?: string | null
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ask_id_fkey"
            columns: ["ask_id"]
            isOneToOne: false
            referencedRelation: "asks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_a_id_fkey"
            columns: ["user_a_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_b_id_fkey"
            columns: ["user_b_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          event_id: string
          organization_id: string
          organization_membership_id: string
          responded_at: string
          status: string
        }
        Insert: {
          event_id: string
          organization_id: string
          organization_membership_id: string
          responded_at?: string
          status: string
        }
        Update: {
          event_id?: string
          organization_id?: string
          organization_membership_id?: string
          responded_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_fk"
            columns: ["organization_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "event_rsvps_membership_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "event_rsvps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cancelled_at: string | null
          capacity: number | null
          created_at: string
          created_by_membership_id: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          organization_id: string
          published_at: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          capacity?: number | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organization_id: string
          published_at?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          capacity?: number | null
          created_at?: string
          created_by_membership_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          published_at?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_fk"
            columns: ["organization_id", "created_by_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      helper_preferences: {
        Row: {
          consecutive_timeouts: number
          created_at: string
          max_pending_requests: number
          open_to_help: boolean
          organization_id: string
          organization_membership_id: string
          pause_reason: string | null
          paused_at: string | null
          updated_at: string
        }
        Insert: {
          consecutive_timeouts?: number
          created_at?: string
          max_pending_requests?: number
          open_to_help?: boolean
          organization_id: string
          organization_membership_id: string
          pause_reason?: string | null
          paused_at?: string | null
          updated_at?: string
        }
        Update: {
          consecutive_timeouts?: number
          created_at?: string
          max_pending_requests?: number
          open_to_help?: boolean
          organization_id?: string
          organization_membership_id?: string
          pause_reason?: string | null
          paused_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helper_preferences_membership_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "helper_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      helper_topics: {
        Row: {
          created_at: string
          name: string
          normalized_name: string
          organization_id: string
          organization_membership_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          name: string
          normalized_name: string
          organization_id: string
          organization_membership_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          name?: string
          normalized_name?: string
          organization_id?: string
          organization_membership_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "helper_topics_membership_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "helper_topics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          email: string
          email_normalized: string
          expires_at: string
          full_name: string | null
          graduation_year: number | null
          id: string
          organization_id: string
          sent_by_membership_id: string | null
          status: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email: string
          email_normalized: string
          expires_at: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          organization_id: string
          sent_by_membership_id?: string | null
          status?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email?: string
          email_normalized?: string
          expires_at?: string
          full_name?: string | null
          graduation_year?: number | null
          id?: string
          organization_id?: string
          sent_by_membership_id?: string | null
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_accepted_by_user_id_fkey"
            columns: ["accepted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_sender_fk"
            columns: ["organization_id", "sent_by_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      member_blocks: {
        Row: {
          blocked_user_id: string
          blocker_user_id: string
          created_at: string
        }
        Insert: {
          blocked_user_id: string
          blocker_user_id: string
          created_at?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_blocks_blocker_user_id_fkey"
            columns: ["blocker_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_nonce: string | null
          conversation_id: string
          created_at: string
          id: number
          kind: string
          sender_user_id: string | null
          system_actor_user_id: string | null
          system_event_key: string | null
          system_event_type: string | null
        }
        Insert: {
          body: string
          client_nonce?: string | null
          conversation_id: string
          created_at?: string
          id?: never
          kind?: string
          sender_user_id?: string | null
          system_actor_user_id?: string | null
          system_event_key?: string | null
          system_event_type?: string | null
        }
        Update: {
          body?: string
          client_nonce?: string | null
          conversation_id?: string
          created_at?: string
          id?: never
          kind?: string
          sender_user_id?: string | null
          system_actor_user_id?: string | null
          system_event_key?: string | null
          system_event_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_system_actor_user_id_fkey"
            columns: ["system_actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          email_enabled: boolean
          in_app_enabled: boolean
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          in_app_enabled?: boolean
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_user_id: string | null
          created_at: string
          dedupe_key: string
          id: number
          organization_id: string | null
          payload: Json
          read_at: string | null
          recipient_user_id: string
          target_id: string | null
          target_type: string | null
          type: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: never
          organization_id?: string | null
          payload?: Json
          read_at?: string | null
          recipient_user_id: string
          target_id?: string | null
          target_type?: string | null
          type: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: never
          organization_id?: string | null
          payload?: Json
          read_at?: string | null
          recipient_user_id?: string
          target_id?: string | null
          target_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          approved_at: string | null
          approved_by_membership_id: string | null
          created_at: string
          id: string
          joined_at: string | null
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_membership_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by_membership_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_approver_fk"
            columns: ["organization_id", "approved_by_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_profiles: {
        Row: {
          bio: string | null
          created_at: string
          graduation_year: number | null
          organization_id: string
          organization_membership_id: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          graduation_year?: number | null
          organization_id: string
          organization_membership_id: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          graduation_year?: number | null
          organization_id?: string
          organization_membership_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_profiles_membership_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "organization_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_admin_approval?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_admin_approval?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_education: {
        Row: {
          created_at: string
          degree: string | null
          description: string | null
          end_month: number | null
          end_year: number | null
          field: string | null
          id: number
          school: string
          sort_order: number
          start_month: number | null
          start_year: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          field?: string | null
          id?: never
          school: string
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          degree?: string | null
          description?: string | null
          end_month?: number | null
          end_year?: number | null
          field?: string | null
          id?: never
          school?: string
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_education_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_experiences: {
        Row: {
          created_at: string
          description: string | null
          employer: string
          end_month: number | null
          end_year: number | null
          id: number
          sort_order: number
          start_month: number | null
          start_year: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employer: string
          end_month?: number | null
          end_year?: number | null
          id?: never
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employer?: string
          end_month?: number | null
          end_year?: number | null
          id?: never
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_field_visibility: {
        Row: {
          audience: string
          field_key: string
          organization_id: string
          organization_membership_id: string
          updated_at: string
        }
        Insert: {
          audience: string
          field_key: string
          organization_id: string
          organization_membership_id: string
          updated_at?: string
        }
        Update: {
          audience?: string
          field_key?: string
          organization_id?: string
          organization_membership_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_field_visibility_membership_fk"
            columns: ["organization_id", "organization_membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "profile_field_visibility_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          name: string
          normalized_name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          name: string
          normalized_name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          name?: string
          normalized_name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          city: string | null
          created_at: string
          current_employer: string | null
          current_title: string | null
          display_name: string
          headline: string | null
          linkedin_url: string | null
          major: string | null
          name_other: string | null
          preferred_name: string | null
          resume_path: string | null
          resume_uploaded_at: string | null
          university: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          city?: string | null
          created_at?: string
          current_employer?: string | null
          current_title?: string | null
          display_name: string
          headline?: string | null
          linkedin_url?: string | null
          major?: string | null
          name_other?: string | null
          preferred_name?: string | null
          resume_path?: string | null
          resume_uploaded_at?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          city?: string | null
          created_at?: string
          current_employer?: string | null
          current_title?: string | null
          display_name?: string
          headline?: string | null
          linkedin_url?: string | null
          major?: string | null
          name_other?: string | null
          preferred_name?: string | null
          resume_path?: string | null
          resume_uploaded_at?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_state: string
          created_at: string
          delete_initiated_by_admin: boolean
          delete_reason: string | null
          delete_scheduled_for: string | null
          deleted_at: string | null
          id: string
          last_seen_at: string | null
          onboarding_completed_at: string | null
        }
        Insert: {
          account_state?: string
          created_at?: string
          delete_initiated_by_admin?: boolean
          delete_reason?: string | null
          delete_scheduled_for?: string | null
          deleted_at?: string | null
          id: string
          last_seen_at?: string | null
          onboarding_completed_at?: string | null
        }
        Update: {
          account_state?: string
          created_at?: string
          delete_initiated_by_admin?: boolean
          delete_reason?: string | null
          delete_scheduled_for?: string | null
          deleted_at?: string | null
          id?: string
          last_seen_at?: string | null
          onboarding_completed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  api: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
