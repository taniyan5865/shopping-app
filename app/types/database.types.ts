export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
        Relationships: []
      }
      household_members: {
        Row: {
          household_id: string
          user_id: string
          display_name: string
          joined_at: string
        }
        Insert: {
          household_id: string
          user_id: string
          display_name?: string
          joined_at?: string
        }
        Update: {
          household_id?: string
          user_id?: string
          display_name?: string
          joined_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          household_id: string
          name: string
          category: string | null
          quantity: number
          unit: string
          expiry_date: string | null
          expiry_type: '賞味期限' | '消費期限'
          location: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          category?: string | null
          quantity?: number
          unit?: string
          expiry_date?: string | null
          expiry_type?: '賞味期限' | '消費期限'
          location?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          category?: string | null
          quantity?: number
          unit?: string
          expiry_date?: string | null
          expiry_type?: '賞味期限' | '消費期限'
          location?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          id: string
          household_id: string
          name: string
          quantity: number
          unit: string
          checked: boolean
          note: string | null
          added_by: string | null
          source: 'manual' | 'suggested'
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          quantity?: number
          unit?: string
          checked?: boolean
          note?: string | null
          added_by?: string | null
          source?: 'manual' | 'suggested'
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          quantity?: number
          unit?: string
          checked?: boolean
          note?: string | null
          added_by?: string | null
          source?: 'manual' | 'suggested'
          created_at?: string
        }
        Relationships: []
      }
      purchase_history: {
        Row: {
          id: string
          household_id: string
          item_name: string
          category: string | null
          price: number | null
          store: string | null
          purchased_at: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          item_name: string
          category?: string | null
          price?: number | null
          store?: string | null
          purchased_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          item_name?: string
          category?: string | null
          price?: number | null
          store?: string | null
          purchased_at?: string
          created_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          household_id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_household: {
        Args: { household_name: string; member_name?: string }
        Returns: { id: string; invite_code: string }[]
      }
      join_household: {
        Args: { code: string; member_name?: string }
        Returns: { id: string; name: string }[]
      }
      my_household_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
      generate_invite_code: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
