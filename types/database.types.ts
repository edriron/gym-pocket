export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weight_records: {
        Row: {
          id: string
          user_id: string
          recorded_at: string
          weight_kg: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recorded_at: string
          weight_kg: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recorded_at?: string
          weight_kg?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          created_by: string
          name: string
          description: string | null
          calories: number
          carbs_g: number
          protein_g: number
          fats_g: number
          serving_size_g: number | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          description?: string | null
          calories?: number
          carbs_g?: number
          protein_g?: number
          fats_g?: number
          serving_size_g?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          description?: string | null
          calories?: number
          carbs_g?: number
          protein_g?: number
          fats_g?: number
          serving_size_g?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          created_by: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          product_id: string | null
          sub_recipe_id: string | null
          quantity_g: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          product_id?: string | null
          sub_recipe_id?: string | null
          quantity_g: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          product_id?: string | null
          sub_recipe_id?: string | null
          quantity_g?: number
          created_at?: string
        }
      }
      diet_tables: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      diet_sections: {
        Row: {
          id: string
          diet_table_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          diet_table_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          diet_table_id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
      }
      diet_rows: {
        Row: {
          id: string
          section_id: string
          product_id: string | null
          recipe_id: string | null
          quantity_g: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          section_id: string
          product_id?: string | null
          recipe_id?: string | null
          quantity_g?: number
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          product_id?: string | null
          recipe_id?: string | null
          quantity_g?: number
          sort_order?: number
          created_at?: string
        }
      }
      workout_tables: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_table_id: string
          name: string
          sets: number
          reps: number
          calories: number | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_table_id: string
          name: string
          sets: number
          reps: number
          calories?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_table_id?: string
          name?: string
          sets?: number
          reps?: number
          calories?: number | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      table_shares: {
        Row: {
          id: string
          table_type: 'diet' | 'workout'
          table_id: string
          owner_id: string
          shared_with_id: string
          access_mode: 'view' | 'edit'
          created_at: string
        }
        Insert: {
          id?: string
          table_type: 'diet' | 'workout'
          table_id: string
          owner_id: string
          shared_with_id: string
          access_mode?: 'view' | 'edit'
          created_at?: string
        }
        Update: {
          id?: string
          table_type?: 'diet' | 'workout'
          table_id?: string
          owner_id?: string
          shared_with_id?: string
          access_mode?: 'view' | 'edit'
          created_at?: string
        }
      }
    }
    Functions: {
      get_recipe_nutrition: {
        Args: { p_recipe_id: string }
        Returns: {
          calories: number
          carbs_g: number
          protein_g: number
          fats_g: number
          total_weight_g: number
        }[]
      }
      get_user_id_by_email: {
        Args: { p_email: string }
        Returns: string | null
      }
    }
    Enums: {
      share_access: 'view' | 'edit'
      share_table_type: 'diet' | 'workout'
    }
  }
}
