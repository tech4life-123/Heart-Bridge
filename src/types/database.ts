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
            | Database["public"]["Enums"]["children_preference"]
            | null;
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
            | Database["public"]["Enums"]["relationship_intention"]
            | null;
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
            | Database["public"]["Enums"]["children_preference"]
            | null;
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
            | Database["public"]["Enums"]["relationship_intention"]
            | null;
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
            | Database["public"]["Enums"]["children_preference"]
            | null;
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
            | Database["public"]["Enums"]["relationship_intention"]
            | null;
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
      delete_profile_photo: { Args: { p_photo_id: string }; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      set_main_photo: { Args: { p_photo_id: string }; Returns: undefined };
    };
    Enums: {
      account_status: "active" | "suspended" | "banned";
      admin_role: "moderator" | "admin";
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
      [_ in never]: never;
    };
  };
};

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
