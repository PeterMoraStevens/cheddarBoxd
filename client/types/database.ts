export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          is_private?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          requester_id: string
          requested_id: string
          created_at: string
        }
        Insert: {
          requester_id: string
          requested_id: string
          created_at?: string
        }
        Update: {
          requester_id?: string
          requested_id?: string
          created_at?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          product_barcode: string
          product_name: string
          product_brand: string | null
          product_image_url: string | null
          rating: number | null
          body: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_barcode: string
          product_name: string
          product_brand?: string | null
          product_image_url?: string | null
          rating?: number | null
          body?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          product_name?: string
          product_brand?: string | null
          product_image_url?: string | null
          rating?: number | null
          body?: string | null
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      review_likes: {
        Row: {
          user_id: string
          review_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          review_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          review_id?: string
          created_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          user_id: string
          review_id: string
          body: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          review_id: string
          body: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          body?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_snacks: {
        Row: {
          user_id: string
          product_barcode: string
          product_name: string
          product_brand: string | null
          product_image_url: string | null
          display_order: number
        }
        Insert: {
          user_id: string
          product_barcode: string
          product_name: string
          product_brand?: string | null
          product_image_url?: string | null
          display_order: number
        }
        Update: {
          product_name?: string
          product_brand?: string | null
          product_image_url?: string | null
          display_order?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string
          name: string
          brand: string | null
          image_url: string | null
          categories_tags: string[] | null
          countries_tags: string[] | null
          countries: string[] | null
          nutriscore_grade: string | null
          nova_group: number | null
          quantity: string | null
          energy_kcal_100g: number | null
          proteins_100g: number | null
          carbohydrates_100g: number | null
          fat_100g: number | null
          search_vector: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          barcode: string
          name: string
          brand?: string | null
          image_url?: string | null
          categories_tags?: string[] | null
          countries_tags?: string[] | null
          countries?: string[] | null
          nutriscore_grade?: string | null
          nova_group?: number | null
          quantity?: string | null
          energy_kcal_100g?: number | null
          proteins_100g?: number | null
          carbohydrates_100g?: number | null
          fat_100g?: number | null
        }
        Update: {
          name?: string
          brand?: string | null
          image_url?: string | null
          categories_tags?: string[] | null
          countries_tags?: string[] | null
          countries?: string[] | null
          nutriscore_grade?: string | null
          nova_group?: number | null
          quantity?: string | null
          energy_kcal_100g?: number | null
          proteins_100g?: number | null
          carbohydrates_100g?: number | null
          fat_100g?: number | null
        }
        Relationships: []
      }
      want_to_try: {
        Row: {
          user_id: string
          product_barcode: string
          product_name: string
          product_brand: string | null
          product_image_url: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          product_barcode: string
          product_name: string
          product_brand?: string | null
          product_image_url?: string | null
          created_at?: string
        }
        Update: {
          product_name?: string
          product_brand?: string | null
          product_image_url?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type FollowRequest = Database['public']['Tables']['follow_requests']['Row']
export type FavoriteSnack = Database['public']['Tables']['favorite_snacks']['Row']
export type WantToTry = Database['public']['Tables']['want_to_try']['Row']

export type ReviewWithProfile = Review & {
  profiles: Profile
  review_likes: { user_id: string }[]
  comments: { id: string }[]
}
