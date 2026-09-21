export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type BookingServiceType = "movers_and_truck" | "crew_only";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          created_at: string;
          status: BookingStatus;
          confirmed_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          requested_date: string;
          requested_time: string;
          pickup_address: string;
          destination_address: string;
          service_type: BookingServiceType;
          crew_size: number;
          estimated_hours: number;
          round_trip_miles: number;
          hourly_rate: number | null;
          estimated_labor_cost: number | null;
          travel_fee: number | null;
          estimated_base_total: number | null;
          has_piano: boolean;
          has_gun_safe: boolean;
          has_heavy_item: boolean;
          has_excessive_stairs: boolean;
          has_long_carry: boolean;
          move_notes: string | null;
          admin_notes: string | null;
          terms_accepted: boolean;
          terms_accepted_at: string | null;
          terms_version: string | null;
          deposit_percentage: number;
          deposit_amount_cents: number | null;
          payment_status: PaymentStatus;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          deposit_paid_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status?: BookingStatus;
          confirmed_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          requested_date: string;
          requested_time: string;
          pickup_address: string;
          destination_address: string;
          service_type: BookingServiceType;
          crew_size: number;
          estimated_hours: number;
          round_trip_miles: number;
          hourly_rate: number | null;
          estimated_labor_cost: number | null;
          travel_fee: number | null;
          estimated_base_total: number | null;
          has_piano?: boolean;
          has_gun_safe?: boolean;
          has_heavy_item?: boolean;
          has_excessive_stairs?: boolean;
          has_long_carry?: boolean;
          move_notes?: string | null;
          admin_notes?: string | null;
          terms_accepted?: boolean;
          terms_accepted_at?: string | null;
          terms_version?: string | null;
          deposit_percentage?: number;
          deposit_amount_cents?: number | null;
          payment_status?: PaymentStatus;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          deposit_paid_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      booking_photos: {
        Row: {
          id: string;
          booking_id: string;
          created_at: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
        };
        Insert: {
          id?: string;
          booking_id: string;
          created_at?: string;
          storage_path: string;
          original_name: string;
          mime_type: string;
          size_bytes: number;
        };
        Update: Partial<Database["public"]["Tables"]["booking_photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "booking_photos_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_blocks: {
        Row: {
          id: string;
          created_at: string;
          created_by: string;
          blocked_date: string;
          blocked_time: string | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          created_by: string;
          blocked_date: string;
          blocked_time?: string | null;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["schedule_blocks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
