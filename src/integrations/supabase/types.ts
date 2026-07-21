export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      athlete_registrations: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          athlete_id: string;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          eligibility_status: string;
          id: string;
          jersey_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          position: string | null;
          registered_at: string;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          athlete_id: string;
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          eligibility_status?: string;
          id?: string;
          jersey_number?: number | null;
          metadata?: Json;
          notes?: string | null;
          organization_id: string;
          position?: string | null;
          registered_at?: string;
          status?: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          athlete_id?: string;
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          eligibility_status?: string;
          id?: string;
          jersey_number?: number | null;
          metadata?: Json;
          notes?: string | null;
          organization_id?: string;
          position?: string | null;
          registered_at?: string;
          status?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_registrations_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "athlete_registrations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "athlete_registrations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      athletes: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          birth_date: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          document_number: string | null;
          document_number_normalized: string | null;
          document_type: string | null;
          dominant_foot: string | null;
          email: string | null;
          full_name: string;
          id: string;
          internal_notes: string | null;
          is_captain: boolean;
          is_goalkeeper: boolean;
          jersey_number: number | null;
          nationality: string | null;
          organization_id: string;
          phone: string | null;
          photo_url: string | null;
          position: string | null;
          sport_name: string | null;
          state: string | null;
          status: string;
          team_id: string | null;
          updated_at: string;
          updated_by: string | null;
          whatsapp: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          birth_date?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          dominant_foot?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          internal_notes?: string | null;
          is_captain?: boolean;
          is_goalkeeper?: boolean;
          jersey_number?: number | null;
          nationality?: string | null;
          organization_id: string;
          phone?: string | null;
          photo_url?: string | null;
          position?: string | null;
          sport_name?: string | null;
          state?: string | null;
          status?: string;
          team_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          birth_date?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          dominant_foot?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          internal_notes?: string | null;
          is_captain?: boolean;
          is_goalkeeper?: boolean;
          jersey_number?: number | null;
          nationality?: string | null;
          organization_id?: string;
          phone?: string | null;
          photo_url?: string | null;
          position?: string | null;
          sport_name?: string | null;
          state?: string | null;
          status?: string;
          team_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "athletes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athletes_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "athletes_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athletes_team_same_org_fkey";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          context: Json;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          organization_id: string;
          user_id: string | null;
        };
        Insert: {
          action: string;
          context?: Json;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id: string;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          context?: Json;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      championship_categories: {
        Row: {
          championship_id: string;
          code: string | null;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          gender: string;
          id: string;
          maximum_age: number | null;
          minimum_age: number | null;
          name: string;
          organization_id: string;
          settings: Json;
          starts_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          championship_id: string;
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          gender?: string;
          id?: string;
          maximum_age?: number | null;
          minimum_age?: number | null;
          name: string;
          organization_id: string;
          settings?: Json;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          championship_id?: string;
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          gender?: string;
          id?: string;
          maximum_age?: number | null;
          minimum_age?: number | null;
          name?: string;
          organization_id?: string;
          settings?: Json;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championship_categories_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_categories_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      championship_settings: {
        Row: {
          allow_athlete_multiple_teams: boolean;
          allow_draw: boolean;
          allow_duplicate_shirt_numbers: boolean;
          allow_roster_changes_after_start: boolean;
          championship_id: string;
          competition_format: string;
          created_at: string;
          created_by: string | null;
          custom_rules: Json;
          group_count: number | null;
          id: string;
          legs: number;
          locked_at: string | null;
          max_athletes_per_team: number | null;
          max_goalkeepers_per_team: number | null;
          max_staff_per_team: number | null;
          maximum_athlete_age: number | null;
          min_athletes_per_team: number | null;
          minimum_athlete_age: number | null;
          minimum_rest_hours: number;
          organization_id: string;
          points_draw: number;
          points_loss: number;
          points_win: number;
          public_theme: Json;
          published_at: string | null;
          published_by: string | null;
          qualifiers_per_group: number | null;
          registration_ends_at: string | null;
          registration_starts_at: string | null;
          require_athlete_document: boolean;
          require_athlete_photo: boolean;
          require_shirt_number: boolean;
          rules_version: number;
          third_place_match: boolean;
          tiebreakers: string[];
          updated_at: string;
          updated_by: string | null;
          uses_extra_time: boolean;
          uses_penalties: boolean;
          wo_score_against: number;
          wo_score_for: number;
          yellow_cards_for_suspension: number;
        };
        Insert: {
          allow_athlete_multiple_teams?: boolean;
          allow_draw?: boolean;
          allow_duplicate_shirt_numbers?: boolean;
          allow_roster_changes_after_start?: boolean;
          championship_id: string;
          competition_format?: string;
          created_at?: string;
          created_by?: string | null;
          custom_rules?: Json;
          group_count?: number | null;
          id?: string;
          legs?: number;
          locked_at?: string | null;
          max_athletes_per_team?: number | null;
          max_goalkeepers_per_team?: number | null;
          max_staff_per_team?: number | null;
          maximum_athlete_age?: number | null;
          min_athletes_per_team?: number | null;
          minimum_athlete_age?: number | null;
          minimum_rest_hours?: number;
          organization_id: string;
          points_draw?: number;
          points_loss?: number;
          points_win?: number;
          public_theme?: Json;
          published_at?: string | null;
          published_by?: string | null;
          qualifiers_per_group?: number | null;
          registration_ends_at?: string | null;
          registration_starts_at?: string | null;
          require_athlete_document?: boolean;
          require_athlete_photo?: boolean;
          require_shirt_number?: boolean;
          rules_version?: number;
          third_place_match?: boolean;
          tiebreakers?: string[];
          updated_at?: string;
          updated_by?: string | null;
          uses_extra_time?: boolean;
          uses_penalties?: boolean;
          wo_score_against?: number;
          wo_score_for?: number;
          yellow_cards_for_suspension?: number;
        };
        Update: {
          allow_athlete_multiple_teams?: boolean;
          allow_draw?: boolean;
          allow_duplicate_shirt_numbers?: boolean;
          allow_roster_changes_after_start?: boolean;
          championship_id?: string;
          competition_format?: string;
          created_at?: string;
          created_by?: string | null;
          custom_rules?: Json;
          group_count?: number | null;
          id?: string;
          legs?: number;
          locked_at?: string | null;
          max_athletes_per_team?: number | null;
          max_goalkeepers_per_team?: number | null;
          max_staff_per_team?: number | null;
          maximum_athlete_age?: number | null;
          min_athletes_per_team?: number | null;
          minimum_athlete_age?: number | null;
          minimum_rest_hours?: number;
          organization_id?: string;
          points_draw?: number;
          points_loss?: number;
          points_win?: number;
          public_theme?: Json;
          published_at?: string | null;
          published_by?: string | null;
          qualifiers_per_group?: number | null;
          registration_ends_at?: string | null;
          registration_starts_at?: string | null;
          require_athlete_document?: boolean;
          require_athlete_photo?: boolean;
          require_shirt_number?: boolean;
          rules_version?: number;
          third_place_match?: boolean;
          tiebreakers?: string[];
          updated_at?: string;
          updated_by?: string | null;
          uses_extra_time?: boolean;
          uses_penalties?: boolean;
          wo_score_against?: number;
          wo_score_for?: number;
          yellow_cards_for_suspension?: number;
        };
        Relationships: [
          {
            foreignKeyName: "championship_settings_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: true;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_settings_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      championship_team_athletes: {
        Row: {
          active: boolean;
          approved_at: string | null;
          approved_by: string | null;
          athlete_id: string;
          championship_id: string;
          championship_team_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_captain: boolean;
          is_goalkeeper: boolean;
          joined_at: string;
          left_at: string | null;
          organization_id: string;
          position: string | null;
          registration_date: string;
          registration_status: string;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          shirt_number: number | null;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          athlete_id: string;
          championship_id: string;
          championship_team_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_captain?: boolean;
          is_goalkeeper?: boolean;
          joined_at?: string;
          left_at?: string | null;
          organization_id: string;
          position?: string | null;
          registration_date?: string;
          registration_status?: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          shirt_number?: number | null;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          athlete_id?: string;
          championship_id?: string;
          championship_team_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_captain?: boolean;
          is_goalkeeper?: boolean;
          joined_at?: string;
          left_at?: string | null;
          organization_id?: string;
          position?: string | null;
          registration_date?: string;
          registration_status?: string;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          shirt_number?: number | null;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championship_team_athletes_athlete_fk";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_team_athletes_championship_fk";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_team_athletes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_team_athletes_participation_fk";
            columns: ["championship_team_id", "championship_id", "team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championship_teams";
            referencedColumns: ["id", "championship_id", "team_id", "organization_id"];
          },
          {
            foreignKeyName: "championship_team_athletes_team_fk";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      championship_team_staff: {
        Row: {
          active: boolean;
          championship_id: string;
          championship_team_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          organization_id: string;
          registration_status: string;
          role: string;
          staff_id: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          active?: boolean;
          championship_id: string;
          championship_team_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          registration_status?: string;
          role: string;
          staff_id: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          active?: boolean;
          championship_id?: string;
          championship_team_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          registration_status?: string;
          role?: string;
          staff_id?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championship_team_staff_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_team_staff_participation_fk";
            columns: ["championship_team_id", "championship_id", "team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championship_teams";
            referencedColumns: ["id", "championship_id", "team_id", "organization_id"];
          },
          {
            foreignKeyName: "championship_team_staff_staff_fk";
            columns: ["staff_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "team_staff";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      championship_teams: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          archived_at: string | null;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          fee_amount: number;
          group_id: string | null;
          id: string;
          joined_at: string;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          payment_status: string;
          registration_number: string | null;
          seed: number | null;
          status: string;
          submitted_at: string | null;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          fee_amount?: number;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          metadata?: Json;
          notes?: string | null;
          organization_id: string;
          payment_status?: string;
          registration_number?: string | null;
          seed?: number | null;
          status?: string;
          submitted_at?: string | null;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          fee_amount?: number;
          group_id?: string | null;
          id?: string;
          joined_at?: string;
          metadata?: Json;
          notes?: string | null;
          organization_id?: string;
          payment_status?: string;
          registration_number?: string | null;
          seed?: number | null;
          status?: string;
          submitted_at?: string | null;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championship_teams_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_category_same_org_fkey";
            columns: ["category_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_teams_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_teams_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "championship_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_team_same_org_fkey";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      championships: {
        Row: {
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          instagram_url: string | null;
          is_public: boolean;
          logo_url: string | null;
          metadata: Json;
          modality: string | null;
          name: string;
          organization_id: string;
          published_at: string | null;
          registration_closes_at: string | null;
          registration_opens_at: string | null;
          regulations_url: string | null;
          season: string | null;
          slug: string;
          sport: string;
          starts_at: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["championship_status"];
          updated_at: string;
          updated_by: string | null;
          website_url: string | null;
        };
        Insert: {
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_public?: boolean;
          logo_url?: string | null;
          metadata?: Json;
          modality?: string | null;
          name: string;
          organization_id: string;
          published_at?: string | null;
          registration_closes_at?: string | null;
          registration_opens_at?: string | null;
          regulations_url?: string | null;
          season?: string | null;
          slug: string;
          sport?: string;
          starts_at?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["championship_status"];
          updated_at?: string;
          updated_by?: string | null;
          website_url?: string | null;
        };
        Update: {
          city?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_public?: boolean;
          logo_url?: string | null;
          metadata?: Json;
          modality?: string | null;
          name?: string;
          organization_id?: string;
          published_at?: string | null;
          registration_closes_at?: string | null;
          registration_opens_at?: string | null;
          regulations_url?: string | null;
          season?: string | null;
          slug?: string;
          sport?: string;
          starts_at?: string | null;
          state?: string | null;
          status?: Database["public"]["Enums"]["championship_status"];
          updated_at?: string;
          updated_by?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championships_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_advancements: {
        Row: {
          championship_id: string;
          client_request_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          organization_id: string;
          qualified_teams: Json;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          result_hash: string;
          source_stage_id: string;
          status: string;
          target_stage_id: string;
        };
        Insert: {
          championship_id: string;
          client_request_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id: string;
          qualified_teams: Json;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          result_hash: string;
          source_stage_id: string;
          status?: string;
          target_stage_id: string;
        };
        Update: {
          championship_id?: string;
          client_request_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          organization_id?: string;
          qualified_teams?: Json;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          result_hash?: string;
          source_stage_id?: string;
          status?: string;
          target_stage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competition_advancements_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_advancements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_advancements_source_stage_id_fkey";
            columns: ["source_stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_advancements_target_stage_id_fkey";
            columns: ["target_stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_generations: {
        Row: {
          championship_id: string;
          client_request_id: string;
          created_at: string;
          created_by: string | null;
          generation_type: string;
          group_id: string | null;
          id: string;
          input_data: Json;
          organization_id: string;
          result_data: Json;
          result_hash: string;
          stage_id: string | null;
          status: string;
          version: number;
        };
        Insert: {
          championship_id: string;
          client_request_id: string;
          created_at?: string;
          created_by?: string | null;
          generation_type: string;
          group_id?: string | null;
          id?: string;
          input_data: Json;
          organization_id: string;
          result_data: Json;
          result_hash: string;
          stage_id?: string | null;
          status?: string;
          version: number;
        };
        Update: {
          championship_id?: string;
          client_request_id?: string;
          created_at?: string;
          created_by?: string | null;
          generation_type?: string;
          group_id?: string | null;
          id?: string;
          input_data?: Json;
          organization_id?: string;
          result_data?: Json;
          result_hash?: string;
          stage_id?: string | null;
          status?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "competition_generations_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_generations_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_generations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_generations_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_groups: {
        Row: {
          championship_id: string;
          code: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          sequence: number;
          settings: Json;
          stage_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          championship_id: string;
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          sequence?: number;
          settings?: Json;
          stage_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          championship_id?: string;
          code?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          sequence?: number;
          settings?: Json;
          stage_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competition_groups_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_groups_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_groups_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_rounds: {
        Row: {
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          group_id: string | null;
          id: string;
          name: string;
          organization_id: string;
          round_number: number;
          settings: Json;
          stage_id: string;
          starts_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          group_id?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          round_number: number;
          settings?: Json;
          stage_id: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          group_id?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          round_number?: number;
          settings?: Json;
          stage_id?: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competition_rounds_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_rounds_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_rounds_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_rounds_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_stage_teams: {
        Row: {
          assignment_method: string;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          seed: number | null;
          source_group_id: string | null;
          source_position: number | null;
          source_stage_id: string | null;
          stage_id: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_method?: string;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          seed?: number | null;
          source_group_id?: string | null;
          source_position?: number | null;
          source_stage_id?: string | null;
          stage_id: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_method?: string;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          seed?: number | null;
          source_group_id?: string | null;
          source_position?: number | null;
          source_stage_id?: string | null;
          stage_id?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competition_stage_teams_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_source_group_id_fkey";
            columns: ["source_group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_source_stage_id_fkey";
            columns: ["source_stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stage_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "competition_stage_teams_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_stages: {
        Row: {
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          sequence: number;
          settings: Json;
          stage_type: string;
          starts_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          sequence?: number;
          settings?: Json;
          stage_type: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          sequence?: number;
          settings?: Json;
          stage_type?: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competition_stages_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stages_category_same_org_fkey";
            columns: ["category_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "competition_stages_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "competition_stages_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      financial_transactions: {
        Row: {
          amount: number;
          attachment_url: string | null;
          category: string;
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string;
          due_on: string | null;
          id: string;
          metadata: Json;
          occurred_on: string;
          organization_id: string;
          paid_on: string | null;
          payment_id: string | null;
          referee_assignment_id: string | null;
          status: string;
          transaction_type: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          amount: number;
          attachment_url?: string | null;
          category: string;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description: string;
          due_on?: string | null;
          id?: string;
          metadata?: Json;
          occurred_on?: string;
          organization_id: string;
          paid_on?: string | null;
          payment_id?: string | null;
          referee_assignment_id?: string | null;
          status?: string;
          transaction_type: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          amount?: number;
          attachment_url?: string | null;
          category?: string;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string;
          due_on?: string | null;
          id?: string;
          metadata?: Json;
          occurred_on?: string;
          organization_id?: string;
          paid_on?: string | null;
          payment_id?: string | null;
          referee_assignment_id?: string | null;
          status?: string;
          transaction_type?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financial_transactions_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_transactions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_transactions_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_transactions_referee_assignment_id_fkey";
            columns: ["referee_assignment_id"];
            isOneToOne: false;
            referencedRelation: "referee_assignments";
            referencedColumns: ["id"];
          },
        ];
      };
      lineups: {
        Row: {
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_captain: boolean;
          jersey_number: number | null;
          lineup_role: string;
          match_id: string;
          organization_id: string;
          position: string | null;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          athlete_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_captain?: boolean;
          jersey_number?: number | null;
          lineup_role: string;
          match_id: string;
          organization_id: string;
          position?: string | null;
          status?: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          athlete_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_captain?: boolean;
          jersey_number?: number | null;
          lineup_role?: string;
          match_id?: string;
          organization_id?: string;
          position?: string | null;
          status?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lineups_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lineups_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "lineups_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lineups_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lineups_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "lineups_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      match_events: {
        Row: {
          athlete_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          match_id: string;
          metadata: Json;
          minute: number | null;
          note: string | null;
          occurred_at: string | null;
          organization_id: string;
          period: string | null;
          related_athlete_id: string | null;
          score_away_after: number | null;
          score_home_after: number | null;
          team_id: string | null;
          type: Database["public"]["Enums"]["event_type"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          match_id: string;
          metadata?: Json;
          minute?: number | null;
          note?: string | null;
          occurred_at?: string | null;
          organization_id: string;
          period?: string | null;
          related_athlete_id?: string | null;
          score_away_after?: number | null;
          score_home_after?: number | null;
          team_id?: string | null;
          type: Database["public"]["Enums"]["event_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          match_id?: string;
          metadata?: Json;
          minute?: number | null;
          note?: string | null;
          occurred_at?: string | null;
          organization_id?: string;
          period?: string | null;
          related_athlete_id?: string | null;
          score_away_after?: number | null;
          score_home_after?: number | null;
          team_id?: string | null;
          type?: Database["public"]["Enums"]["event_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "match_events_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "match_events_athlete_same_org_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "match_events_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_match_same_org_fkey";
            columns: ["match_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "match_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_related_athlete_id_fkey";
            columns: ["related_athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_related_athlete_id_fkey";
            columns: ["related_athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "match_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "match_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_team_same_org_fkey";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      match_reports: {
        Row: {
          attachments: Json;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          extra_away_score: number | null;
          extra_home_score: number | null;
          first_half_added_minutes: number;
          homologated_at: string | null;
          homologated_by: string | null;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          penalty_away_score: number | null;
          penalty_home_score: number | null;
          regular_away_score: number | null;
          regular_home_score: number | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          second_half_added_minutes: number;
          snapshot: Json | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          attachments?: Json;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          extra_away_score?: number | null;
          extra_home_score?: number | null;
          first_half_added_minutes?: number;
          homologated_at?: string | null;
          homologated_by?: string | null;
          id?: string;
          match_id: string;
          notes?: string | null;
          organization_id: string;
          penalty_away_score?: number | null;
          penalty_home_score?: number | null;
          regular_away_score?: number | null;
          regular_home_score?: number | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          second_half_added_minutes?: number;
          snapshot?: Json | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          attachments?: Json;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          extra_away_score?: number | null;
          extra_home_score?: number | null;
          first_half_added_minutes?: number;
          homologated_at?: string | null;
          homologated_by?: string | null;
          id?: string;
          match_id?: string;
          notes?: string | null;
          organization_id?: string;
          penalty_away_score?: number | null;
          penalty_home_score?: number | null;
          regular_away_score?: number | null;
          regular_home_score?: number | null;
          reopen_reason?: string | null;
          reopened_at?: string | null;
          reopened_by?: string | null;
          second_half_added_minutes?: number;
          snapshot?: Json | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "match_reports_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_reports_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: true;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_reports_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        Insert: {
          away_penalty_score?: number | null;
          away_score?: number | null;
          away_team_id?: string | null;
          category_id?: string | null;
          championship_id: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_by?: string | null;
          ended_at?: string | null;
          group_id?: string | null;
          home_penalty_score?: number | null;
          home_score?: number | null;
          home_team_id?: string | null;
          id?: string;
          leg?: number;
          match_number?: number | null;
          metadata?: Json;
          notes?: string | null;
          organization_id: string;
          phase?: string | null;
          published?: boolean;
          round?: string | null;
          round_id?: string | null;
          scheduled_at?: string | null;
          sequence?: number | null;
          stage_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue?: string | null;
          venue_id?: string | null;
          winner_team_id?: string | null;
        };
        Update: {
          away_penalty_score?: number | null;
          away_score?: number | null;
          away_team_id?: string | null;
          category_id?: string | null;
          championship_id?: string;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          decided_by?: string | null;
          ended_at?: string | null;
          group_id?: string | null;
          home_penalty_score?: number | null;
          home_score?: number | null;
          home_team_id?: string | null;
          id?: string;
          leg?: number;
          match_number?: number | null;
          metadata?: Json;
          notes?: string | null;
          organization_id?: string;
          phase?: string | null;
          published?: boolean;
          round?: string | null;
          round_id?: string | null;
          scheduled_at?: string | null;
          sequence?: number | null;
          stage_id?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue?: string | null;
          venue_id?: string | null;
          winner_team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_same_org_fkey";
            columns: ["away_team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "matches_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "matches_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_same_org_fkey";
            columns: ["home_team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "matches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "competition_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey";
            columns: ["winner_team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey";
            columns: ["winner_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      media: {
        Row: {
          athlete_id: string | null;
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          external_url: string | null;
          file_url: string | null;
          id: string;
          is_featured: boolean;
          is_public: boolean;
          match_id: string | null;
          media_type: string;
          metadata: Json;
          organization_id: string;
          published_at: string | null;
          team_id: string | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          athlete_id?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          external_url?: string | null;
          file_url?: string | null;
          id?: string;
          is_featured?: boolean;
          is_public?: boolean;
          match_id?: string | null;
          media_type: string;
          metadata?: Json;
          organization_id: string;
          published_at?: string | null;
          team_id?: string | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          athlete_id?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          external_url?: string | null;
          file_url?: string | null;
          id?: string;
          is_featured?: boolean;
          is_public?: boolean;
          match_id?: string | null;
          media_type?: string;
          metadata?: Json;
          organization_id?: string;
          published_at?: string | null;
          team_id?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "media_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "media_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      news: {
        Row: {
          author: string | null;
          body: string | null;
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          image_url: string | null;
          is_featured: boolean;
          organization_id: string;
          published_at: string | null;
          summary: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          author?: string | null;
          body?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          organization_id: string;
          published_at?: string | null;
          summary?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          author?: string | null;
          body?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          image_url?: string | null;
          is_featured?: boolean;
          organization_id?: string;
          published_at?: string | null;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "news_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "news_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "news_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          championship_id: string | null;
          channel: string;
          created_at: string;
          error_message: string | null;
          id: string;
          message: string;
          notification_type: string;
          organization_id: string;
          payload: Json;
          read_at: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          championship_id?: string | null;
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message: string;
          notification_type: string;
          organization_id: string;
          payload?: Json;
          read_at?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          championship_id?: string | null;
          channel?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          message?: string;
          notification_type?: string;
          organization_id?: string;
          payload?: Json;
          read_at?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          plan: string;
          plan_expires_at: string | null;
          slug: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          plan?: string;
          plan_expires_at?: string | null;
          slug?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          plan?: string;
          plan_expires_at?: string | null;
          slug?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          championship_id: string | null;
          championship_team_id: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          due_at: string | null;
          external_reference: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          paid_at: string | null;
          payment_method: string | null;
          provider: string | null;
          provider_payload: Json;
          receipt_url: string | null;
          refunded_at: string | null;
          registration_submission_id: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          amount: number;
          championship_id?: string | null;
          championship_team_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          due_at?: string | null;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id: string;
          paid_at?: string | null;
          payment_method?: string | null;
          provider?: string | null;
          provider_payload?: Json;
          receipt_url?: string | null;
          refunded_at?: string | null;
          registration_submission_id?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          amount?: number;
          championship_id?: string | null;
          championship_team_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          due_at?: string | null;
          external_reference?: string | null;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          paid_at?: string | null;
          payment_method?: string | null;
          provider?: string | null;
          provider_payload?: Json;
          receipt_url?: string | null;
          refunded_at?: string | null;
          registration_submission_id?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_championship_team_id_fkey";
            columns: ["championship_team_id"];
            isOneToOne: false;
            referencedRelation: "championship_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_registration_submission_id_fkey";
            columns: ["registration_submission_id"];
            isOneToOne: false;
            referencedRelation: "registration_submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      referee_assignments: {
        Row: {
          assignment_role: string;
          championship_id: string;
          confirmation_status: string;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          fee_amount: number;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          payment_status: string;
          referee_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_role: string;
          championship_id: string;
          confirmation_status?: string;
          confirmed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          fee_amount?: number;
          id?: string;
          match_id: string;
          notes?: string | null;
          organization_id: string;
          payment_status?: string;
          referee_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_role?: string;
          championship_id?: string;
          confirmation_status?: string;
          confirmed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          fee_amount?: number;
          id?: string;
          match_id?: string;
          notes?: string | null;
          organization_id?: string;
          payment_status?: string;
          referee_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "referee_assignments_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referee_assignments_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referee_assignments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referee_assignments_referee_id_fkey";
            columns: ["referee_id"];
            isOneToOne: false;
            referencedRelation: "referees";
            referencedColumns: ["id"];
          },
        ];
      };
      referee_unavailability: {
        Row: {
          created_at: string;
          created_by: string | null;
          ends_at: string;
          id: string;
          organization_id: string;
          reason: string | null;
          referee_id: string;
          starts_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          ends_at: string;
          id?: string;
          organization_id: string;
          reason?: string | null;
          referee_id: string;
          starts_at: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          ends_at?: string;
          id?: string;
          organization_id?: string;
          reason?: string | null;
          referee_id?: string;
          starts_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "referee_unavailability_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referee_unavailability_referee_id_fkey";
            columns: ["referee_id"];
            isOneToOne: false;
            referencedRelation: "referees";
            referencedColumns: ["id"];
          },
        ];
      };
      referees: {
        Row: {
          availability: Json;
          created_at: string;
          created_by: string | null;
          default_fee: number;
          default_role: string;
          document_number: string | null;
          email: string | null;
          full_name: string;
          id: string;
          metadata: Json;
          organization_id: string;
          phone: string | null;
          photo_url: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          availability?: Json;
          created_at?: string;
          created_by?: string | null;
          default_fee?: number;
          default_role?: string;
          document_number?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          metadata?: Json;
          organization_id: string;
          phone?: string | null;
          photo_url?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          availability?: Json;
          created_at?: string;
          created_by?: string | null;
          default_fee?: number;
          default_role?: string;
          document_number?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          metadata?: Json;
          organization_id?: string;
          phone?: string | null;
          photo_url?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "referees_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      registration_documents: {
        Row: {
          athlete_id: string | null;
          created_at: string;
          document_type: string;
          file_name: string | null;
          file_path: string;
          id: string;
          mime_type: string | null;
          organization_id: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          size_bytes: number | null;
          status: string;
          submission_id: string;
        };
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          document_type: string;
          file_name?: string | null;
          file_path: string;
          id?: string;
          mime_type?: string | null;
          organization_id: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes?: number | null;
          status?: string;
          submission_id: string;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          document_type?: string;
          file_name?: string | null;
          file_path?: string;
          id?: string;
          mime_type?: string | null;
          organization_id?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          size_bytes?: number | null;
          status?: string;
          submission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_documents_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_documents_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "registration_documents_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_documents_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "registration_submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      registration_forms: {
        Row: {
          category_id: string | null;
          championship_id: string;
          closes_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          fee_amount: number;
          fields: Json;
          id: string;
          is_active: boolean;
          name: string;
          opens_at: string | null;
          organization_id: string;
          requires_payment: boolean;
          settings: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          category_id?: string | null;
          championship_id: string;
          closes_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          fee_amount?: number;
          fields?: Json;
          id?: string;
          is_active?: boolean;
          name: string;
          opens_at?: string | null;
          organization_id: string;
          requires_payment?: boolean;
          settings?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          category_id?: string | null;
          championship_id?: string;
          closes_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          fee_amount?: number;
          fields?: Json;
          id?: string;
          is_active?: boolean;
          name?: string;
          opens_at?: string | null;
          organization_id?: string;
          requires_payment?: boolean;
          settings?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "registration_forms_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_forms_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_forms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      registration_submissions: {
        Row: {
          category_id: string | null;
          championship_id: string;
          created_at: string;
          form_id: string;
          id: string;
          organization_id: string;
          payload: Json;
          responsible_email: string | null;
          responsible_name: string;
          responsible_phone: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          submitted_at: string;
          submitted_by: string | null;
          team_id: string | null;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          form_id: string;
          id?: string;
          organization_id: string;
          payload?: Json;
          responsible_email?: string | null;
          responsible_name: string;
          responsible_phone?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          submitted_at?: string;
          submitted_by?: string | null;
          team_id?: string | null;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          form_id?: string;
          id?: string;
          organization_id?: string;
          payload?: Json;
          responsible_email?: string | null;
          responsible_name?: string;
          responsible_phone?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          submitted_at?: string;
          submitted_by?: string | null;
          team_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registration_submissions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_submissions_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_submissions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "registration_forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_submissions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registration_submissions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "registration_submissions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      sanctions: {
        Row: {
          athlete_id: string | null;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          fine_amount: number;
          group_id: string | null;
          id: string;
          match_id: string | null;
          matches_suspended: number;
          metadata: Json;
          organization_id: string;
          points_deducted: number;
          reason: string;
          revocation_reason: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          sanction_type: string;
          served_at: string | null;
          source_event_id: string | null;
          stage_id: string | null;
          starts_at: string | null;
          status: string;
          team_id: string | null;
          team_staff_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          athlete_id?: string | null;
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          fine_amount?: number;
          group_id?: string | null;
          id?: string;
          match_id?: string | null;
          matches_suspended?: number;
          metadata?: Json;
          organization_id: string;
          points_deducted?: number;
          reason: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          sanction_type: string;
          served_at?: string | null;
          source_event_id?: string | null;
          stage_id?: string | null;
          starts_at?: string | null;
          status?: string;
          team_id?: string | null;
          team_staff_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          athlete_id?: string | null;
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          ends_at?: string | null;
          fine_amount?: number;
          group_id?: string | null;
          id?: string;
          match_id?: string | null;
          matches_suspended?: number;
          metadata?: Json;
          organization_id?: string;
          points_deducted?: number;
          reason?: string;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          sanction_type?: string;
          served_at?: string | null;
          source_event_id?: string | null;
          stage_id?: string | null;
          starts_at?: string | null;
          status?: string;
          team_id?: string | null;
          team_staff_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sanctions_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "sanctions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_source_event_id_fkey";
            columns: ["source_event_id"];
            isOneToOne: false;
            referencedRelation: "match_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "sanctions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sanctions_team_staff_id_fkey";
            columns: ["team_staff_id"];
            isOneToOne: false;
            referencedRelation: "team_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      sponsors: {
        Row: {
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          organization_id: string;
          tier: string | null;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
        };
        Insert: {
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          organization_id: string;
          tier?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Update: {
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          organization_id?: string;
          tier?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sponsors_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsors_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "sponsors_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      standings: {
        Row: {
          calculated_at: string;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          disciplinary_points: number;
          draws: number;
          form: string[];
          goal_difference: number;
          goals_against: number;
          goals_for: number;
          group_id: string | null;
          homologated_at: string | null;
          homologated_by: string | null;
          id: string;
          losses: number;
          organization_id: string;
          played: number;
          points: number;
          points_adjustment: number;
          position: number;
          stage_id: string | null;
          status: string;
          team_id: string;
          updated_at: string;
          wins: number;
        };
        Insert: {
          calculated_at?: string;
          category_id?: string | null;
          championship_id: string;
          created_at?: string;
          disciplinary_points?: number;
          draws?: number;
          form?: string[];
          goal_difference?: number;
          goals_against?: number;
          goals_for?: number;
          group_id?: string | null;
          homologated_at?: string | null;
          homologated_by?: string | null;
          id?: string;
          losses?: number;
          organization_id: string;
          played?: number;
          points?: number;
          points_adjustment?: number;
          position?: number;
          stage_id?: string | null;
          status?: string;
          team_id: string;
          updated_at?: string;
          wins?: number;
        };
        Update: {
          calculated_at?: string;
          category_id?: string | null;
          championship_id?: string;
          created_at?: string;
          disciplinary_points?: number;
          draws?: number;
          form?: string[];
          goal_difference?: number;
          goals_against?: number;
          goals_for?: number;
          group_id?: string | null;
          homologated_at?: string | null;
          homologated_by?: string | null;
          id?: string;
          losses?: number;
          organization_id?: string;
          played?: number;
          points?: number;
          points_adjustment?: number;
          position?: number;
          stage_id?: string | null;
          status?: string;
          team_id?: string;
          updated_at?: string;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "standings_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "standings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      standings_adjustments: {
        Row: {
          championship_id: string;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          organization_id: string;
          points: number;
          reason: string;
          stage_id: string | null;
          team_id: string;
        };
        Insert: {
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          organization_id: string;
          points: number;
          reason: string;
          stage_id?: string | null;
          team_id: string;
        };
        Update: {
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          group_id?: string | null;
          id?: string;
          organization_id?: string;
          points?: number;
          reason?: string;
          stage_id?: string | null;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "standings_adjustments_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_adjustments_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_adjustments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_adjustments_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "competition_stages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_adjustments_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "standings_adjustments_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      substitutions: {
        Row: {
          athlete_in_id: string;
          athlete_out_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          match_id: string;
          minute: number | null;
          note: string | null;
          organization_id: string;
          period: string | null;
          team_id: string;
        };
        Insert: {
          athlete_in_id: string;
          athlete_out_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_id: string;
          minute?: number | null;
          note?: string | null;
          organization_id: string;
          period?: string | null;
          team_id: string;
        };
        Update: {
          athlete_in_id?: string;
          athlete_out_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_id?: string;
          minute?: number | null;
          note?: string | null;
          organization_id?: string;
          period?: string | null;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "substitutions_athlete_in_id_fkey";
            columns: ["athlete_in_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "substitutions_athlete_in_id_fkey";
            columns: ["athlete_in_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "substitutions_athlete_out_id_fkey";
            columns: ["athlete_out_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "substitutions_athlete_out_id_fkey";
            columns: ["athlete_out_id"];
            isOneToOne: false;
            referencedRelation: "public_athlete_profiles";
            referencedColumns: ["athlete_id"];
          },
          {
            foreignKeyName: "substitutions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "substitutions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "substitutions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "substitutions_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_access_rate_limits: {
        Row: {
          attempts: number;
          blocked_until: string | null;
          fingerprint_hash: string;
          updated_at: string;
          window_started_at: string;
        };
        Insert: {
          attempts?: number;
          blocked_until?: string | null;
          fingerprint_hash: string;
          updated_at?: string;
          window_started_at?: string;
        };
        Update: {
          attempts?: number;
          blocked_until?: string | null;
          fingerprint_hash?: string;
          updated_at?: string;
          window_started_at?: string;
        };
        Relationships: [];
      };
      team_access_security_events: {
        Row: {
          context: Json;
          created_at: string;
          event_type: string;
          fingerprint_hash: string | null;
          id: string;
        };
        Insert: {
          context?: Json;
          created_at?: string;
          event_type: string;
          fingerprint_hash?: string | null;
          id?: string;
        };
        Update: {
          context?: Json;
          created_at?: string;
          event_type?: string;
          fingerprint_hash?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      team_edit_link_events: {
        Row: {
          actor_id: string | null;
          championship_id: string;
          context: Json;
          created_at: string;
          event_type: string;
          id: string;
          link_id: string;
          new_data: Json | null;
          old_data: Json | null;
          organization_id: string;
          reason: string | null;
          team_id: string;
        };
        Insert: {
          actor_id?: string | null;
          championship_id: string;
          context?: Json;
          created_at?: string;
          event_type: string;
          id?: string;
          link_id: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id: string;
          reason?: string | null;
          team_id: string;
        };
        Update: {
          actor_id?: string | null;
          championship_id?: string;
          context?: Json;
          created_at?: string;
          event_type?: string;
          id?: string;
          link_id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          organization_id?: string;
          reason?: string | null;
          team_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_edit_link_events_championship_fk";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "team_edit_link_events_link_fk";
            columns: ["link_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "team_edit_links";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "team_edit_link_events_team_fk";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      team_edit_link_sessions: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          last_seen_at: string;
          link_id: string;
          session_hash: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          last_seen_at?: string;
          link_id: string;
          session_hash: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          last_seen_at?: string;
          link_id?: string;
          session_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_edit_link_sessions_link_id_fkey";
            columns: ["link_id"];
            isOneToOne: false;
            referencedRelation: "team_edit_links";
            referencedColumns: ["id"];
          },
        ];
      };
      team_edit_links: {
        Row: {
          access_count: number;
          block_reason: string | null;
          blocked_at: string | null;
          blocked_by: string | null;
          championship_id: string;
          championship_team_id: string;
          created_at: string;
          created_by: string;
          expires_at: string;
          id: string;
          last_accessed_at: string | null;
          max_access_count: number | null;
          metadata: Json;
          organization_id: string;
          permissions: Json;
          replaced_at: string | null;
          replaced_by: string | null;
          replaced_by_link_id: string | null;
          revocation_reason: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          status: string;
          team_id: string;
          token_hash: string;
          token_prefix: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          access_count?: number;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          championship_id: string;
          championship_team_id: string;
          created_at?: string;
          created_by: string;
          expires_at: string;
          id?: string;
          last_accessed_at?: string | null;
          max_access_count?: number | null;
          metadata?: Json;
          organization_id: string;
          permissions?: Json;
          replaced_at?: string | null;
          replaced_by?: string | null;
          replaced_by_link_id?: string | null;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          team_id: string;
          token_hash: string;
          token_prefix?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          access_count?: number;
          block_reason?: string | null;
          blocked_at?: string | null;
          blocked_by?: string | null;
          championship_id?: string;
          championship_team_id?: string;
          created_at?: string;
          created_by?: string;
          expires_at?: string;
          id?: string;
          last_accessed_at?: string | null;
          max_access_count?: number | null;
          metadata?: Json;
          organization_id?: string;
          permissions?: Json;
          replaced_at?: string | null;
          replaced_by?: string | null;
          replaced_by_link_id?: string | null;
          revocation_reason?: string | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          status?: string;
          team_id?: string;
          token_hash?: string;
          token_prefix?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_edit_links_championship_fk";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "team_edit_links_participation_fk";
            columns: ["championship_team_id", "championship_id", "team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championship_teams";
            referencedColumns: ["id", "championship_id", "team_id", "organization_id"];
          },
          {
            foreignKeyName: "team_edit_links_replaced_by_link_fk";
            columns: ["replaced_by_link_id"];
            isOneToOne: false;
            referencedRelation: "team_edit_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_edit_links_team_fk";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      team_registration_drafts: {
        Row: {
          championship_id: string;
          championship_team_id: string;
          completed_steps: string[];
          created_at: string;
          id: string;
          organization_id: string;
          payload: Json;
          status: string;
          submitted_at: string | null;
          team_id: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          championship_id: string;
          championship_team_id: string;
          completed_steps?: string[];
          created_at?: string;
          id?: string;
          organization_id: string;
          payload?: Json;
          status?: string;
          submitted_at?: string | null;
          team_id: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          championship_id?: string;
          championship_team_id?: string;
          completed_steps?: string[];
          created_at?: string;
          id?: string;
          organization_id?: string;
          payload?: Json;
          status?: string;
          submitted_at?: string | null;
          team_id?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "team_registration_drafts_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_registration_drafts_championship_team_id_fkey";
            columns: ["championship_team_id"];
            isOneToOne: true;
            referencedRelation: "championship_teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_registration_drafts_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_registration_drafts_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "team_registration_drafts_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_responsibles: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          created_by: string | null;
          document_number: string | null;
          document_number_normalized: string | null;
          document_type: string | null;
          email: string | null;
          full_name: string;
          id: string;
          internal_notes: string | null;
          is_primary: boolean;
          organization_id: string;
          phone: string | null;
          photo_url: string | null;
          role: string;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
          whatsapp: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          organization_id: string;
          phone?: string | null;
          photo_url?: string | null;
          role: string;
          status?: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          internal_notes?: string | null;
          is_primary?: boolean;
          organization_id?: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: string;
          status?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_responsibles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_responsibles_team_fk";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      team_staff: {
        Row: {
          archived_at: string | null;
          archived_by: string | null;
          birth_date: string | null;
          category_id: string | null;
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          custom_role: string | null;
          document_number: string | null;
          document_number_normalized: string | null;
          document_type: string | null;
          email: string | null;
          full_name: string;
          id: string;
          internal_notes: string | null;
          organization_id: string;
          phone: string | null;
          photo_url: string | null;
          role: string;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
          whatsapp: string | null;
        };
        Insert: {
          archived_at?: string | null;
          archived_by?: string | null;
          birth_date?: string | null;
          category_id?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          custom_role?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          internal_notes?: string | null;
          organization_id: string;
          phone?: string | null;
          photo_url?: string | null;
          role: string;
          status?: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          archived_at?: string | null;
          archived_by?: string | null;
          birth_date?: string | null;
          category_id?: string | null;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          custom_role?: string | null;
          document_number?: string | null;
          document_number_normalized?: string | null;
          document_type?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          internal_notes?: string | null;
          organization_id?: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: string;
          status?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_staff_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_staff_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_staff_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_staff_team_fk";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "team_staff_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "team_staff_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_user_access: {
        Row: {
          accepted_at: string | null;
          access_role: string;
          championship_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          invited_at: string;
          organization_id: string;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          access_role?: string;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invited_at?: string;
          organization_id: string;
          status?: string;
          team_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          access_role?: string;
          championship_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          invited_at?: string;
          organization_id?: string;
          status?: string;
          team_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_user_access_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_user_access_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_user_access_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "team_user_access_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          abbreviation: string | null;
          archived_at: string | null;
          archived_by: string | null;
          category: string | null;
          championship_id: string | null;
          city: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          crest_url: string | null;
          description: string | null;
          email: string | null;
          facebook: string | null;
          foundation_year: number | null;
          gender: string | null;
          history: string | null;
          id: string;
          instagram: string | null;
          internal_notes: string | null;
          name: string;
          neighborhood: string | null;
          organization_id: string;
          phone: string | null;
          primary_color: string | null;
          registration_number: string | null;
          secondary_color: string | null;
          short_name: string | null;
          slug: string | null;
          state: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
          whatsapp: string | null;
        };
        Insert: {
          abbreviation?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          category?: string | null;
          championship_id?: string | null;
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          crest_url?: string | null;
          description?: string | null;
          email?: string | null;
          facebook?: string | null;
          foundation_year?: number | null;
          gender?: string | null;
          history?: string | null;
          id?: string;
          instagram?: string | null;
          internal_notes?: string | null;
          name: string;
          neighborhood?: string | null;
          organization_id: string;
          phone?: string | null;
          primary_color?: string | null;
          registration_number?: string | null;
          secondary_color?: string | null;
          short_name?: string | null;
          slug?: string | null;
          state?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          abbreviation?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          category?: string | null;
          championship_id?: string | null;
          city?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          crest_url?: string | null;
          description?: string | null;
          email?: string | null;
          facebook?: string | null;
          foundation_year?: number | null;
          gender?: string | null;
          history?: string | null;
          id?: string;
          instagram?: string | null;
          internal_notes?: string | null;
          name?: string;
          neighborhood?: string | null;
          organization_id?: string;
          phone?: string | null;
          primary_color?: string | null;
          registration_number?: string | null;
          secondary_color?: string | null;
          short_name?: string | null;
          slug?: string | null;
          state?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          address: string | null;
          capacity: number | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          district: string | null;
          id: string;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          metadata: Json;
          name: string;
          organization_id: string;
          postal_code: string | null;
          state: string | null;
          surface: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address?: string | null;
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          district?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          name: string;
          organization_id: string;
          postal_code?: string | null;
          state?: string | null;
          surface?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address?: string | null;
          capacity?: number | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          district?: string | null;
          id?: string;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          metadata?: Json;
          name?: string;
          organization_id?: string;
          postal_code?: string | null;
          state?: string | null;
          surface?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "venues_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_athlete_profiles: {
        Row: {
          athlete_id: string | null;
          category_id: string | null;
          championship_id: string | null;
          full_name: string | null;
          jersey_number: number | null;
          photo_url: string | null;
          position: string | null;
          registration_status: string | null;
          team_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_registrations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "athlete_registrations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "public_team_profiles";
            referencedColumns: ["team_id"];
          },
          {
            foreignKeyName: "athlete_registrations_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      public_team_profiles: {
        Row: {
          category_id: string | null;
          championship_id: string | null;
          city: string | null;
          crest_url: string | null;
          group_id: string | null;
          name: string | null;
          primary_color: string | null;
          short_name: string | null;
          team_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "championship_teams_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "championship_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_championship_id_fkey";
            columns: ["championship_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "championship_teams_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "competition_groups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      add_standings_adjustment: {
        Args: {
          p_championship_id: string;
          p_group_id: string;
          p_points: number;
          p_reason: string;
          p_stage_id: string;
          p_team_id: string;
        };
        Returns: string;
      };
      add_team_responsible: {
        Args: {
          p_championship_id: string;
          p_email?: string;
          p_full_name: string;
          p_is_primary?: boolean;
          p_phone?: string;
          p_role: string;
          p_team_id: string;
        };
        Returns: string;
      };
      add_team_staff_for_championship:
        | {
            Args: {
              p_championship_id: string;
              p_custom_role?: string;
              p_email?: string;
              p_full_name: string;
              p_phone?: string;
              p_role: string;
              p_team_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_championship_id: string;
              p_email: string;
              p_full_name: string;
              p_phone: string;
              p_role: string;
              p_team_id: string;
            };
            Returns: string;
          };
      archive_competition_stage: {
        Args: {
          p_championship_id: string;
          p_reason: string;
          p_stage_id: string;
        };
        Returns: undefined;
      };
      assign_referee: {
        Args: {
          p_championship_id: string;
          p_fee?: number;
          p_match_id: string;
          p_referee_id: string;
          p_role: string;
        };
        Returns: {
          assignment_role: string;
          championship_id: string;
          confirmation_status: string;
          confirmed_at: string | null;
          created_at: string;
          created_by: string | null;
          fee_amount: number;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          payment_status: string;
          referee_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "referee_assignments";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      assign_team_to_stage: {
        Args: {
          p_championship_id: string;
          p_group_id?: string;
          p_seed?: number;
          p_stage_id: string;
          p_team_id: string;
        };
        Returns: {
          assignment_method: string;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          group_id: string | null;
          id: string;
          metadata: Json;
          organization_id: string;
          seed: number | null;
          source_group_id: string | null;
          source_position: number | null;
          source_stage_id: string | null;
          stage_id: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "competition_stage_teams";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      block_team_edit_link: {
        Args: { p_link_id: string; p_reason: string };
        Returns: string;
      };
      can_administer_org: { Args: { _org: string }; Returns: boolean };
      can_edit_org: { Args: { p_organization_id: string }; Returns: boolean };
      can_manage_org: { Args: { p_organization_id: string }; Returns: boolean };
      can_manage_team: {
        Args: { p_championship_id?: string; p_team_id: string };
        Returns: boolean;
      };
      commit_fixture_generation: {
        Args: {
          p_championship_id: string;
          p_client_request_id: string;
          p_first_kickoff: string;
          p_fixtures: Json;
          p_group_id: string;
          p_round_interval_hours: number;
          p_stage_id: string;
        };
        Returns: string;
      };
      confirm_stage_advancement: {
        Args: {
          p_championship_id: string;
          p_client_request_id: string;
          p_qualified_teams: Json;
          p_source_stage_id: string;
          p_target_stage_id: string;
        };
        Returns: string;
      };
      consume_team_edit_token: {
        Args: {
          p_fingerprint_hash: string;
          p_session_hash: string;
          p_token_hash: string;
        };
        Returns: {
          access_state: string;
          championship_logo_url: string;
          championship_name: string;
          effective_permissions: Json;
          link_expires_at: string;
          session_expires_at: string;
          team_crest_url: string;
          team_name: string;
        }[];
      };
      create_championship: {
        Args: {
          p_category_name?: string;
          p_create_initial_stage?: boolean;
          p_description?: string;
          p_ends_at?: string;
          p_is_public?: boolean;
          p_name: string;
          p_organization_id: string;
          p_season?: string;
          p_slug: string;
          p_starts_at?: string;
        };
        Returns: {
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          instagram_url: string | null;
          is_public: boolean;
          logo_url: string | null;
          metadata: Json;
          modality: string | null;
          name: string;
          organization_id: string;
          published_at: string | null;
          registration_closes_at: string | null;
          registration_opens_at: string | null;
          regulations_url: string | null;
          season: string | null;
          slug: string;
          sport: string;
          starts_at: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["championship_status"];
          updated_at: string;
          updated_by: string | null;
          website_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "championships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_championship_match: {
        Args: {
          p_away_team_id: string;
          p_championship_id: string;
          p_home_team_id: string;
          p_phase?: string;
          p_round?: string;
          p_scheduled_at?: string;
          p_venue?: string;
        };
        Returns: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "matches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_team_for_championship: {
        Args: {
          p_abbreviation?: string;
          p_category?: string;
          p_championship_id: string;
          p_city?: string;
          p_cover_url?: string;
          p_crest_url?: string;
          p_description?: string;
          p_email?: string;
          p_facebook?: string;
          p_foundation_year?: number;
          p_gender?: string;
          p_history?: string;
          p_instagram?: string;
          p_internal_notes?: string;
          p_name: string;
          p_neighborhood?: string;
          p_phone?: string;
          p_primary_color?: string;
          p_registration_number?: string;
          p_secondary_color?: string;
          p_short_name?: string;
          p_slug?: string;
          p_state?: string;
          p_website?: string;
          p_whatsapp?: string;
        };
        Returns: {
          abbreviation: string | null;
          archived_at: string | null;
          archived_by: string | null;
          category: string | null;
          championship_id: string | null;
          city: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          crest_url: string | null;
          description: string | null;
          email: string | null;
          facebook: string | null;
          foundation_year: number | null;
          gender: string | null;
          history: string | null;
          id: string;
          instagram: string | null;
          internal_notes: string | null;
          name: string;
          neighborhood: string | null;
          organization_id: string;
          phone: string | null;
          primary_color: string | null;
          registration_number: string | null;
          secondary_color: string | null;
          short_name: string | null;
          slug: string | null;
          state: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
          whatsapp: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "teams";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_user_has_role: {
        Args: { _org: string; _role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      default_team_edit_permissions: { Args: never; Returns: Json };
      delete_championship: {
        Args: { p_championship_id: string };
        Returns: undefined;
      };
      delete_championship_match: {
        Args: { p_championship_id: string; p_match_id: string };
        Returns: undefined;
      };
      extend_team_edit_link_expiration: {
        Args: { p_expires_at: string; p_link_id: string };
        Returns: string;
      };
      generate_competition_groups: {
        Args: {
          p_championship_id: string;
          p_client_request_id: string;
          p_group_count: number;
          p_stage_id: string;
        };
        Returns: string;
      };
      generate_team_edit_link: {
        Args: {
          p_admin_note?: string;
          p_championship_id: string;
          p_expires_at: string;
          p_permissions: Json;
          p_team_id: string;
        };
        Returns: {
          link_id: string;
          plaintext_token: string;
        }[];
      };
      get_championship_context: {
        Args: { p_championship_id: string };
        Returns: {
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          instagram_url: string | null;
          is_public: boolean;
          logo_url: string | null;
          metadata: Json;
          modality: string | null;
          name: string;
          organization_id: string;
          published_at: string | null;
          registration_closes_at: string | null;
          registration_opens_at: string | null;
          regulations_url: string | null;
          season: string | null;
          slug: string;
          sport: string;
          starts_at: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["championship_status"];
          updated_at: string;
          updated_by: string | null;
          website_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "championships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_competition_stage_teams: {
        Args: { p_championship_id: string; p_stage_id: string };
        Returns: Json;
      };
      get_team_edit_session: {
        Args: { p_session_hash: string };
        Returns: {
          access_state: string;
          championship_logo_url: string;
          championship_name: string;
          effective_permissions: Json;
          link_expires_at: string;
          session_expires_at: string;
          team_crest_url: string;
          team_name: string;
        }[];
      };
      has_role: {
        Args: {
          _org: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user: string;
        };
        Returns: boolean;
      };
      homologate_match_report: {
        Args: { p_championship_id: string; p_match_id: string };
        Returns: {
          attachments: Json;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          extra_away_score: number | null;
          extra_home_score: number | null;
          first_half_added_minutes: number;
          homologated_at: string | null;
          homologated_by: string | null;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          penalty_away_score: number | null;
          penalty_home_score: number | null;
          regular_away_score: number | null;
          regular_home_score: number | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          second_half_added_minutes: number;
          snapshot: Json | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "match_reports";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      homologate_standings: {
        Args: {
          p_championship_id: string;
          p_group_id: string;
          p_stage_id: string;
        };
        Returns: undefined;
      };
      is_org_member: { Args: { _org: string }; Returns: boolean };
      phase1_assert_editor: {
        Args: { p_organization_id: string };
        Returns: undefined;
      };
      phase1_team_in_championship: {
        Args: {
          p_championship_id: string;
          p_organization_id: string;
          p_team_id: string;
        };
        Returns: boolean;
      };
      phase2_championship_org: {
        Args: { p_championship_id: string };
        Returns: string;
      };
      phase3_match_context: {
        Args: { p_championship_id: string; p_match_id: string };
        Returns: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "matches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      publish_competition: {
        Args: { p_championship_id: string };
        Returns: {
          city: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          instagram_url: string | null;
          is_public: boolean;
          logo_url: string | null;
          metadata: Json;
          modality: string | null;
          name: string;
          organization_id: string;
          published_at: string | null;
          registration_closes_at: string | null;
          registration_opens_at: string | null;
          regulations_url: string | null;
          season: string | null;
          slug: string;
          sport: string;
          starts_at: string | null;
          state: string | null;
          status: Database["public"]["Enums"]["championship_status"];
          updated_at: string;
          updated_by: string | null;
          website_url: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "championships";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      recalculate_match_score: {
        Args: { p_match_id: string };
        Returns: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "matches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      recalculate_standings: {
        Args: {
          p_category_id?: string;
          p_championship_id: string;
          p_group_id?: string;
          p_stage_id?: string;
        };
        Returns: undefined;
      };
      record_match_event: {
        Args: {
          p_athlete_id: string;
          p_championship_id: string;
          p_client_request_id: string;
          p_match_id: string;
          p_minute?: number;
          p_note?: string;
          p_period?: string;
          p_team_id: string;
          p_type: Database["public"]["Enums"]["event_type"];
        };
        Returns: {
          athlete_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          match_id: string;
          metadata: Json;
          minute: number | null;
          note: string | null;
          occurred_at: string | null;
          organization_id: string;
          period: string | null;
          related_athlete_id: string | null;
          score_away_after: number | null;
          score_home_after: number | null;
          team_id: string | null;
          type: Database["public"]["Enums"]["event_type"];
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "match_events";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      register_athlete_for_championship:
        | {
            Args: {
              p_athlete_id?: string;
              p_birth_date?: string;
              p_championship_id: string;
              p_document_number?: string;
              p_document_type?: string;
              p_full_name?: string;
              p_is_captain?: boolean;
              p_is_goalkeeper?: boolean;
              p_photo_url?: string;
              p_position?: string;
              p_shirt_number?: number;
              p_team_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_birth_date: string;
              p_championship_id: string;
              p_document_number: string;
              p_document_type: string;
              p_full_name: string;
              p_is_captain: boolean;
              p_is_goalkeeper: boolean;
              p_photo_url: string;
              p_position: string;
              p_shirt_number: number;
              p_team_id: string;
            };
            Returns: string;
          };
      remove_match_event: {
        Args: {
          p_championship_id: string;
          p_event_id: string;
          p_match_id: string;
          p_reason?: string;
        };
        Returns: undefined;
      };
      remove_team_from_championship: {
        Args: { p_championship_id: string; p_team_id: string };
        Returns: undefined;
      };
      reopen_match_report: {
        Args: {
          p_championship_id: string;
          p_match_id: string;
          p_reason: string;
        };
        Returns: {
          attachments: Json;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          extra_away_score: number | null;
          extra_home_score: number | null;
          first_half_added_minutes: number;
          homologated_at: string | null;
          homologated_by: string | null;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          penalty_away_score: number | null;
          penalty_home_score: number | null;
          regular_away_score: number | null;
          regular_home_score: number | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          second_half_added_minutes: number;
          snapshot: Json | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "match_reports";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reopen_stage_advancement: {
        Args: {
          p_advancement_id: string;
          p_championship_id: string;
          p_reason: string;
        };
        Returns: undefined;
      };
      revoke_sanction: {
        Args: {
          p_championship_id: string;
          p_reason: string;
          p_sanction_id: string;
        };
        Returns: {
          athlete_id: string | null;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          fine_amount: number;
          group_id: string | null;
          id: string;
          match_id: string | null;
          matches_suspended: number;
          metadata: Json;
          organization_id: string;
          points_deducted: number;
          reason: string;
          revocation_reason: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          sanction_type: string;
          served_at: string | null;
          source_event_id: string | null;
          stage_id: string | null;
          starts_at: string | null;
          status: string;
          team_id: string | null;
          team_staff_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "sanctions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      revoke_team_edit_link: {
        Args: { p_link_id: string; p_reason: string };
        Returns: string;
      };
      save_competition_group: {
        Args: {
          p_championship_id: string;
          p_group_id: string;
          p_name: string;
          p_sequence: number;
          p_stage_id: string;
        };
        Returns: {
          championship_id: string;
          code: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          name: string;
          organization_id: string;
          sequence: number;
          settings: Json;
          stage_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "competition_groups";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_competition_settings: {
        Args: {
          p_championship_id: string;
          p_exception_reason?: string;
          p_settings: Json;
        };
        Returns: {
          allow_athlete_multiple_teams: boolean;
          allow_draw: boolean;
          allow_duplicate_shirt_numbers: boolean;
          allow_roster_changes_after_start: boolean;
          championship_id: string;
          competition_format: string;
          created_at: string;
          created_by: string | null;
          custom_rules: Json;
          group_count: number | null;
          id: string;
          legs: number;
          locked_at: string | null;
          max_athletes_per_team: number | null;
          max_goalkeepers_per_team: number | null;
          max_staff_per_team: number | null;
          maximum_athlete_age: number | null;
          min_athletes_per_team: number | null;
          minimum_athlete_age: number | null;
          minimum_rest_hours: number;
          organization_id: string;
          points_draw: number;
          points_loss: number;
          points_win: number;
          public_theme: Json;
          published_at: string | null;
          published_by: string | null;
          qualifiers_per_group: number | null;
          registration_ends_at: string | null;
          registration_starts_at: string | null;
          require_athlete_document: boolean;
          require_athlete_photo: boolean;
          require_shirt_number: boolean;
          rules_version: number;
          third_place_match: boolean;
          tiebreakers: string[];
          updated_at: string;
          updated_by: string | null;
          uses_extra_time: boolean;
          uses_penalties: boolean;
          wo_score_against: number;
          wo_score_for: number;
          yellow_cards_for_suspension: number;
        };
        SetofOptions: {
          from: "*";
          to: "championship_settings";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_competition_stage: {
        Args: { p_championship_id: string; p_payload: Json; p_stage_id: string };
        Returns: {
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          sequence: number;
          settings: Json;
          stage_type: string;
          starts_at: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "competition_stages";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_manual_sanction: {
        Args: {
          p_championship_id: string;
          p_payload: Json;
          p_sanction_id: string;
        };
        Returns: {
          athlete_id: string | null;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          fine_amount: number;
          group_id: string | null;
          id: string;
          match_id: string | null;
          matches_suspended: number;
          metadata: Json;
          organization_id: string;
          points_deducted: number;
          reason: string;
          revocation_reason: string | null;
          revoked_at: string | null;
          revoked_by: string | null;
          sanction_type: string;
          served_at: string | null;
          source_event_id: string | null;
          stage_id: string | null;
          starts_at: string | null;
          status: string;
          team_id: string | null;
          team_staff_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "sanctions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_match_lineup: {
        Args: {
          p_championship_id: string;
          p_entries: Json;
          p_match_id: string;
          p_team_id: string;
        };
        Returns: {
          athlete_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          is_captain: boolean;
          jersey_number: number | null;
          lineup_role: string;
          match_id: string;
          organization_id: string;
          position: string | null;
          status: string;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "lineups";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      save_match_report: {
        Args: { p_championship_id: string; p_match_id: string; p_payload: Json };
        Returns: {
          attachments: Json;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          extra_away_score: number | null;
          extra_home_score: number | null;
          first_half_added_minutes: number;
          homologated_at: string | null;
          homologated_by: string | null;
          id: string;
          match_id: string;
          notes: string | null;
          organization_id: string;
          penalty_away_score: number | null;
          penalty_home_score: number | null;
          regular_away_score: number | null;
          regular_home_score: number | null;
          reopen_reason: string | null;
          reopened_at: string | null;
          reopened_by: string | null;
          second_half_added_minutes: number;
          snapshot: Json | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        SetofOptions: {
          from: "*";
          to: "match_reports";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_referee: {
        Args: {
          p_championship_id: string;
          p_payload: Json;
          p_referee_id: string;
        };
        Returns: {
          availability: Json;
          created_at: string;
          created_by: string | null;
          default_fee: number;
          default_role: string;
          document_number: string | null;
          email: string | null;
          full_name: string;
          id: string;
          metadata: Json;
          organization_id: string;
          phone: string | null;
          photo_url: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "referees";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_championship_match_status: {
        Args: {
          p_championship_id: string;
          p_match_id: string;
          p_reason?: string;
          p_status: string;
        };
        Returns: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "matches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_primary_team_responsible: {
        Args: { p_responsible_id: string; p_team_id: string };
        Returns: undefined;
      };
      set_team_championship_archived: {
        Args: {
          p_archived: boolean;
          p_championship_id: string;
          p_team_id: string;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          archived_at: string | null;
          category_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          fee_amount: number;
          group_id: string | null;
          id: string;
          joined_at: string;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          payment_status: string;
          registration_number: string | null;
          seed: number | null;
          status: string;
          submitted_at: string | null;
          team_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "championship_teams";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      team_edit_permissions_are_valid: {
        Args: { p_permissions: Json };
        Returns: boolean;
      };
      unblock_team_edit_link: { Args: { p_link_id: string }; Returns: string };
      update_championship_match: {
        Args: {
          p_championship_id: string;
          p_match_id: string;
          p_phase: string;
          p_round: string;
          p_scheduled_at: string;
          p_venue: string;
        };
        Returns: {
          away_penalty_score: number | null;
          away_score: number | null;
          away_team_id: string | null;
          category_id: string | null;
          championship_id: string;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_at: string;
          created_by: string | null;
          decided_by: string | null;
          ended_at: string | null;
          group_id: string | null;
          home_penalty_score: number | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          leg: number;
          match_number: number | null;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          phase: string | null;
          published: boolean;
          round: string | null;
          round_id: string | null;
          scheduled_at: string | null;
          sequence: number | null;
          stage_id: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
          venue_id: string | null;
          winner_team_id: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "matches";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      update_team_edit_link_permissions: {
        Args: { p_link_id: string; p_permissions: Json };
        Returns: string;
      };
      update_team_for_championship: {
        Args: {
          p_abbreviation?: string;
          p_category?: string;
          p_championship_id: string;
          p_city?: string;
          p_cover_url?: string;
          p_crest_url?: string;
          p_description?: string;
          p_email?: string;
          p_facebook?: string;
          p_foundation_year?: number;
          p_gender?: string;
          p_history?: string;
          p_instagram?: string;
          p_internal_notes?: string;
          p_name: string;
          p_neighborhood?: string;
          p_phone?: string;
          p_primary_color?: string;
          p_registration_number?: string;
          p_secondary_color?: string;
          p_short_name?: string;
          p_slug?: string;
          p_state?: string;
          p_team_id: string;
          p_website?: string;
          p_whatsapp?: string;
        };
        Returns: {
          abbreviation: string | null;
          archived_at: string | null;
          archived_by: string | null;
          category: string | null;
          championship_id: string | null;
          city: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          crest_url: string | null;
          description: string | null;
          email: string | null;
          facebook: string | null;
          foundation_year: number | null;
          gender: string | null;
          history: string | null;
          id: string;
          instagram: string | null;
          internal_notes: string | null;
          name: string;
          neighborhood: string | null;
          organization_id: string;
          phone: string | null;
          primary_color: string | null;
          registration_number: string | null;
          secondary_color: string | null;
          short_name: string | null;
          slug: string | null;
          state: string | null;
          status: string;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
          whatsapp: string | null;
        };
        SetofOptions: {
          from: "*";
          to: "teams";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer" | "manager" | "team_manager" | "referee";
      championship_status:
        | "draft"
        | "active"
        | "finished"
        | "archived"
        | "registration_open"
        | "preparing"
        | "suspended"
        | "published";
      event_type:
        | "goal"
        | "own_goal"
        | "yellow_card"
        | "red_card"
        | "substitution"
        | "assist"
        | "injury"
        | "note"
        | "penalty_goal"
        | "penalty_missed"
        | "period_start"
        | "period_end"
        | "extra_time";
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
        | "confirmed"
        | "preparing"
        | "awaiting_confirmation";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer", "manager", "team_manager", "referee"],
      championship_status: [
        "draft",
        "active",
        "finished",
        "archived",
        "registration_open",
        "preparing",
        "suspended",
        "published",
      ],
      event_type: [
        "goal",
        "own_goal",
        "yellow_card",
        "red_card",
        "substitution",
        "assist",
        "injury",
        "note",
        "penalty_goal",
        "penalty_missed",
        "period_start",
        "period_end",
        "extra_time",
      ],
      match_status: [
        "scheduled",
        "live",
        "finished",
        "postponed",
        "cancelled",
        "confirmed",
        "preparing",
        "awaiting_confirmation",
      ],
    },
  },
} as const;
