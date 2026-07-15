export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      athletes: {
        Row: {
          birth_date: string | null;
          created_at: string;
          created_by: string | null;
          full_name: string;
          id: string;
          jersey_number: number | null;
          organization_id: string;
          photo_url: string | null;
          position: string | null;
          status: string;
          team_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          full_name: string;
          id?: string;
          jersey_number?: number | null;
          organization_id: string;
          photo_url?: string | null;
          position?: string | null;
          status?: string;
          team_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          created_by?: string | null;
          full_name?: string;
          id?: string;
          jersey_number?: number | null;
          organization_id?: string;
          photo_url?: string | null;
          position?: string | null;
          status?: string;
          team_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
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
      championships: {
        Row: {
          cover_url: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_public: boolean;
          name: string;
          organization_id: string;
          season: string | null;
          slug: string;
          starts_at: string | null;
          status: Database["public"]["Enums"]["championship_status"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_public?: boolean;
          name: string;
          organization_id: string;
          season?: string | null;
          slug: string;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["championship_status"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_public?: boolean;
          name?: string;
          organization_id?: string;
          season?: string | null;
          slug?: string;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["championship_status"];
          updated_at?: string;
          updated_by?: string | null;
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
            foreignKeyName: "championship_categories_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      championship_settings: {
        Row: {
          allow_draw: boolean;
          championship_id: string;
          competition_format: string;
          created_at: string;
          created_by: string | null;
          custom_rules: Json;
          group_count: number | null;
          id: string;
          legs: number;
          max_athletes_per_team: number | null;
          minimum_rest_hours: number;
          organization_id: string;
          points_draw: number;
          points_loss: number;
          points_win: number;
          public_theme: Json;
          qualifiers_per_group: number | null;
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
          allow_draw?: boolean;
          championship_id: string;
          competition_format?: string;
          created_at?: string;
          created_by?: string | null;
          custom_rules?: Json;
          group_count?: number | null;
          id?: string;
          legs?: number;
          max_athletes_per_team?: number | null;
          minimum_rest_hours?: number;
          organization_id: string;
          points_draw?: number;
          points_loss?: number;
          points_win?: number;
          public_theme?: Json;
          qualifiers_per_group?: number | null;
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
          allow_draw?: boolean;
          championship_id?: string;
          competition_format?: string;
          created_at?: string;
          created_by?: string | null;
          custom_rules?: Json;
          group_count?: number | null;
          id?: string;
          legs?: number;
          max_athletes_per_team?: number | null;
          minimum_rest_hours?: number;
          organization_id?: string;
          points_draw?: number;
          points_loss?: number;
          points_win?: number;
          public_theme?: Json;
          qualifiers_per_group?: number | null;
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
            foreignKeyName: "championship_settings_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: true;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "championship_settings_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      competition_stages: {
        Row: {
          championship_id: string;
          created_at: string;
          created_by: string | null;
          ends_at: string | null;
          id: string;
          name: string;
          organization_id: string;
          sequence: number;
          settings: Json;
          category_id: string | null;
          stage_type: string;
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
          id?: string;
          name: string;
          organization_id: string;
          sequence?: number;
          settings?: Json;
          category_id?: string | null;
          stage_type: string;
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
          id?: string;
          name?: string;
          organization_id?: string;
          sequence?: number;
          settings?: Json;
          category_id?: string | null;
          stage_type?: string;
          starts_at?: string | null;
          status?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "competition_stages_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "competition_stages_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      match_events: {
        Row: {
          athlete_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          match_id: string;
          minute: number | null;
          note: string | null;
          organization_id: string;
          period: string | null;
          team_id: string | null;
          type: Database["public"]["Enums"]["event_type"];
          updated_by: string | null;
        };
        Insert: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_id: string;
          minute?: number | null;
          note?: string | null;
          organization_id: string;
          period?: string | null;
          team_id?: string | null;
          type: Database["public"]["Enums"]["event_type"];
          updated_by?: string | null;
        };
        Update: {
          athlete_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          match_id?: string;
          minute?: number | null;
          note?: string | null;
          organization_id?: string;
          period?: string | null;
          team_id?: string | null;
          type?: Database["public"]["Enums"]["event_type"];
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
            foreignKeyName: "match_events_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_events_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
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
            foreignKeyName: "match_events_team_same_org_fkey";
            columns: ["team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "match_events_athlete_same_org_fkey";
            columns: ["athlete_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "athletes";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      matches: {
        Row: {
          away_score: number | null;
          away_team_id: string | null;
          championship_id: string;
          created_at: string;
          created_by: string | null;
          home_score: number | null;
          home_team_id: string | null;
          id: string;
          organization_id: string;
          phase: string | null;
          round: string | null;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["match_status"];
          updated_at: string;
          updated_by: string | null;
          venue: string | null;
        };
        Insert: {
          away_score?: number | null;
          away_team_id?: string | null;
          championship_id: string;
          created_at?: string;
          created_by?: string | null;
          home_score?: number | null;
          home_team_id?: string | null;
          id?: string;
          organization_id: string;
          phase?: string | null;
          round?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue?: string | null;
        };
        Update: {
          away_score?: number | null;
          away_team_id?: string | null;
          championship_id?: string;
          created_at?: string;
          created_by?: string | null;
          home_score?: number | null;
          home_team_id?: string | null;
          id?: string;
          organization_id?: string;
          phase?: string | null;
          round?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          updated_at?: string;
          updated_by?: string | null;
          venue?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
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
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
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
            foreignKeyName: "matches_home_team_same_org_fkey";
            columns: ["home_team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "matches_away_team_same_org_fkey";
            columns: ["away_team_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id", "organization_id"];
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
            foreignKeyName: "news_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "news_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
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
            foreignKeyName: "sponsors_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsors_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
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
            foreignKeyName: "championship_teams_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
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
            foreignKeyName: "teams_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_championship_same_org_fkey";
            columns: ["championship_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "championships";
            referencedColumns: ["id", "organization_id"];
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_administer_org: { Args: { _org: string }; Returns: boolean };
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
        Returns: Database["public"]["Tables"]["teams"]["Row"];
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
        Returns: Database["public"]["Tables"]["championships"]["Row"];
      };
      current_user_has_role: {
        Args: { _org: string; _role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      delete_championship: { Args: { p_championship_id: string }; Returns: undefined };
      get_championship_context: {
        Args: { p_championship_id: string };
        Returns: Database["public"]["Tables"]["championships"]["Row"];
      };
      has_role: {
        Args: {
          _org: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user: string;
        };
        Returns: boolean;
      };
      is_org_member: { Args: { _org: string }; Returns: boolean };
      remove_team_from_championship: {
        Args: { p_championship_id: string; p_team_id: string };
        Returns: undefined;
      };
      set_team_championship_archived: {
        Args: { p_archived: boolean; p_championship_id: string; p_team_id: string };
        Returns: Database["public"]["Tables"]["championship_teams"]["Row"];
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
        Returns: Database["public"]["Tables"]["teams"]["Row"];
      };
    };
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer";
      championship_status: "draft" | "active" | "finished" | "archived";
      event_type:
        | "goal"
        | "own_goal"
        | "yellow_card"
        | "red_card"
        | "substitution"
        | "assist"
        | "injury"
        | "note";
      match_status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
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
  public: {
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer"],
      championship_status: ["draft", "active", "finished", "archived"],
      event_type: [
        "goal",
        "own_goal",
        "yellow_card",
        "red_card",
        "substitution",
        "assist",
        "injury",
        "note",
      ],
      match_status: ["scheduled", "live", "finished", "postponed", "cancelled"],
    },
  },
} as const;
