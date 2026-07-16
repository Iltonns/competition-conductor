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
      athletes: {
        Row: {
          birth_date: string | null
          created_at: string
          created_by: string | null
          document_number: string | null
          document_type: string | null
          full_name: string
          id: string
          jersey_number: number | null
          organization_id: string
          photo_url: string | null
          position: string | null
          sport_name: string | null
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type?: string | null
          full_name: string
          id?: string
          jersey_number?: number | null
          organization_id: string
          photo_url?: string | null
          position?: string | null
          sport_name?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          document_number?: string | null
          document_type?: string | null
          full_name?: string
          id?: string
          jersey_number?: number | null
          organization_id?: string
          photo_url?: string | null
          position?: string | null
          sport_name?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athletes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_team_athletes: {
        Row: {
          active: boolean
          athlete_id: string
          championship_id: string
          championship_team_id: string
          created_at: string
          id: string
          is_captain: boolean
          is_goalkeeper: boolean
          organization_id: string
          position: string | null
          registration_status: string
          shirt_number: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          athlete_id: string
          championship_id: string
          championship_team_id: string
          created_at?: string
          id?: string
          is_captain?: boolean
          is_goalkeeper?: boolean
          organization_id: string
          position?: string | null
          registration_status?: string
          shirt_number?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          athlete_id?: string
          championship_id?: string
          championship_team_id?: string
          created_at?: string
          id?: string
          is_captain?: boolean
          is_goalkeeper?: boolean
          organization_id?: string
          position?: string | null
          registration_status?: string
          shirt_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_team_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_team_athletes_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_team_athletes_championship_team_id_fkey"
            columns: ["championship_team_id"]
            isOneToOne: false
            referencedRelation: "championship_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_team_athletes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_team_staff: {
        Row: {
          active: boolean
          championship_team_id: string
          created_at: string
          id: string
          organization_id: string
          team_staff_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          championship_team_id: string
          created_at?: string
          id?: string
          organization_id: string
          team_staff_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          championship_team_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          team_staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_team_staff_championship_team_id_fkey"
            columns: ["championship_team_id"]
            isOneToOne: false
            referencedRelation: "championship_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_team_staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_team_staff_team_staff_id_fkey"
            columns: ["team_staff_id"]
            isOneToOne: false
            referencedRelation: "team_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_teams: {
        Row: {
          championship_id: string
          created_at: string
          id: string
          organization_id: string
          registration_number: string | null
          status: string
          team_id: string
          updated_at: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          id?: string
          organization_id: string
          registration_number?: string | null
          status?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          registration_number?: string | null
          status?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "championship_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      championships: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_public: boolean
          name: string
          organization_id: string
          season: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["championship_status"]
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_public?: boolean
          name: string
          organization_id: string
          season?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["championship_status"]
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_public?: boolean
          name?: string
          organization_id?: string
          season?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["championship_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "championships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          athlete_id: string | null
          created_at: string
          created_by: string | null
          id: string
          match_id: string
          minute: number | null
          note: string | null
          organization_id: string
          period: string | null
          team_id: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          match_id: string
          minute?: number | null
          note?: string | null
          organization_id: string
          period?: string | null
          team_id?: string | null
          type: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          athlete_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          match_id?: string
          minute?: number | null
          note?: string | null
          organization_id?: string
          period?: string | null
          team_id?: string | null
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "match_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string | null
          championship_id: string
          created_at: string
          created_by: string | null
          home_score: number | null
          home_team_id: string | null
          id: string
          organization_id: string
          phase: string | null
          round: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id?: string | null
          championship_id: string
          created_at?: string
          created_by?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          organization_id: string
          phase?: string | null
          round?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string | null
          championship_id?: string
          created_at?: string
          created_by?: string | null
          home_score?: number | null
          home_team_id?: string | null
          id?: string
          organization_id?: string
          phase?: string | null
          round?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author: string | null
          body: string | null
          championship_id: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          organization_id: string
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          body?: string | null
          championship_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          organization_id: string
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          body?: string | null
          championship_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          organization_id?: string
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
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
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string
          plan_expires_at: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string
          plan_expires_at?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string
          plan_expires_at?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      referees: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          license_number: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          license_number?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          license_number?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          championship_id: string | null
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          tier: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          championship_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          championship_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          tier?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_responsibles: {
        Row: {
          archived_at: string | null
          created_at: string
          document: string | null
          email: string | null
          full_name: string
          id: string
          is_primary: boolean
          organization_id: string
          phone: string | null
          role: string
          team_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean
          organization_id: string
          phone?: string | null
          role?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          phone?: string | null
          role?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_responsibles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_responsibles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_staff: {
        Row: {
          archived_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          organization_id: string
          phone: string | null
          photo_url: string | null
          role: string
          team_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          role?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          abbreviation: string | null
          category: string | null
          championship_id: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          crest_url: string | null
          description: string | null
          email: string | null
          facebook: string | null
          foundation_year: number | null
          gender: string | null
          history: string | null
          id: string
          instagram: string | null
          internal_notes: string | null
          name: string
          neighborhood: string | null
          organization_id: string
          phone: string | null
          primary_color: string | null
          registration_number: string | null
          secondary_color: string | null
          short_name: string | null
          slug: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          abbreviation?: string | null
          category?: string | null
          championship_id?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          crest_url?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          foundation_year?: number | null
          gender?: string | null
          history?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          name: string
          neighborhood?: string | null
          organization_id: string
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          short_name?: string | null
          slug?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          abbreviation?: string | null
          category?: string | null
          championship_id?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          crest_url?: string | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          foundation_year?: number | null
          gender?: string | null
          history?: string | null
          id?: string
          instagram?: string | null
          internal_notes?: string | null
          name?: string
          neighborhood?: string | null
          organization_id?: string
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          secondary_color?: string | null
          short_name?: string | null
          slug?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_team_responsible: {
        Args: {
          p_championship_id: string
          p_email: string
          p_full_name: string
          p_is_primary: boolean
          p_phone: string
          p_role: string
          p_team_id: string
        }
        Returns: string
      }
      add_team_staff_for_championship: {
        Args: {
          p_championship_id: string
          p_email: string
          p_full_name: string
          p_phone: string
          p_role: string
          p_team_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _org: string
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org: string }; Returns: boolean }
      register_athlete_for_championship: {
        Args: {
          p_birth_date: string
          p_championship_id: string
          p_document_number: string
          p_document_type: string
          p_full_name: string
          p_is_captain: boolean
          p_is_goalkeeper: boolean
          p_photo_url: string
          p_position: string
          p_shirt_number: number
          p_team_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
      championship_status: "draft" | "active" | "finished" | "archived"
      event_type:
        | "goal"
        | "own_goal"
        | "yellow_card"
        | "red_card"
        | "substitution"
        | "assist"
        | "injury"
        | "note"
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
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
} as const
