// Bu dosya normalde Supabase CLI ile OTOMATİK üretilir ve elle düzenlenmez:
//   supabase gen types typescript --linked > src/lib/supabase/types.ts
// Migration dosyaları (supabase/migrations/*.sql) değiştiğinde bu komutu
// tekrar çalıştırın. Aşağıdaki tipler, 0001-0004 migration'larıyla senkronizedir
// ve frontend<->backend arasında uçtan uca tip güvenliği sağlar.
//
// ÖNEMLİ: @supabase/postgrest-js'in GenericTable tipi (node_modules/@supabase/
// postgrest-js/src/types/common/common.ts) her tabloda bir `Relationships:
// GenericRelationship[]` alanı ZORUNLU kılar. Bu alan eksik bırakılırsa
// (önceki sürümde olduğu gibi) tablo bu şemaya UYMAZ ve `.from()`/`.rpc()`
// zincirindeki tüm satır tipleri sessizce `never`'a düşer — her sütuna
// erişim "Property X does not exist on type 'never'" hatası verir. Bu yüzden
// her tabloda, gerçek şemadaki (migration 0001) foreign key'lere birebir
// karşılık gelen bir Relationships dizisi bulunur.

export type UserRole = 'admin' | 'moderator' | 'user';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type ProductForm =
  | 'toz' | 'tane' | 'yaprak' | 'cicek' | 'kok' | 'kabuk' | 'yag' | 'sivi' | 'recine' | 'sabun' | 'macun' | 'diger';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          marketing_consent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: []; // id -> auth.users.id (auth şeması bu tipte modellenmiyor)
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          phone: string;
          city: string;
          district: string;
          address_line: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['addresses']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      categories: {
        Row: { id: string; slug: string; name: string; sort_order: number; is_active: boolean; created_at: string };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'is_active'> & {
          id?: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name: string;
          description: string;
          image_path: string;
          badges: string[];
          is_active: boolean;
          form: ProductForm | null;
          origin: string | null;
          storage_info: string;
          allergen_info: string | null;
          shelf_life_note: string | null;
          created_at: string;
          updated_at: string;
          /** GENERATED ALWAYS AS ... STORED — salt okunur, asla INSERT/UPDATE ile yazılmaz. */
          search_vector: unknown;
        };
        Insert: Omit<
          Database['public']['Tables']['products']['Row'],
          'id' | 'created_at' | 'updated_at' | 'search_vector' | 'is_active' | 'form' | 'origin' | 'storage_info' | 'allergen_info' | 'shelf_life_note'
        > & {
          id?: string;
          is_active?: boolean;
          form?: ProductForm | null;
          origin?: string | null;
          storage_info?: string;
          allergen_info?: string | null;
          shelf_life_note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          label: string;
          price_cents: number;
          stock: number;
          sort_order: number;
          lot_no: string | null;
          expiry_date: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'lot_no' | 'expiry_date'> & {
          id?: string;
          lot_no?: string | null;
          expiry_date?: string | null;
        };
        Update: Partial<Database['public']['Tables']['product_variants']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      carts: {
        Row: { user_id: string; updated_at: string };
        Insert: { user_id: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['carts']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'carts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      cart_items: {
        Row: { id: string; user_id: string; variant_id: string; quantity: number; created_at: string };
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['cart_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'cart_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          status: OrderStatus;
          subtotal_cents: number;
          shipping_cents: number;
          total_cents: number;
          currency: string;
          shipping_address: {
            full_name: string;
            phone: string;
            city: string;
            district: string;
            address_line: string;
          };
          billing_address: {
            full_name: string;
            phone: string;
            city: string;
            district: string;
            address_line: string;
          } | null;
          payment_provider: string;
          payment_conversation_id: string | null;
          payment_ref: string | null;
          contact_email: string;
          contact_phone: string;
          shipping_carrier: string | null;
          tracking_number: string | null;
          shipped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['orders']['Row'],
          'id' | 'created_at' | 'updated_at' | 'billing_address' | 'shipping_carrier' | 'tracking_number' | 'shipped_at'
        > & {
          id?: string;
          billing_address?: Database['public']['Tables']['orders']['Row']['billing_address'];
          shipping_carrier?: string | null;
          tracking_number?: string | null;
          shipped_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string;
          product_name_snapshot: string;
          variant_label_snapshot: string;
          unit_price_cents: number;
          quantity: number;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['order_items']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          }
        ];
      };
      webhook_events: {
        Row: { id: string; provider: string; event_id: string; payload: unknown; processed_at: string };
        Insert: Omit<Database['public']['Tables']['webhook_events']['Row'], 'id' | 'processed_at'> & {
          id?: string;
          processed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['webhook_events']['Row']>;
        Relationships: [];
      };
      data_requests: {
        Row: {
          id: string;
          user_id: string | null;
          user_email_snapshot: string;
          type: 'export' | 'delete';
          status: 'pending' | 'completed' | 'failed';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['data_requests']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['data_requests']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'data_requests_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      site_settings: {
        Row: {
          id: boolean;
          logo_path: string | null;
          bank_account_holder: string | null;
          bank_name: string | null;
          bank_iban: string | null;
          bank_note: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          order_id: string | null;
          rating: number;
          title: string | null;
          body: string;
          author_name: string;
          status: ReviewStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at' | 'updated_at' | 'status' | 'author_name'> & {
          id?: string;
          status?: ReviewStatus;
          author_name?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
        Relationships: [
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    // `supabase gen types typescript` her zaman Views/Enums/CompositeTypes anahtarlarını
    // BOŞ olsa dahi üretir — postgrest-js'in GenericSchema kısıtı bu anahtarların
    // VAR OLMASINI gerektirir (bkz. dosya başındaki not).
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      // supabase/migrations/0004_create_order_rpc.sql ile birebir eşleşir.
      create_order: {
        Args: {
          p_items: { variant_id: string; quantity: number }[];
          p_shipping_address: {
            full_name: string;
            phone: string;
            city: string;
            district: string;
            address_line: string;
          };
          p_contact_email: string;
          p_contact_phone: string;
          p_payment_provider: string;
          p_user_id: string | null;
        };
        Returns: {
          order_id: string;
          order_number: string;
          subtotal_cents: number;
          shipping_cents: number;
          total_cents: number;
        }[];
      };
      mark_order_paid: { Args: { p_order_id: string; p_payment_ref: string }; Returns: undefined };
      mark_order_failed: { Args: { p_order_id: string }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
export type OrderRow = Database['public']['Tables']['orders']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type SiteSettingsRow = Database['public']['Tables']['site_settings']['Row'];
