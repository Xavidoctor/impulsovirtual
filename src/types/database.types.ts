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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_panel_settings: {
        Row: {
          alerts_enabled: boolean
          contact_auto_reply_body: string
          contact_auto_reply_enabled: boolean
          contact_auto_reply_subject: string
          contact_notification_email: string
          contact_notifications_enabled: boolean
          email_daily_limit: number | null
          email_monthly_limit: number | null
          email_provider: string
          id: string
          r2_plan_mode: string
          supabase_plan: string
          updated_at: string
          usage_danger_threshold: number
          usage_warning_threshold: number
          vercel_plan: string
        }
        Insert: {
          alerts_enabled?: boolean
          contact_auto_reply_body: string
          contact_auto_reply_enabled?: boolean
          contact_auto_reply_subject: string
          contact_notification_email: string
          contact_notifications_enabled?: boolean
          email_daily_limit?: number | null
          email_monthly_limit?: number | null
          email_provider?: string
          id?: string
          r2_plan_mode?: string
          supabase_plan?: string
          updated_at?: string
          usage_danger_threshold?: number
          usage_warning_threshold?: number
          vercel_plan?: string
        }
        Update: {
          alerts_enabled?: boolean
          contact_auto_reply_body?: string
          contact_auto_reply_enabled?: boolean
          contact_auto_reply_subject?: string
          contact_notification_email?: string
          contact_notifications_enabled?: boolean
          email_daily_limit?: number | null
          email_monthly_limit?: number | null
          email_provider?: string
          id?: string
          r2_plan_mode?: string
          supabase_plan?: string
          updated_at?: string
          usage_danger_threshold?: number
          usage_warning_threshold?: number
          vercel_plan?: string
        }
        Relationships: []
      }
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      analytics_daily_rollups: {
        Row: {
          contacts: number
          conversion_rate: number
          cta_clicks: number
          date: string
          page_views: number
          sessions: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          contacts?: number
          conversion_rate?: number
          cta_clicks?: number
          date: string
          page_views?: number
          sessions?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          contacts?: number
          conversion_rate?: number
          cta_clicks?: number
          date?: string
          page_views?: number
          sessions?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          page_title: string | null
          path: string
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          value_json: Json
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          page_title?: string | null
          path: string
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value_json?: Json
          visitor_id: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          page_title?: string | null
          path?: string
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          value_json?: Json
          visitor_id?: string
        }
        Relationships: []
      }
      analytics_monthly_rollups: {
        Row: {
          contacts: number
          conversion_rate: number
          cta_clicks: number
          month: string
          page_views: number
          sessions: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          contacts?: number
          conversion_rate?: number
          cta_clicks?: number
          month: string
          page_views?: number
          sessions?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          contacts?: number
          conversion_rate?: number
          cta_clicks?: number
          month?: string
          page_views?: number
          sessions?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          is_featured: boolean
          is_published: boolean
          og_image_url: string | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          og_image_url?: string | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_assets: {
        Row: {
          alt_text: string | null
          bucket_name: string
          caption: string | null
          content_type: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_size: number | null
          filename: string
          height: number | null
          id: string
          kind: string
          logical_collection: string
          public_url: string
          storage_key: string
          storage_provider: string
          tags: string[]
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket_name?: string
          caption?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          filename: string
          height?: number | null
          id?: string
          kind: string
          logical_collection?: string
          public_url: string
          storage_key: string
          storage_provider?: string
          tags?: string[]
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket_name?: string
          caption?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          filename?: string
          height?: number | null
          id?: string
          kind?: string
          logical_collection?: string
          public_url?: string
          storage_key?: string
          storage_provider?: string
          tags?: string[]
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          notes: string | null
          phone: string | null
          service_interest: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          notes?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          notes?: string | null
          phone?: string | null
          service_interest?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      platform_alerts: {
        Row: {
          created_at: string
          current_percent: number
          help_copy: string
          id: string
          message: string
          metric_key: string
          platform: string
          severity: string
          status: string
          threshold_percent: number
        }
        Insert: {
          created_at?: string
          current_percent: number
          help_copy: string
          id?: string
          message: string
          metric_key: string
          platform: string
          severity: string
          status?: string
          threshold_percent: number
        }
        Update: {
          created_at?: string
          current_percent?: number
          help_copy?: string
          id?: string
          message?: string
          metric_key?: string
          platform?: string
          severity?: string
          status?: string
          threshold_percent?: number
        }
        Relationships: []
      }
      platform_usage_snapshots: {
        Row: {
          bucket_or_project: string | null
          created_at: string
          id: string
          meta_json: Json
          metric_key: string
          metric_unit: string
          metric_value: number
          period_end: string | null
          period_start: string | null
          platform: string
          source: string
        }
        Insert: {
          bucket_or_project?: string | null
          created_at?: string
          id?: string
          meta_json?: Json
          metric_key: string
          metric_unit: string
          metric_value?: number
          period_end?: string | null
          period_start?: string | null
          platform: string
          source?: string
        }
        Update: {
          bucket_or_project?: string | null
          created_at?: string
          id?: string
          meta_json?: Json
          metric_key?: string
          metric_unit?: string
          metric_value?: number
          period_end?: string | null
          period_start?: string | null
          platform?: string
          source?: string
        }
        Relationships: []
      }
      project_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          duration_seconds: number | null
          height: number | null
          id: string
          kind: string
          project_id: string
          public_url: string
          role: string
          sort_order: number
          storage_key: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind: string
          project_id: string
          public_url: string
          role: string
          sort_order?: number
          storage_key: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          height?: number | null
          id?: string
          kind?: string
          project_id?: string
          public_url?: string
          role?: string
          sort_order?: number
          storage_key?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          challenge: string | null
          client_name: string | null
          company_logo_url: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          excerpt: string
          featured: boolean
          id: string
          is_published: boolean
          live_url: string | null
          preview_image_url: string | null
          preview_mode: string
          progress_label: string | null
          progress_note: string | null
          progress_percentage: number | null
          project_orientation: string | null
          published_at: string | null
          results: string | null
          seo_description: string | null
          seo_title: string | null
          services_applied: string[]
          slug: string
          solution: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          website_url: string | null
          what_was_done: string | null
        }
        Insert: {
          challenge?: string | null
          client_name?: string | null
          company_logo_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          excerpt?: string
          featured?: boolean
          id?: string
          is_published?: boolean
          live_url?: string | null
          preview_image_url?: string | null
          preview_mode?: string
          progress_label?: string | null
          progress_note?: string | null
          progress_percentage?: number | null
          project_orientation?: string | null
          published_at?: string | null
          results?: string | null
          seo_description?: string | null
          seo_title?: string | null
          services_applied?: string[]
          slug: string
          solution?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          website_url?: string | null
          what_was_done?: string | null
        }
        Update: {
          challenge?: string | null
          client_name?: string | null
          company_logo_url?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          excerpt?: string
          featured?: boolean
          id?: string
          is_published?: boolean
          live_url?: string | null
          preview_image_url?: string | null
          preview_mode?: string
          progress_label?: string | null
          progress_note?: string | null
          progress_percentage?: number | null
          project_orientation?: string | null
          published_at?: string | null
          results?: string | null
          seo_description?: string | null
          seo_title?: string | null
          services_applied?: string[]
          slug?: string
          solution?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          website_url?: string | null
          what_was_done?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          budget_range: string | null
          company: string | null
          created_at: string
          deadline: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          project_summary: string
          project_type: string | null
          references: string | null
          requested_services: string[]
          status: Database["public"]["Enums"]["quote_request_status"]
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          deadline?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_summary: string
          project_type?: string | null
          references?: string | null
          requested_services?: string[]
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          deadline?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          project_summary?: string
          project_type?: string | null
          references?: string | null
          requested_services?: string[]
          status?: Database["public"]["Enums"]["quote_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          cover_image_url: string | null
          created_at: string
          featured: boolean
          full_description: string
          icon_name: string | null
          id: string
          is_published: boolean
          seo_description: string | null
          seo_title: string | null
          short_description: string
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          full_description: string
          icon_name?: string | null
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description: string
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          featured?: boolean
          full_description?: string
          icon_name?: string | null
          id?: string
          is_published?: boolean
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          behance_url: string | null
          business_name: string
          contact_email: string | null
          contact_phone: string | null
          default_og_image_url: string | null
          default_seo_description: string | null
          default_seo_title: string | null
          hero_cta_primary: string | null
          hero_cta_secondary: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          location: string | null
          updated_at: string
          whatsapp_url: string | null
        }
        Insert: {
          behance_url?: string | null
          business_name: string
          contact_email?: string | null
          contact_phone?: string | null
          default_og_image_url?: string | null
          default_seo_description?: string | null
          default_seo_title?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Update: {
          behance_url?: string | null
          business_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          default_og_image_url?: string | null
          default_seo_description?: string | null
          default_seo_title?: string | null
          hero_cta_primary?: string | null
          hero_cta_secondary?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          quote: string
          role: string | null
          sort_order: number
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          quote: string
          role?: string | null
          sort_order?: number
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          quote?: string
          role?: string | null
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_database_size_bytes: { Args: never; Returns: number }
      get_monthly_active_users_estimate: { Args: never; Returns: number }
      get_storage_usage_summary: { Args: never; Returns: Json }
      is_admin_user: { Args: never; Returns: boolean }
      is_editor_user: { Args: never; Returns: boolean }
      refresh_analytics_rollups: {
        Args: { p_from?: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "admin" | "editor"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "closed_won"
        | "closed_lost"
        | "spam"
      project_status: "completed" | "in_progress"
      quote_request_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "closed_won"
        | "closed_lost"
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
      admin_role: ["admin", "editor"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "closed_won",
        "closed_lost",
        "spam",
      ],
      project_status: ["completed", "in_progress"],
      quote_request_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "closed_won",
        "closed_lost",
      ],
    },
  },
} as const
