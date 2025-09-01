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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          color: string
          created_at: string | null
          display_order: number | null
          icon: string
          id: string
          name: string
          payment_method_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          color: string
          created_at?: string | null
          display_order?: number | null
          icon: string
          id?: string
          name: string
          payment_method_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          color?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          name?: string
          payment_method_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          display_order: number | null
          icon: string
          id: string
          name: string
          nature: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          display_order?: number | null
          icon: string
          id?: string
          name: string
          nature: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number | null
          icon?: string
          id?: string
          name?: string
          nature?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          contact_type: string
          created_at: string
          email: string | null
          id: string
          identification_number: string | null
          image_url: string | null
          internal_notes: string | null
          mobile: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_type: string
          created_at?: string
          email?: string | null
          id?: string
          identification_number?: string | null
          image_url?: string | null
          internal_notes?: string | null
          mobile?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_type?: string
          created_at?: string
          email?: string | null
          id?: string
          identification_number?: string | null
          image_url?: string | null
          internal_notes?: string | null
          mobile?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      dashboard_card_preferences: {
        Row: {
          card_id: string
          card_type: string
          created_at: string
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          card_id: string
          card_type: string
          created_at?: string
          id?: string
          position: number
          title: string
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          card_id?: string
          card_type?: string
          created_at?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      debt_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          debt_id: string
          description: string | null
          id: string
          payment_date: string
          transaction_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          debt_id: string
          description?: string | null
          id?: string
          payment_date?: string
          transaction_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          debt_id?: string
          description?: string | null
          id?: string
          payment_date?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          account_id: string
          contact_id: string
          created_at: string
          current_balance: number
          debt_date: string
          description: string
          due_date: string | null
          id: string
          initial_amount: number
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          contact_id: string
          created_at?: string
          current_balance?: number
          debt_date: string
          description: string
          due_date?: string | null
          id?: string
          initial_amount: number
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          contact_id?: string
          created_at?: string
          current_balance?: number
          debt_date?: string
          description?: string
          due_date?: string | null
          id?: string
          initial_amount?: number
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_categories: {
        Row: {
          category_id: string
          filter_id: string
        }
        Insert: {
          category_id: string
          filter_id: string
        }
        Update: {
          category_id?: string
          filter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_categories_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_tags: {
        Row: {
          filter_id: string
          tag_id: string
        }
        Insert: {
          filter_id: string
          tag_id: string
        }
        Update: {
          filter_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_tags_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          created_at: string | null
          debts: string | null
          id: string
          name: string
          payment_method: string | null
          transfers: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          debts?: string | null
          id?: string
          name: string
          payment_method?: string | null
          transfers?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          debts?: string | null
          id?: string
          name?: string
          payment_method?: string | null
          transfers?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          quantity: number
          subcategory_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          quantity?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          quantity?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      scheduled_payments: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          end_count: number | null
          end_date: string | null
          end_type: string | null
          frequency_type: string
          id: string
          is_active: boolean | null
          name: string
          next_payment_date: string | null
          note: string | null
          notification_days: number | null
          payment_method: string | null
          recurrence_day_option: string | null
          recurrence_interval: number | null
          recurrence_pattern: string | null
          start_date: string
          tags: string[] | null
          to_account_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          end_count?: number | null
          end_date?: string | null
          end_type?: string | null
          frequency_type: string
          id?: string
          is_active?: boolean | null
          name: string
          next_payment_date?: string | null
          note?: string | null
          notification_days?: number | null
          payment_method?: string | null
          recurrence_day_option?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          start_date: string
          tags?: string[] | null
          to_account_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          end_count?: number | null
          end_date?: string | null
          end_type?: string | null
          frequency_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          next_payment_date?: string | null
          note?: string | null
          notification_days?: number | null
          payment_method?: string | null
          recurrence_day_option?: string | null
          recurrence_interval?: number | null
          recurrence_pattern?: string | null
          start_date?: string
          tags?: string[] | null
          to_account_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          icon: string
          id: string
          name: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          icon?: string
          id?: string
          name: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          icon?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      template_tags: {
        Row: {
          tag_id: string
          template_id: string
        }
        Insert: {
          tag_id: string
          template_id: string
        }
        Update: {
          tag_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_tags_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          account_id: string | null
          amount: number
          beneficiary: string | null
          category_id: string | null
          created_at: string | null
          id: string
          name: string
          note: string | null
          payment_method: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          beneficiary?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          note?: string | null
          payment_method?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          beneficiary?: string | null
          category_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          note?: string | null
          payment_method?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          beneficiary: string | null
          category_id: string | null
          contact_id: string | null
          created_at: string
          debt_id: string | null
          description: string
          id: string
          location: string | null
          note: string | null
          payer_contact_id: string | null
          payment_method: string | null
          subcategory_id: string | null
          tags: string | null
          to_account_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          beneficiary?: string | null
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          debt_id?: string | null
          description: string
          id?: string
          location?: string | null
          note?: string | null
          payer_contact_id?: string | null
          payment_method?: string | null
          subcategory_id?: string | null
          tags?: string | null
          to_account_id?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          beneficiary?: string | null
          category_id?: string | null
          contact_id?: string | null
          created_at?: string
          debt_id?: string | null
          description?: string
          id?: string
          location?: string | null
          note?: string | null
          payer_contact_id?: string | null
          payment_method?: string | null
          subcategory_id?: string | null
          tags?: string | null
          to_account_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          debts: boolean | null
          id: string
          income: boolean | null
          scheduled_payments: boolean | null
          updated_at: string | null
          user_id: string
          wallet_reminder: boolean | null
          card_reminders: boolean | null
          inventory_alerts: boolean | null
          contact_notifications: boolean | null
          reports_notifications: boolean | null
          system_updates: boolean | null
          security_alerts: boolean | null
        }
        Insert: {
          created_at?: string | null
          debts?: boolean | null
          id?: string
          income?: boolean | null
          scheduled_payments?: boolean | null
          updated_at?: string | null
          user_id: string
          wallet_reminder?: boolean | null
          card_reminders?: boolean | null
          inventory_alerts?: boolean | null
          contact_notifications?: boolean | null
          reports_notifications?: boolean | null
          system_updates?: boolean | null
          security_alerts?: boolean | null
        }
        Update: {
          created_at?: string | null
          debts?: boolean | null
          id?: string
          income?: boolean | null
          scheduled_payments?: boolean | null
          updated_at?: string | null
          user_id?: string
          wallet_reminder?: boolean | null
          card_reminders?: boolean | null
          inventory_alerts?: boolean | null
          contact_notifications?: boolean | null
          reports_notifications?: boolean | null
          system_updates?: boolean | null
          security_alerts?: boolean | null
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
  public: {
    Enums: {},
  },
} as const
