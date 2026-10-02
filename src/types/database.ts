// Generated from the live Supabase schema (supabase gen types). Regenerate after every migration.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["admin_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          description: string | null;
          is_public: boolean;
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          description?: string | null;
          is_public?: boolean;
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          description?: string | null;
          is_public?: boolean;
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: number;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: never;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: never;
          metadata?: Json;
        };
        Relationships: [];
      };
      interests: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          is_active: boolean;
          label: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          iso_code: string | null;
          kind: Database["public"]["Enums"]["location_kind"];
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          iso_code?: string | null;
          kind: Database["public"]["Enums"]["location_kind"];
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          iso_code?: string | null;
          kind?: Database["public"]["Enums"]["location_kind"];
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      preferences: {
        Row: {
          age_max: number;
          age_min: number;
          appear_diaspora: boolean;
          appear_liberia: boolean;
          appear_local: boolean;
          created_at: string;
          seeking_genders: Database["public"]["Enums"]["gender"][];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          age_max?: number;
          age_min?: number;
          appear_diaspora?: boolean;
          appear_liberia?: boolean;
          appear_local?: boolean;
          created_at?: string;
          seeking_genders?: Database["public"]["Enums"]["gender"][];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          age_max?: number;
          age_min?: number;
          appear_diaspora?: boolean;
          appear_liberia?: boolean;
          appear_local?: boolean;
          created_at?: string;
          seeking_genders?: Database["public"]["Enums"]["gender"][];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profile_photos: {
        Row: {
          created_at: string;
          height: number | null;
          id: string;
          position: number;
          size_bytes: number | null;
          storage_path: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          created_at?: string;
          height?: number | null;
          id?: string;
          position: number;
          size_bytes?: number | null;
          storage_path: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          created_at?: string;
          height?: number | null;
          id?: string;
          position?: number;
          size_bytes?: number | null;
          storage_path?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"];
          bio: string | null;
          children_preference:
            Database["public"]["Enums"]["children_preference"] | null;
          city_id: string | null;
          city_other: string | null;
          community_id: string | null;
          country_id: string | null;
          created_at: string;
          date_of_birth: string;
          drinking: Database["public"]["Enums"]["habit_frequency"] | null;
          education: string | null;
          first_name: string;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          intention_primary:
            Database["public"]["Enums"]["relationship_intention"] | null;
          intentions_extra: Database["public"]["Enums"]["relationship_intention"][];
          languages: string[];
          occupation: string | null;
          onboarding_completed_at: string | null;
          onboarding_step: number;
          region_id: string | null;
          smoking: Database["public"]["Enums"]["habit_frequency"] | null;
          updated_at: string;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"];
          bio?: string | null;
          children_preference?:
            Database["public"]["Enums"]["children_preference"] | null;
          city_id?: string | null;
          city_other?: string | null;
          community_id?: string | null;
          country_id?: string | null;
          created_at?: string;
          date_of_birth: string;
          drinking?: Database["public"]["Enums"]["habit_frequency"] | null;
          education?: string | null;
          first_name: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          intention_primary?:
            Database["public"]["Enums"]["relationship_intention"] | null;
          intentions_extra?: Database["public"]["Enums"]["relationship_intention"][];
          languages?: string[];
          occupation?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_step?: number;
          region_id?: string | null;
          smoking?: Database["public"]["Enums"]["habit_frequency"] | null;
          updated_at?: string;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"];
          bio?: string | null;
          children_preference?:
            Database["public"]["Enums"]["children_preference"] | null;
          city_id?: string | null;
          city_other?: string | null;
          community_id?: string | null;
          country_id?: string | null;
          created_at?: string;
          date_of_birth?: string;
          drinking?: Database["public"]["Enums"]["habit_frequency"] | null;
          education?: string | null;
          first_name?: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          intention_primary?:
            Database["public"]["Enums"]["relationship_intention"] | null;
          intentions_extra?: Database["public"]["Enums"]["relationship_intention"][];
          languages?: string[];
          occupation?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_step?: number;
          region_id?: string | null;
          smoking?: Database["public"]["Enums"]["habit_frequency"] | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_contacts: {
        Row: {
          created_at: string;
          phone_e164: string | null;
          phone_verified: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          phone_e164?: string | null;
          phone_verified?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          phone_e164?: string | null;
          phone_verified?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_contacts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_interests: {
        Row: {
          created_at: string;
          interest_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          interest_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interest_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "interests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          liked_id: string;
          liker_id: string;
        };
        Insert: {
          created_at?: string;
          liked_id: string;
          liker_id: string;
        };
        Update: {
          created_at?: string;
          liked_id?: string;
          liker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_liked_id_fkey";
            columns: ["liked_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_liker_id_fkey";
            columns: ["liker_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: { created_at: string; id: string; user_a: string; user_b: string };
        Insert: {
          created_at?: string;
          id?: string;
          user_a: string;
          user_b: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [];
      };
      match_participants: {
        Row: {
          hidden_at: string | null;
          last_read_at: string | null;
          match_id: string;
          seen_at: string | null;
          user_id: string;
        };
        Insert: {
          hidden_at?: string | null;
          last_read_at?: string | null;
          match_id: string;
          seen_at?: string | null;
          user_id: string;
        };
        Update: {
          hidden_at?: string | null;
          last_read_at?: string | null;
          match_id?: string;
          seen_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          match_id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          match_id: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          match_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      user_warnings: {
        Row: {
          acknowledged_at: string | null;
          created_at: string;
          id: string;
          issued_by: string | null;
          message: string;
          user_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          created_at?: string;
          id?: string;
          issued_by?: string | null;
          message: string;
          user_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          created_at?: string;
          id?: string;
          issued_by?: string | null;
          message?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      passes: {
        Row: {
          created_at: string;
          target_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          target_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          target_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passes_target_id_fkey";
            columns: ["target_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_profiles: {
        Row: {
          created_at: string;
          saved_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          saved_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          saved_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_profiles_saved_id_fkey";
            columns: ["saved_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compatibility_answers: {
        Row: {
          question_id: string;
          updated_at: string;
          user_id: string;
          value: number;
        };
        Insert: {
          question_id: string;
          updated_at?: string;
          user_id: string;
          value: number;
        };
        Update: {
          question_id?: string;
          updated_at?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "compatibility_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "compatibility_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compatibility_answers_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      compatibility_questions: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          is_active: boolean;
          kind: string;
          options: Json;
          prompt: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind: string;
          options: Json;
          prompt: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: string;
          options?: Json;
          prompt?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          created_at: string;
          discovery_visible: boolean;
          notify_likes: boolean;
          notify_new_match: boolean;
          notify_new_message: boolean;
          profile_visible: boolean;
          show_activity_status: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discovery_visible?: boolean;
          notify_likes?: boolean;
          notify_new_match?: boolean;
          notify_new_message?: boolean;
          profile_visible?: boolean;
          show_activity_status?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discovery_visible?: boolean;
          notify_likes?: boolean;
          notify_new_match?: boolean;
          notify_new_message?: boolean;
          profile_visible?: boolean;
          show_activity_status?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_onboarding: { Args: never; Returns: undefined };
      report_user: {
        Args: {
          p_reported: string;
          p_category: Database["public"]["Enums"]["report_category"];
          p_description?: string;
          p_match_id?: string;
        };
        Returns: undefined;
      };
      record_message_flag: {
        Args: { p_message_id: string; p_reason: string };
        Returns: undefined;
      };
      my_blocked: {
        Args: never;
        Returns: {
          blocked_id: string;
          first_name: string;
          blocked_at: string;
        }[];
      };
      staff_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["admin_role"];
      };
      staff_has: {
        Args: { p_roles: Database["public"]["Enums"]["admin_role"][] };
        Returns: boolean;
      };
      ack_warning: { Args: { p_id: string }; Returns: undefined };
      admin_stats: {
        Args: never;
        Returns: {
          users_total: number;
          users_active: number;
          users_suspended: number;
          users_banned: number;
          new_users_7d: number;
          matches_total: number;
          messages_24h: number;
          open_reports: number;
          open_flags: number;
        }[];
      };
      admin_report_queue: {
        Args: {
          p_status?: Database["public"]["Enums"]["report_status"];
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          category: Database["public"]["Enums"]["report_category"];
          status: Database["public"]["Enums"]["report_status"];
          created_at: string;
          reported_id: string;
          reported_name: string;
          reported_status: Database["public"]["Enums"]["account_status"];
          reports_against: number;
        }[];
      };
      admin_report_detail: {
        Args: { p_id: string };
        Returns: {
          id: string;
          category: Database["public"]["Enums"]["report_category"];
          description: string | null;
          status: Database["public"]["Enums"]["report_status"];
          created_at: string;
          resolved_at: string | null;
          match_id: string | null;
          reporter_id: string;
          reporter_name: string;
          reported_id: string;
          reported_name: string;
        }[];
      };
      admin_set_report_status: {
        Args: {
          p_id: string;
          p_status: Database["public"]["Enums"]["report_status"];
          p_note?: string;
        };
        Returns: undefined;
      };
      admin_report_messages: {
        Args: { p_report_id: string };
        Returns: {
          sender_id: string;
          sender_name: string;
          body: string;
          created_at: string;
        }[];
      };
      admin_find_user: {
        Args: { p_query: string };
        Returns: {
          id: string;
          first_name: string;
          account_status: Database["public"]["Enums"]["account_status"];
          created_at: string;
        }[];
      };
      admin_user_overview: {
        Args: { p_user: string };
        Returns: {
          id: string;
          first_name: string;
          age: number;
          gender: Database["public"]["Enums"]["gender"] | null;
          account_status: Database["public"]["Enums"]["account_status"];
          created_at: string;
          bio: string | null;
          occupation: string | null;
          photo_paths: string[];
          reports_open: number;
          reports_total: number;
          warnings: number;
          matches: number;
          is_staff: boolean;
        }[];
      };
      admin_set_account_status: {
        Args: {
          p_user: string;
          p_status: Database["public"]["Enums"]["account_status"];
          p_reason: string;
        };
        Returns: undefined;
      };
      admin_warn_user: {
        Args: { p_user: string; p_message: string };
        Returns: undefined;
      };
      admin_flags_queue: {
        Args: { p_limit?: number };
        Returns: {
          id: string;
          user_id: string;
          first_name: string;
          kind: string;
          details: Json;
          created_at: string;
        }[];
      };
      admin_review_flag: {
        Args: { p_id: string; p_status: string };
        Returns: undefined;
      };
      admin_audit_log: {
        Args: { p_limit?: number; p_offset?: number };
        Returns: {
          id: number;
          actor_name: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        }[];
      };
      admin_list_staff: {
        Args: never;
        Returns: {
          user_id: string;
          first_name: string | null;
          role: Database["public"]["Enums"]["admin_role"];
          created_at: string;
        }[];
      };
      admin_set_staff_role: {
        Args: {
          p_user: string;
          p_role?: Database["public"]["Enums"]["admin_role"];
        };
        Returns: undefined;
      };
      are_matched: { Args: { p_other: string }; Returns: boolean };
      match_id_with: { Args: { p_other: string }; Returns: string };
      my_matches: {
        Args: never;
        Returns: {
          match_id: string;
          matched_at: string;
          other_id: string;
          first_name: string;
          age: number;
          photo_path: string | null;
          last_body: string | null;
          last_at: string | null;
          last_sender: string | null;
          unread: number;
          is_new: boolean;
        }[];
      };
      chat_meta: {
        Args: { p_match_id: string };
        Returns: {
          other_id: string;
          first_name: string;
          age: number;
          photo_path: string | null;
          other_last_read_at: string | null;
          can_message: boolean;
        }[];
      };
      unread_summary: {
        Args: never;
        Returns: { unread_messages: number; new_matches: number }[];
      };
      send_message: {
        Args: { p_match_id: string; p_body: string };
        Returns: string;
      };
      mark_conversation_read: {
        Args: { p_match_id: string };
        Returns: undefined;
      };
      mark_match_seen: { Args: { p_match_id: string }; Returns: undefined };
      hide_conversation: { Args: { p_match_id: string }; Returns: undefined };
      age_years: { Args: { d: string }; Returns: number };
      can_view_profile: { Args: { p_target: string }; Returns: boolean };
      discover_profiles: {
        Args: {
          p_age_max?: number;
          p_age_min?: number;
          p_children?: Database["public"]["Enums"]["children_preference"][];
          p_city_id?: string;
          p_community_id?: string;
          p_country_id?: string;
          p_drinking?: Database["public"]["Enums"]["habit_frequency"][];
          p_genders?: Database["public"]["Enums"]["gender"][];
          p_intentions?: Database["public"]["Enums"]["relationship_intention"][];
          p_interest_ids?: string[];
          p_limit?: number;
          p_region_id?: string;
          p_smoking?: Database["public"]["Enums"]["habit_frequency"][];
        };
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
        SetofOptions: {
          from: "*";
          to: "profile_card";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      profile_cards: {
        Args: { p_ids: string[] };
        Returns: Database["public"]["CompositeTypes"]["profile_card"][];
        SetofOptions: {
          from: "*";
          to: "profile_card";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      delete_profile_photo: { Args: { p_photo_id: string }; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      set_main_photo: { Args: { p_photo_id: string }; Returns: undefined };
    };
    Enums: {
      account_status: "active" | "suspended" | "banned";
      report_category:
        | "fake_profile"
        | "scam"
        | "harassment"
        | "sexual_misconduct"
        | "threatening_behavior"
        | "spam"
        | "underage_user"
        | "inappropriate_content"
        | "other";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      admin_role: "moderator" | "admin" | "support" | "finance";
      children_preference:
        | "have_children"
        | "want_children"
        | "open_to_children"
        | "no_children"
        | "prefer_not_to_say";
      gender: "man" | "woman" | "non_binary";
      habit_frequency: "never" | "sometimes" | "often" | "prefer_not_to_say";
      location_kind: "country" | "region" | "city" | "community";
      relationship_intention:
        | "serious_relationship"
        | "marriage"
        | "dating"
        | "friendship"
        | "getting_to_know";
    };
    CompositeTypes: {
      profile_card: {
        id: string | null;
        first_name: string | null;
        age: number | null;
        gender: Database["public"]["Enums"]["gender"] | null;
        bio: string | null;
        occupation: string | null;
        education: string | null;
        languages: string[] | null;
        smoking: Database["public"]["Enums"]["habit_frequency"] | null;
        drinking: Database["public"]["Enums"]["habit_frequency"] | null;
        children_preference:
          Database["public"]["Enums"]["children_preference"] | null;
        intention_primary:
          Database["public"]["Enums"]["relationship_intention"] | null;
        intentions_extra:
          Database["public"]["Enums"]["relationship_intention"][] | null;
        place: string | null;
        proximity: number | null;
        interest_ids: string[] | null;
        photo_paths: string[] | null;
        qa_similarity: number | null;
        qa_count: number | null;
        is_liked: boolean | null;
        is_saved: boolean | null;
        is_passed: boolean | null;
      };
    };
  };
};

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type ProfileCardRow =
  Database["public"]["CompositeTypes"]["profile_card"];
