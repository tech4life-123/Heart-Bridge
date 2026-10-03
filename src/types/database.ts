// Generated from the live Supabase schema (supabase gen types). Regenerate after every migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_appeals: {
        Row: {
          created_at: string
          decision_note: string | null
          id: string
          message: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decision_note?: string | null
          id?: string
          message: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decision_note?: string | null
          id?: string
          message?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          feature: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: never
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_answers: {
        Row: {
          question_id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          question_id: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          question_id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "compatibility_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          options: Json
          prompt: string
          slug: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          options: Json
          prompt: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          options?: Json
          prompt?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          page: string | null
          rating: number | null
          status: Database["public"]["Enums"]["feedback_status"]
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          page?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["feedback_category"]
          created_at?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          page?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["feedback_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_liked_id_fkey"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_liker_id_fkey"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          iso_code: string | null
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          iso_code?: string | null
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          iso_code?: string | null
          kind?: Database["public"]["Enums"]["location_kind"]
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          hidden_at: string | null
          last_read_at: string | null
          match_id: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          hidden_at?: string | null
          last_read_at?: string | null
          match_id: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          hidden_at?: string | null
          last_read_at?: string | null
          match_id?: string
          seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passes: {
        Row: {
          created_at: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          id: string
          payer_phone: string
          plan_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency: string
          id?: string
          payer_phone: string
          plan_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          id?: string
          payer_phone?: string
          plan_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          period_days: number
          price_usd_cents: number
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          period_days: number
          price_usd_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          period_days?: number
          price_usd_cents?: number
        }
        Relationships: []
      }
      preferences: {
        Row: {
          age_max: number
          age_min: number
          appear_diaspora: boolean
          appear_liberia: boolean
          appear_local: boolean
          created_at: string
          seeking_genders: Database["public"]["Enums"]["gender"][]
          updated_at: string
          user_id: string
        }
        Insert: {
          age_max?: number
          age_min?: number
          appear_diaspora?: boolean
          appear_liberia?: boolean
          appear_local?: boolean
          created_at?: string
          seeking_genders?: Database["public"]["Enums"]["gender"][]
          updated_at?: string
          user_id: string
        }
        Update: {
          age_max?: number
          age_min?: number
          appear_diaspora?: boolean
          appear_liberia?: boolean
          appear_local?: boolean
          created_at?: string
          seeking_genders?: Database["public"]["Enums"]["gender"][]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          position: number
          size_bytes: number | null
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          position: number
          size_bytes?: number | null
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          position?: number
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          bio: string | null
          children_preference:
            | Database["public"]["Enums"]["children_preference"]
            | null
          city_id: string | null
          city_other: string | null
          community_id: string | null
          country_id: string | null
          created_at: string
          date_of_birth: string
          drinking: Database["public"]["Enums"]["habit_frequency"] | null
          education: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          intention_primary:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          intentions_extra: Database["public"]["Enums"]["relationship_intention"][]
          languages: string[]
          occupation: string | null
          onboarding_completed_at: string | null
          onboarding_step: number
          region_id: string | null
          smoking: Database["public"]["Enums"]["habit_frequency"] | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          bio?: string | null
          children_preference?:
            | Database["public"]["Enums"]["children_preference"]
            | null
          city_id?: string | null
          city_other?: string | null
          community_id?: string | null
          country_id?: string | null
          created_at?: string
          date_of_birth: string
          drinking?: Database["public"]["Enums"]["habit_frequency"] | null
          education?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          intention_primary?:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          intentions_extra?: Database["public"]["Enums"]["relationship_intention"][]
          languages?: string[]
          occupation?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          region_id?: string | null
          smoking?: Database["public"]["Enums"]["habit_frequency"] | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          bio?: string | null
          children_preference?:
            | Database["public"]["Enums"]["children_preference"]
            | null
          city_id?: string | null
          city_other?: string | null
          community_id?: string | null
          country_id?: string | null
          created_at?: string
          date_of_birth?: string
          drinking?: Database["public"]["Enums"]["habit_frequency"] | null
          education?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          intention_primary?:
            | Database["public"]["Enums"]["relationship_intention"]
            | null
          intentions_extra?: Database["public"]["Enums"]["relationship_intention"][]
          languages?: string[]
          occupation?: string | null
          onboarding_completed_at?: string | null
          onboarding_step?: number
          region_id?: string | null
          smoking?: Database["public"]["Enums"]["habit_frequency"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          description: string | null
          id: string
          match_id: string | null
          reported_id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          reported_id: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          reported_id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_flags: {
        Row: {
          created_at: string
          details: Json
          id: string
          kind: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          kind: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_profiles: {
        Row: {
          created_at: string
          saved_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          saved_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          saved_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_profiles_saved_id_fkey"
            columns: ["saved_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          ends_at: string
          last_payment_id: string | null
          plan_id: string
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ends_at: string
          last_payment_id?: string | null
          plan_id: string
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ends_at?: string
          last_payment_id?: string | null
          plan_id?: string
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contacts: {
        Row: {
          created_at: string
          phone_e164: string | null
          phone_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone_e164?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone_e164?: string | null
          phone_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          discovery_visible: boolean
          notify_likes: boolean
          notify_new_match: boolean
          notify_new_message: boolean
          profile_visible: boolean
          show_activity_status: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discovery_visible?: boolean
          notify_likes?: boolean
          notify_new_match?: boolean
          notify_new_message?: boolean
          profile_visible?: boolean
          show_activity_status?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discovery_visible?: boolean
          notify_likes?: boolean
          notify_new_match?: boolean
          notify_new_message?: boolean
          profile_visible?: boolean
          show_activity_status?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_warnings: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          id: string
          issued_by: string | null
          message: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          message: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          issued_by?: string | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ack_warning: { Args: { p_id: string }; Returns: undefined }
      admin_analytics: {
        Args: { p_days?: number }
        Returns: {
          day: string
          likes: number
          matches: number
          messages: number
          signups: number
        }[]
      }
      admin_appeals_queue: {
        Args: { p_limit?: number; p_status?: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          decision_note: string
          first_name: string
          id: string
          message: string
          status: string
          user_id: string
        }[]
      }
      admin_audit_log: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          action: string
          actor_name: string
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          metadata: Json
        }[]
      }
      admin_feedback_queue: {
        Args: {
          p_limit?: number
          p_status?: Database["public"]["Enums"]["feedback_status"]
        }
        Returns: {
          category: Database["public"]["Enums"]["feedback_category"]
          created_at: string
          first_name: string
          id: string
          message: string
          page: string
          rating: number
          status: Database["public"]["Enums"]["feedback_status"]
          user_id: string
        }[]
      }
      admin_feedback_summary: {
        Args: never
        Returns: {
          avg_rating: number
          new_count: number
          total: number
        }[]
      }
      admin_find_user: {
        Args: { p_query: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          first_name: string
          id: string
        }[]
      }
      admin_flags_queue: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          details: Json
          first_name: string
          id: string
          kind: string
          user_id: string
        }[]
      }
      admin_list_locations: {
        Args: never
        Returns: {
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          parent_id: string
          slug: string
          sort_order: number
        }[]
      }
      admin_list_staff: {
        Args: never
        Returns: {
          created_at: string
          first_name: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }[]
      }
      admin_payments_queue: {
        Args: {
          p_limit?: number
          p_status?: Database["public"]["Enums"]["payment_status"]
        }
        Returns: {
          amount_minor: number
          created_at: string
          currency: string
          first_name: string
          id: string
          payer_phone: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }[]
      }
      admin_premium_count: { Args: never; Returns: number }
      admin_refund_payment: {
        Args: { p_id: string; p_note: string }
        Returns: undefined
      }
      admin_report_breakdown: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["report_category"]
          open: number
          total: number
        }[]
      }
      admin_report_detail: {
        Args: { p_id: string }
        Returns: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          description: string
          id: string
          match_id: string
          reported_id: string
          reported_name: string
          reporter_id: string
          reporter_name: string
          resolved_at: string
          status: Database["public"]["Enums"]["report_status"]
        }[]
      }
      admin_report_messages: {
        Args: { p_report_id: string }
        Returns: {
          body: string
          created_at: string
          sender_id: string
          sender_name: string
        }[]
      }
      admin_report_queue: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_status?: Database["public"]["Enums"]["report_status"]
        }
        Returns: {
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          id: string
          reported_id: string
          reported_name: string
          reported_status: Database["public"]["Enums"]["account_status"]
          reports_against: number
          status: Database["public"]["Enums"]["report_status"]
        }[]
      }
      admin_revenue: {
        Args: never
        Returns: {
          all_time: number
          currency: string
          last_30_days: number
          payments: number
        }[]
      }
      admin_review_appeal: {
        Args: { p_decision: string; p_id: string; p_note: string }
        Returns: undefined
      }
      admin_review_flag: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_review_payment: {
        Args: {
          p_decision: Database["public"]["Enums"]["payment_status"]
          p_id: string
          p_note?: string
        }
        Returns: undefined
      }
      admin_save_location: {
        Args: {
          p_active: boolean
          p_id: string
          p_kind: Database["public"]["Enums"]["location_kind"]
          p_name: string
          p_parent: string
          p_slug: string
          p_sort: number
        }
        Returns: string
      }
      admin_set_account_status: {
        Args: {
          p_reason: string
          p_status: Database["public"]["Enums"]["account_status"]
          p_user: string
        }
        Returns: undefined
      }
      admin_set_feedback_status: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["feedback_status"]
        }
        Returns: undefined
      }
      admin_set_report_status: {
        Args: {
          p_id: string
          p_note?: string
          p_status: Database["public"]["Enums"]["report_status"]
        }
        Returns: undefined
      }
      admin_set_staff_role: {
        Args: {
          p_role?: Database["public"]["Enums"]["admin_role"]
          p_user: string
        }
        Returns: undefined
      }
      admin_stats: {
        Args: never
        Returns: {
          matches_total: number
          messages_24h: number
          new_users_7d: number
          open_flags: number
          open_reports: number
          users_active: number
          users_banned: number
          users_suspended: number
          users_total: number
        }[]
      }
      admin_user_overview: {
        Args: { p_user: string }
        Returns: {
          account_status: Database["public"]["Enums"]["account_status"]
          age: number
          bio: string
          created_at: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          is_staff: boolean
          matches: number
          occupation: string
          photo_paths: string[]
          reports_open: number
          reports_total: number
          warnings: number
        }[]
      }
      admin_warn_user: {
        Args: { p_message: string; p_user: string }
        Returns: undefined
      }
      age_years: { Args: { d: string }; Returns: number }
      // Not applied live until the owner runs 20261002120000_delete_account.sql
      delete_my_account: { Args: never; Returns: undefined };
      ai_consume: { Args: { p_feature: string }; Returns: boolean }
      are_matched: { Args: { p_other: string }; Returns: boolean }
      can_use_typing_topic: { Args: { p_topic: string }; Returns: boolean }
      can_view_profile: { Args: { p_target: string }; Returns: boolean }
      cancel_my_payment: { Args: { p_id: string }; Returns: undefined }
      chat_meta: {
        Args: { p_match_id: string }
        Returns: {
          age: number
          can_message: boolean
          first_name: string
          other_id: string
          other_last_read_at: string
          photo_path: string
        }[]
      }
      complete_onboarding: { Args: never; Returns: undefined }
      delete_profile_photo: { Args: { p_photo_id: string }; Returns: string }
      discover_profiles: {
        Args: {
          p_age_max?: number
          p_age_min?: number
          p_children?: Database["public"]["Enums"]["children_preference"][]
          p_city_id?: string
          p_community_id?: string
          p_country_id?: string
          p_drinking?: Database["public"]["Enums"]["habit_frequency"][]
          p_genders?: Database["public"]["Enums"]["gender"][]
          p_intentions?: Database["public"]["Enums"]["relationship_intention"][]
          p_interest_ids?: string[]
          p_limit?: number
          p_region_id?: string
          p_smoking?: Database["public"]["Enums"]["habit_frequency"][]
        }
        Returns: Database["public"]["CompositeTypes"]["profile_card"][]
        SetofOptions: {
          from: "*"
          to: "profile_card"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      hide_conversation: { Args: { p_match_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      likes_received: {
        Args: { p_limit?: number }
        Returns: Database["public"]["CompositeTypes"]["profile_card"][]
        SetofOptions: {
          from: "*"
          to: "profile_card"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      likes_received_count: { Args: never; Returns: number }
      likes_received_ids: { Args: { p_limit: number }; Returns: string[] }
      mark_conversation_read: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      mark_match_seen: { Args: { p_match_id: string }; Returns: undefined }
      match_id_with: { Args: { p_other: string }; Returns: string }
      my_appeal: {
        Args: never
        Returns: {
          created_at: string
          decision_note: string
          reviewed_at: string
          status: string
        }[]
      }
      my_blocked: {
        Args: never
        Returns: {
          blocked_at: string
          blocked_id: string
          first_name: string
        }[]
      }
      my_entitlements: {
        Args: never
        Returns: {
          is_premium: boolean
          premium_until: string
        }[]
      }
      my_matches: {
        Args: never
        Returns: {
          age: number
          first_name: string
          is_new: boolean
          last_at: string
          last_body: string
          last_sender: string
          match_id: string
          matched_at: string
          other_id: string
          photo_path: string
          unread: number
        }[]
      }
      payment_options: {
        Args: never
        Returns: {
          account_name: string
          provider: Database["public"]["Enums"]["payment_provider"]
          wallet_number: string
        }[]
      }
      profile_cards: {
        Args: { p_ids: string[] }
        Returns: Database["public"]["CompositeTypes"]["profile_card"][]
        SetofOptions: {
          from: "*"
          to: "profile_card"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      record_message_flag: {
        Args: { p_message_id: string; p_reason: string }
        Returns: undefined
      }
      report_user: {
        Args: {
          p_category: Database["public"]["Enums"]["report_category"]
          p_description?: string
          p_match_id?: string
          p_reported: string
        }
        Returns: undefined
      }
      require_staff: {
        Args: { p_roles: Database["public"]["Enums"]["admin_role"][] }
        Returns: undefined
      }
      send_message: {
        Args: { p_body: string; p_match_id: string }
        Returns: string
      }
      set_main_photo: { Args: { p_photo_id: string }; Returns: undefined }
      staff_has: {
        Args: { p_roles: Database["public"]["Enums"]["admin_role"][] }
        Returns: boolean
      }
      staff_role: {
        Args: never
        Returns: Database["public"]["Enums"]["admin_role"]
      }
      submit_appeal: { Args: { p_message: string }; Returns: string }
      submit_feedback: {
        Args: {
          p_category: Database["public"]["Enums"]["feedback_category"]
          p_message: string
          p_page: string
          p_rating: number
        }
        Returns: string
      }
      submit_payment: {
        Args: {
          p_amount_minor: number
          p_currency: string
          p_phone: string
          p_provider: Database["public"]["Enums"]["payment_provider"]
          p_reference: string
        }
        Returns: string
      }
      unread_summary: {
        Args: never
        Returns: {
          new_matches: number
          unread_messages: number
        }[]
      }
      user_is_premium: { Args: { p_user: string }; Returns: boolean }
      write_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "banned"
      admin_role: "moderator" | "admin" | "support" | "finance"
      children_preference:
        | "have_children"
        | "want_children"
        | "open_to_children"
        | "no_children"
        | "prefer_not_to_say"
      feedback_category: "bug" | "idea" | "praise" | "safety_concern" | "other"
      feedback_status: "new" | "reviewed" | "done"
      gender: "man" | "woman" | "non_binary"
      habit_frequency: "never" | "sometimes" | "often" | "prefer_not_to_say"
      location_kind: "country" | "region" | "city" | "community"
      payment_provider: "orange_money" | "lonestar_momo" | "card"
      payment_status:
        | "pending"
        | "successful"
        | "failed"
        | "cancelled"
        | "refunded"
      relationship_intention:
        | "serious_relationship"
        | "marriage"
        | "dating"
        | "friendship"
        | "getting_to_know"
      report_category:
        | "fake_profile"
        | "scam"
        | "harassment"
        | "sexual_misconduct"
        | "threatening_behavior"
        | "spam"
        | "underage_user"
        | "inappropriate_content"
        | "other"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
    }
    CompositeTypes: {
      profile_card: {
        id: string | null
        first_name: string | null
        age: number | null
        gender: Database["public"]["Enums"]["gender"] | null
        bio: string | null
        occupation: string | null
        education: string | null
        languages: string[] | null
        smoking: Database["public"]["Enums"]["habit_frequency"] | null
        drinking: Database["public"]["Enums"]["habit_frequency"] | null
        children_preference:
          | Database["public"]["Enums"]["children_preference"]
          | null
        intention_primary:
          | Database["public"]["Enums"]["relationship_intention"]
          | null
        intentions_extra:
          | Database["public"]["Enums"]["relationship_intention"][]
          | null
        place: string | null
        proximity: number | null
        interest_ids: string[] | null
        photo_paths: string[] | null
        qa_similarity: number | null
        qa_count: number | null
        is_liked: boolean | null
        is_saved: boolean | null
        is_passed: boolean | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended", "banned"],
      admin_role: ["moderator", "admin", "support", "finance"],
      children_preference: [
        "have_children",
        "want_children",
        "open_to_children",
        "no_children",
        "prefer_not_to_say",
      ],
      feedback_category: ["bug", "idea", "praise", "safety_concern", "other"],
      feedback_status: ["new", "reviewed", "done"],
      gender: ["man", "woman", "non_binary"],
      habit_frequency: ["never", "sometimes", "often", "prefer_not_to_say"],
      location_kind: ["country", "region", "city", "community"],
      payment_provider: ["orange_money", "lonestar_momo", "card"],
      payment_status: [
        "pending",
        "successful",
        "failed",
        "cancelled",
        "refunded",
      ],
      relationship_intention: [
        "serious_relationship",
        "marriage",
        "dating",
        "friendship",
        "getting_to_know",
      ],
      report_category: [
        "fake_profile",
        "scam",
        "harassment",
        "sexual_misconduct",
        "threatening_behavior",
        "spam",
        "underage_user",
        "inappropriate_content",
        "other",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
    },
  },
} as const

export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type ProfileCardRow =
  Database["public"]["CompositeTypes"]["profile_card"];
