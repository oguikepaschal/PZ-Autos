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
      car_images: {
        Row: {
          alt_text: string | null
          car_id: string
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          car_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          car_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_cars_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_featured_cars_view"
            referencedColumns: ["id"]
          },
        ]
      }
      card_taps: {
        Row: {
          car_id: string
          created_at: string
          id: string
        }
        Insert: {
          car_id: string
          created_at?: string
          id?: string
        }
        Update: {
          car_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_taps_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_taps_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_cars_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_taps_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_featured_cars_view"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          acquisition_notes: string | null
          archive_reason: string | null
          asking_price_ngn: number
          body_type: string | null
          condition: string | null
          cost_price_ngn: number | null
          created_at: string
          description: string | null
          drivetrain: string | null
          engine_layout: string | null
          exterior_colour: string | null
          featured_order: number | null
          fuel_type: string | null
          id: string
          interior_colour: string | null
          is_featured: boolean
          key_features: string[] | null
          last_verified_at: string
          location_area: string | null
          make: string
          mileage_km: number | null
          model: string
          registration_plate: string | null
          slug: string
          status: string
          status_changed_at: string
          supplier_id: string
          transmission: string | null
          trim: string | null
          updated_at: string
          variant: string | null
          vin: string | null
          year: number
        }
        Insert: {
          acquisition_notes?: string | null
          archive_reason?: string | null
          asking_price_ngn: number
          body_type?: string | null
          condition?: string | null
          cost_price_ngn?: number | null
          created_at?: string
          description?: string | null
          drivetrain?: string | null
          engine_layout?: string | null
          exterior_colour?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          id?: string
          interior_colour?: string | null
          is_featured?: boolean
          key_features?: string[] | null
          last_verified_at?: string
          location_area?: string | null
          make: string
          mileage_km?: number | null
          model: string
          registration_plate?: string | null
          slug: string
          status?: string
          status_changed_at?: string
          supplier_id: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
          year: number
        }
        Update: {
          acquisition_notes?: string | null
          archive_reason?: string | null
          asking_price_ngn?: number
          body_type?: string | null
          condition?: string | null
          cost_price_ngn?: number | null
          created_at?: string
          description?: string | null
          drivetrain?: string | null
          engine_layout?: string | null
          exterior_colour?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          id?: string
          interior_colour?: string | null
          is_featured?: boolean
          key_features?: string[] | null
          last_verified_at?: string
          location_area?: string | null
          make?: string
          mileage_km?: number | null
          model?: string
          registration_plate?: string | null
          slug?: string
          status?: string
          status_changed_at?: string
          supplier_id?: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          variant?: string | null
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cars_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          car_id: string | null
          created_at: string
          id: string
          message: string | null
          name: string | null
          phone: string | null
          source: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          car_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_cars_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enquiries_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_featured_cars_view"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          supplier_type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          supplier_type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          supplier_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_car_images_view: {
        Row: {
          alt_text: string | null
          car_id: string | null
          id: string | null
          is_cover: boolean | null
          sort_order: number | null
          storage_path: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_cars_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_images_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "public_featured_cars_view"
            referencedColumns: ["id"]
          },
        ]
      }
      public_cars_view: {
        Row: {
          asking_price_ngn: number | null
          body_type: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          drivetrain: string | null
          engine_layout: string | null
          exterior_colour: string | null
          featured_order: number | null
          fuel_type: string | null
          id: string | null
          interior_colour: string | null
          is_featured: boolean | null
          key_features: string[] | null
          last_verified_at: string | null
          location_area: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          slug: string | null
          status: string | null
          status_changed_at: string | null
          transmission: string | null
          trim: string | null
          updated_at: string | null
          variant: string | null
          year: number | null
        }
        Insert: {
          asking_price_ngn?: number | null
          body_type?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          drivetrain?: string | null
          engine_layout?: string | null
          exterior_colour?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          id?: string | null
          interior_colour?: string | null
          is_featured?: boolean | null
          key_features?: string[] | null
          last_verified_at?: string | null
          location_area?: string | null
          make?: string | null
          mileage_km?: number | null
          model?: string | null
          slug?: string | null
          status?: string | null
          status_changed_at?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string | null
          variant?: string | null
          year?: number | null
        }
        Update: {
          asking_price_ngn?: number | null
          body_type?: string | null
          condition?: string | null
          created_at?: string | null
          description?: string | null
          drivetrain?: string | null
          engine_layout?: string | null
          exterior_colour?: string | null
          featured_order?: number | null
          fuel_type?: string | null
          id?: string | null
          interior_colour?: string | null
          is_featured?: boolean | null
          key_features?: string[] | null
          last_verified_at?: string | null
          location_area?: string | null
          make?: string | null
          mileage_km?: number | null
          model?: string | null
          slug?: string | null
          status?: string | null
          status_changed_at?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string | null
          variant?: string | null
          year?: number | null
        }
        Relationships: []
      }
      public_featured_cars_view: {
        Row: {
          asking_price_ngn: number | null
          body_type: string | null
          condition: string | null
          created_at: string | null
          description: string | null
          drivetrain: string | null
          engine_layout: string | null
          exterior_colour: string | null
          featured_order: number | null
          fuel_type: string | null
          id: string | null
          interior_colour: string | null
          is_featured: boolean | null
          key_features: string[] | null
          last_verified_at: string | null
          location_area: string | null
          make: string | null
          mileage_km: number | null
          model: string | null
          slug: string | null
          status: string | null
          status_changed_at: string | null
          transmission: string | null
          trim: string | null
          updated_at: string | null
          variant: string | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      car_is_publicly_visible: {
        Args: { c: Database["public"]["Tables"]["cars"]["Row"] }
        Returns: boolean
      }
      create_car_with_images: {
        Args: { p_car: Json; p_images: Json }
        Returns: string
      }
      is_owner: { Args: never; Returns: boolean }
      reorder_featured: {
        Args: { p_ordered_ids: string[] }
        Returns: undefined
      }
      save_car_images: {
        Args: { p_car_id: string; p_images: Json }
        Returns: string[]
      }
      set_car_featured: {
        Args: { p_car_id: string; p_featured: boolean }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
